const form = document.getElementById("note-form");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const notesList = document.getElementById("notes-list");
const dueDateInput = document.getElementById("due-date");
const upcomingList = document.getElementById("upcoming-list");
const selectedColorInput = document.getElementById("selected-color");
const createSwatches = document.querySelectorAll("#create-swatches .swatch");

// Modal elements
const modalOverlay = document.getElementById("edit-modal-overlay");
const editTitleInput = document.getElementById("edit-title");
const editContentInput = document.getElementById("edit-content");
const editDueDateInput = document.getElementById("edit-due-date");
const editSelectedColorInput = document.getElementById("edit-selected-color");
const editSwatches = document.querySelectorAll("#edit-swatches .swatch");
const saveEditBtn = document.getElementById("save-edit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

let currentEditId = null;

// --- Color swatch selection (create form) ---
createSwatches.forEach(swatch => {
    swatch.addEventListener("click", () => {
        createSwatches.forEach(s => s.classList.remove("selected"));
        swatch.classList.add("selected");
        selectedColorInput.value = swatch.dataset.color;
    });
});

// --- Color swatch selection (edit modal) ---
editSwatches.forEach(swatch => {
    swatch.addEventListener("click", () => {
        editSwatches.forEach(s => s.classList.remove("selected"));
        swatch.classList.add("selected");
        editSelectedColorInput.value = swatch.dataset.color;
    });
});

// Fetches notes from the server and displays them
async function loadNotes() {
    const response = await fetch("/notes");
    const notes = await response.json();

    notesList.innerHTML = "";

    notes.forEach(note => {
        const noteDiv = document.createElement("div");
        noteDiv.className = "note";
        noteDiv.style.backgroundColor = note.color || "#FFF9B0";

        const titleEl = document.createElement("h3");
        titleEl.textContent = note.title;

        const contentEl = document.createElement("p");
        contentEl.textContent = note.content;

        noteDiv.appendChild(titleEl);
        noteDiv.appendChild(contentEl);

        if (note.due_date) {
            const dueTag = document.createElement("span");
            dueTag.className = "due-date-tag";
            dueTag.textContent = `Due: ${note.due_date}`;
            noteDiv.appendChild(dueTag);
        }

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "note-actions";

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.onclick = () => openEditModal(note);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => deleteNote(note.id);

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        noteDiv.appendChild(actionsDiv);

        notesList.appendChild(noteDiv);
    });

    // --- Sidebar: notes with due dates, soonest first ---
    const notesWithDates = notes
        .filter(note => note.due_date)
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    upcomingList.innerHTML = "";

    if (notesWithDates.length === 0) {
        upcomingList.innerHTML = "<p style='font-size: 13px; color: #888;'>No upcoming due dates</p>";
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    notesWithDates.forEach(note => {
        const dueDate = new Date(note.due_date);
        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        const item = document.createElement("div");
        item.className = "upcoming-item";

        if (daysUntil <= 2) {
            item.classList.add("urgent");
        } else if (daysUntil <= 7) {
            item.classList.add("soon");
        } else {
            item.classList.add("upcoming-normal");
        }

        const titleSpan = document.createElement("strong");
        titleSpan.textContent = note.title;

        const dueLabel = document.createElement("span");
        dueLabel.className = "due-label";
        dueLabel.textContent = daysUntil < 0
            ? `Overdue (${note.due_date})`
            : daysUntil === 0
                ? "Due today"
                : `Due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`;

        item.appendChild(titleSpan);
        item.appendChild(dueLabel);
        upcomingList.appendChild(item);
    });
}

// New Note
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = titleInput.value;
    const content = contentInput.value;
    const color = selectedColorInput.value;
    const due_date = dueDateInput.value || null;

    await fetch("/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, color, due_date })
    });

    titleInput.value = "";
    contentInput.value = "";
    dueDateInput.value = "";
    createSwatches.forEach(s => s.classList.remove("selected"));
    createSwatches[0].classList.add("selected");
    selectedColorInput.value = createSwatches[0].dataset.color;

    loadNotes();
});

// --- Edit modal logic ---
function openEditModal(note) {
    currentEditId = note.id;
    editTitleInput.value = note.title;
    editContentInput.value = note.content;
    editDueDateInput.value = note.due_date || "";

    const color = note.color || "#FFF9B0";
    editSelectedColorInput.value = color;
    editSwatches.forEach(s => {
        s.classList.toggle("selected", s.dataset.color === color);
    });

    modalOverlay.classList.remove("hidden");
}

function closeEditModal() {
    modalOverlay.classList.add("hidden");
    currentEditId = null;
}

cancelEditBtn.addEventListener("click", closeEditModal);

saveEditBtn.addEventListener("click", async () => {
    if (currentEditId === null) return;

    await fetch(`/notes/${currentEditId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: editTitleInput.value,
            content: editContentInput.value,
            color: editSelectedColorInput.value,
            due_date: editDueDateInput.value || null
        })
    });

    closeEditModal();
    loadNotes();
});

// Deletes note
async function deleteNote(id) {
    const confirmed = confirm("Delete this note?");
    if (!confirmed) return;

    await fetch(`/notes/${id}`, { method: "DELETE" });
    loadNotes();
}

loadNotes();