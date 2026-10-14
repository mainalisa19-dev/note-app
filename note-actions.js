document.getElementById("newNoteBtn").addEventListener("click", () => {
    app.openEditor();
});

document.getElementById("emptyNewBtn").addEventListener("click", () => {
    app.openEditor();
});

document.getElementById("cancelBtn").addEventListener("click", () => {
    app.closeEditor();
});

document.getElementById("searchInput").addEventListener("input", () => {
    app.renderNotes();
});

app.deleteNote = function (id) {
    const note = app.state.notes.find(item => item.id === id);

    if (!note) return;

    if (!confirm(Are you sure you want to delete "${note.title}"?)) {
        return;
    }

    const previousNotes = [...app.state.notes];

    app.state.notes = app.state.notes.filter(item => item.id !== id);

    if (!app.saveNotes(app.state.notes)) {
        app.state.notes = previousNotes;
        return;
    }

    if (app.state.editingId === id) {
        app.closeEditor();
    }

    app.renderNotes();
};

document.getElementById("noteForm").addEventListener("submit", event => {
    event.preventDefault();

    const title = document.getElementById("noteTitle").value.trim();
    const content = document.getElementById("noteContent").value.trim();

    if (!title || !content) {
        alert("Please enter both a title and note content.");
        return;
    }

    if (title.length > 100 || content.length > 10000) {
        alert("Your note is too long.");
        return;
    }

    const previousNotes = [...app.state.notes];
    const now = new Date().toLocaleString();
    const editingId = app.state.editingId;

    if (editingId) {
        app.state.notes = app.state.notes.map(note =>
            note.id === editingId
                ? { ...note, title, content, date: now }
                : note
        );
    } else {
        app.state.notes.unshift({
            id: crypto.randomUUID(),
            title,
            content,
            date: now
        });
    }

    if (!app.saveNotes(app.state.notes)) {
        app.state.notes = previousNotes;
        return;
    }

    app.closeEditor();

    // Show all notes after saving, even if a search was active.
    document.getElementById("searchInput").value = "";

    app.renderNotes();
});

// Display notes when the page loads.
app.renderNotes();