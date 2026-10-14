// notes.js — modular notes section
const DEFAULT_STORAGE_KEY = 'notes-app:v1';

export function initNotesApp(container, options = {}) {
  if (!container) {
    throw new Error('initNotesApp: container element is required');
  }

  const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
  let notes = loadNotes();
  let query = '';

  // --- build the UI inside the container ---
  container.classList.add('notes-app');
  container.innerHTML = `
    <form class="notes-form">
      <input type="text" class="notes-input" placeholder="Write a note..." autocomplete="off" />
      <button type="submit">Add</button>
    </form>
    <div class="notes-toolbar">
      <input type="search" class="notes-search" placeholder="Search notes..." />
      <span class="notes-count">0 notes</span>
    </div>
    <ul class="notes-list"></ul>
    <p class="notes-empty" hidden>No notes yet. Add one above!</p>
  `;

  const form = container.querySelector('.notes-form');
  const input = container.querySelector('.notes-input');
  const search = container.querySelector('.notes-search');
  const list = container.querySelector('.notes-list');
  const count = container.querySelector('.notes-count');
  const empty = container.querySelector('.notes-empty');

  // --- persistence ---
  function loadNotes() {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Could not read notes:', err);
      return [];
    }
  }

  function saveNotes() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notes));
    } catch (err) {
      console.error('Could not save notes:', err);
    }
  }

  // --- actions ---
  function addNote(text) {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const note = {
      id: makeId(),
      text: trimmed,
      createdAt: Date.now(),
    };
    notes.unshift(note);
    saveNotes();
    render();
    return note;
  }

  function updateNote(id, text) {
    const note = notes.find((n) => n.id === id);
    if (!note) return false;
    const trimmed = text.trim();
    if (!trimmed) {
      deleteNote(id);
      return false;
    }
    note.text = trimmed;
    note.updatedAt = Date.now();
    saveNotes();
    render();
    return true;
  }

  function deleteNote(id) {
    notes = notes.filter((n) => n.id !== id);
    saveNotes();
    render();
  }

  // --- rendering ---
  function visibleNotes() {
    if (!query) return notes;
    const q = query.toLowerCase();
    return notes.filter((n) => n.text.toLowerCase().includes(q));
  }

  function render() {
    const shown = visibleNotes();
    list.replaceChildren(...shown.map(noteElement));
    empty.hidden = shown.length > 0;
    count.textContent = `${notes.length} note${notes.length === 1 ? '' : 's'}`;
  }

  function noteElement(note) {
    const li = document.createElement('li');
    li.className = 'note';

    const text = document.createElement('p');
    text.className = 'note__text';
    text.textContent = note.text;

    const time = document.createElement('time');
    time.className = 'note__date';
    time.dateTime = new Date(note.createdAt).toISOString();
    time.textContent = formatDate(note.createdAt);

    const actions = document.createElement('div');
    actions.className = 'note__actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => startEdit(li, note));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => deleteNote(note.id));

    actions.append(editBtn, delBtn);
    li.append(text, time, actions);
    return li;
  }

  function startEdit(li, note) {
    const text = li.querySelector('.note__text');
    const actions = li.querySelector('.note__actions');

    const editor = document.createElement('textarea');
    editor.className = 'note__editor';
    editor.rows = 3;
    editor.value = note.text;

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';

    const commit = () => updateNote(note.id, editor.value);
    const revert = () => render();

    saveBtn.addEventListener('click', commit);
    cancelBtn.addEventListener('click', revert);
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
      if (e.key === 'Escape') revert();
    });

    text.replaceWith(editor);
    actions.replaceChildren(saveBtn, cancelBtn);
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);
  }

  // --- helpers ---
  function formatDate(ts) {
    return new Date(ts).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  function makeId() {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  // --- events ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (addNote(input.value)) {
      input.value = '';
    }
    input.focus();
  });

  search.addEventListener('input', () => {
    query = search.value.trim();
    render();
  });

  // --- boot ---
  render();

  // Return a small API if you need programmatic control
  return {
    addNote,
    getNotes: () => [...notes],
    refresh: render,
    destroy: () => {
      container.innerHTML = '';
      container.classList.remove('notes-app');
    },
  };
}
