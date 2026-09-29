const form = document.getElementById("note-form");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const notesList = document.getElementById("notes-list");
const dueDateInput = document.getElementById("due-date");
const upcomingList = document.getElementById("upcoming-list");
const selectedColorInput = document.getElementById("selected-color");
const createSwatches = document.querySelectorAll("#create-swatches .swatch");
const createColorToggle = document.getElementById("create-color-toggle");
const createSwatchesPanel = document.getElementById("create-swatches");

const modalOverlay = document.getElementById("edit-modal-overlay");
const editTitleInput = document.getElementById("edit-title");
const editContentInput = document.getElementById("edit-content");
const editDueDateInput = document.getElementById("edit-due-date");
const editSelectedColorInput = document.getElementById("edit-selected-color");
const editSwatches = document.querySelectorAll("#edit-swatches .swatch");
const editColorToggle = document.getElementById("edit-color-toggle");
const editSwatchesPanel = document.getElementById("edit-swatches");
const saveEditBtn = document.getElementById("save-edit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

let currentEditId = null;

// Which box (title or content) each toolbar currently targets
let createFocusTarget = contentInput;
let editFocusTarget = editContentInput;

titleInput.addEventListener("focus", () => { createFocusTarget = titleInput; });
contentInput.addEventListener("focus", () => { createFocusTarget = contentInput; });
editTitleInput.addEventListener("focus", () => { editFocusTarget = editTitleInput; });
editContentInput.addEventListener("focus", () => { editFocusTarget = editContentInput; });

// Remember exactly where the cursor/selection is in each editable box
const savedRanges = new Map();

function trackSelection(el) {
    ["mouseup", "keyup", "input"].forEach(evt => {
        el.addEventListener(evt, () => {
            const sel = window.getSelection();
            if (sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
                savedRanges.set(el, sel.getRangeAt(0).cloneRange());
            }
        });
    });
}
[titleInput, contentInput, editTitleInput, editContentInput].forEach(trackSelection);

function restoreSelection(el) {
    const range = savedRanges.get(el);
    if (range) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

// Color dropdown toggles
createColorToggle.addEventListener("click", () => {
    createSwatchesPanel.classList.toggle("hidden");
    editSwatchesPanel.classList.add("hidden");
});

editColorToggle.addEventListener("click", () => {
    editSwatchesPanel.classList.toggle("hidden");
    createSwatchesPanel.classList.add("hidden");
});

document.addEventListener("click", (e) => {
    if (!createColorToggle.contains(e.target) && !createSwatchesPanel.contains(e.target)) {
        createSwatchesPanel.classList.add("hidden");
    }
    if (!editColorToggle.contains(e.target) && !editSwatchesPanel.contains(e.target)) {
        editSwatchesPanel.classList.add("hidden");
    }
});

createSwatches.forEach(swatch => {
    swatch.addEventListener("click", () => {
        createSwatches.forEach(s => s.classList.remove("selected"));
        swatch.classList.add("selected");
        selectedColorInput.value = swatch.dataset.color;
        createSwatchesPanel.classList.add("hidden");
    });
});

editSwatches.forEach(swatch => {
    swatch.addEventListener("click", () => {
        editSwatches.forEach(s => s.classList.remove("selected"));
        swatch.classList.add("selected");
        editSelectedColorInput.value = swatch.dataset.color;
        editSwatchesPanel.classList.add("hidden");
    });
});

// Bold / Italic buttons
document.querySelectorAll(".format-btn").forEach(btn => {
    btn.addEventListener("mousedown", (e) => e.preventDefault());

    btn.addEventListener("click", () => {
        const command = btn.dataset.command;
        const isEdit = btn.dataset.target === "edit";
        const target = isEdit ? editFocusTarget : createFocusTarget;

        target.focus();
        restoreSelection(target);
        document.execCommand(command, false, null);

        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            savedRanges.set(target, sel.getRangeAt(0).cloneRange());
        }

        updateFormatButtonStates(isEdit);
    });
});

function updateFormatButtonStates(isEdit) {
    document.querySelectorAll(".format-btn").forEach(btn => {
        const belongsToEdit = btn.dataset.target === "edit";
        if (belongsToEdit !== isEdit) return;

        const command = btn.dataset.command;
        const isActive = document.queryCommandState(command);
        btn.classList.toggle("active", isActive);
    });
}

document.addEventListener("selectionchange", () => {
    const active = document.activeElement;
    if (active === contentInput || active === titleInput) {
        updateFormatButtonStates(false);
    } else if (active === editContentInput || active === editTitleInput) {
        updateFormatButtonStates(true);
    }
    // Clicking elsewhere (buttons, due date, background) no longer clears
    // the toolbar — it just keeps showing the last real state.
});

async function loadNotes() {
    const response = await fetch("/notes");
    const notes = await response.json();

    notesList.innerHTML = "";

    notes.forEach(note => {
        const noteDiv = document.createElement("div");
        noteDiv.className = "note";
        noteDiv.style.backgroundColor = note.color || "#FFF9B0";

        const titleEl = document.createElement("h3");
        titleEl.innerHTML = note.title;

        const contentEl = document.createElement("p");
        contentEl.innerHTML = note.content;

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
        titleSpan.innerHTML = note.title;

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

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (titleInput.textContent.trim() === "") {
        alert("Please enter a title.");
        return;
    }

    const title = titleInput.innerHTML;
    const content = contentInput.innerHTML;
    const color = selectedColorInput.value;
    const due_date = dueDateInput.value || null;

    await fetch("/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, color, due_date })
    });

    titleInput.innerHTML = "";
    contentInput.innerHTML = "";
    dueDateInput.value = "";
    createSwatches.forEach(s => s.classList.remove("selected"));
    createSwatches[0].classList.add("selected");
    selectedColorInput.value = createSwatches[0].dataset.color;

    loadNotes();
});

function openEditModal(note) {
    currentEditId = note.id;
    editTitleInput.innerHTML = note.title;
    editContentInput.innerHTML = note.content;
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
            title: editTitleInput.innerHTML,
            content: editContentInput.innerHTML,
            color: editSelectedColorInput.value,
            due_date: editDueDateInput.value || null
        })
    });

    closeEditModal();
    loadNotes();
});

async function deleteNote(id) {
    const confirmed = confirm("Delete this note?");
    if (!confirmed) return;

    await fetch(`/notes/${id}`, { method: "DELETE" });
    loadNotes();
}

loadNotes();