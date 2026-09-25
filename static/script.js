const form = document.getElementById("note-form");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const notesList = document.getElementById("notes-list");

//Fetches notes from the server and displays them
async function loadNotes() {
    const response = await fetch("/notes");
    const notes = await response.json();

    notesList.innerHTML = "";

    notes.forEach(note => {
        const noteDiv = document.createElement("div");
        noteDiv.className = "note";

        const titleEl = document.createElement("h3");
        titleEl.textContent = note.title;

        const contentEl = document.createElement("p");
        contentEl.textContent = note.content;

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "note-actions";

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.onclick = () => editNote(note.id, note.title, note.content);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => deleteNote(note.id);

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        noteDiv.appendChild(titleEl);
        noteDiv.appendChild(contentEl);
        noteDiv.appendChild(actionsDiv);

        notesList.appendChild(noteDiv);
    });
}

//New Note
form.addEventListener("submit", async (e) => {
    e.preventDefault(); // stops the page from reloading on submit

    const title = titleInput.value;
    const content = contentInput.value;

    await fetch("/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content })
    });

    titleInput.value = "";
    contentInput.value = "";
    loadNotes(); // refresh the list
});

//Edits note
async function editNote(id, oldTitle, oldContent) {
    const newTitle = prompt("Edit title:", oldTitle);
    if (newTitle === null) return; // user clicked cancel

    const newContent = prompt("Edit content:", oldContent);

    await fetch(`/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent })
    });

    loadNotes();
}

//Deletes note
async function deleteNote(id) {
    const confirmed = confirm("Delete this note?");
    if (!confirmed) return;

    await fetch(`/notes/${id}`, { method: "DELETE" });
    loadNotes();
}

loadNotes();