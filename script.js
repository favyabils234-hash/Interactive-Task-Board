/* =========================================================
   Blush Board – app logic (vanilla ES6+)
   State lives in a single `tasks` array, persisted to localStorage.
   ========================================================= */

const STORAGE_KEY = 'blushBoard.tasks';
const THEME_KEY = 'blushBoard.theme';
const STATUSES = ['todo', 'progress', 'done'];

// ---------- State ----------
let tasks = loadTasks();
let lastDeleted = null; // { task, index } for undo
let toastTimer = null;

// ---------- DOM references ----------
const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const descInput = document.getElementById('task-desc');
const categoryInput = document.getElementById('task-category');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const clearDoneBtn = document.getElementById('clear-done');
const themeToggle = document.getElementById('theme-toggle');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');
const toastUndo = document.getElementById('toast-undo');

// ---------- Persistence ----------
function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return []; // corrupted or unavailable storage – start fresh
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /* storage full or blocked – app still works for this session */
  }
}

/** Save then re-render: called after every state change. */
function commit() {
  saveTasks();
  render();
}

// ---------- Task actions ----------
function addTask(e) {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return titleInput.focus();

  tasks.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title,
    description: descInput.value.trim(),
    category: categoryInput.value,
    priority: form.elements.priority.value,
    status: 'todo',
    createdAt: Date.now(),
  });

  form.reset();
  titleInput.focus();
  commit();
}

function moveTask(id, newStatus) {
  const task = tasks.find(t => t.id === id);
  if (!task || task.status === newStatus) return;
  task.status = newStatus;
  commit();
}

/** Shift a task one column left (-1) or right (+1). */
function stepTask(id, direction) {
  const task = tasks.find(t => t.id === id);
  const next = STATUSES[STATUSES.indexOf(task.status) + direction];
  if (next) moveTask(id, next);
}

function deleteTask(id) {
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return;
  lastDeleted = { task: tasks[index], index };
  tasks.splice(index, 1);
  commit();
  showToast(`Deleted “${lastDeleted.task.title}”`);
}

function undoDelete() {
  if (!lastDeleted) return;
  tasks.splice(lastDeleted.index, 0, lastDeleted.task);
  lastDeleted = null;
  hideToast();
  commit();
}

function clearCompleted() {
  const count = tasks.filter(t => t.status === 'done').length;
  if (!count || !confirm(`Remove ${count} completed task(s)?`)) return;
  tasks = tasks.filter(t => t.status !== 'done');
  commit();
}

// ---------- Rendering ----------
/** Escape user text before inserting into HTML. */
const escapeHTML = str =>
  str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const formatDate = ts =>
  new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function cardTemplate(task) {
  const idx = STATUSES.indexOf(task.status);
  return `
    <li class="card priority-${task.priority}" draggable="true"
        data-id="${task.id}" data-status="${task.status}">
      <div class="card-top">
        <h3>${escapeHTML(task.title)}</h3>
      </div>
      ${task.description ? `<p>${escapeHTML(task.description)}</p>` : ''}
      <div class="tags">
        <span class="tag">${escapeHTML(task.category)}</span>
        <span class="tag prio">${task.priority}</span>
        <span class="date">${formatDate(task.createdAt)}</span>
      </div>
      <div class="card-actions">
        <button class="icon-btn" data-action="left" ${idx === 0 ? 'disabled' : ''} aria-label="Move left" title="Move left">◀</button>
        <button class="icon-btn" data-action="right" ${idx === 2 ? 'disabled' : ''} aria-label="Move right" title="Move right">▶</button>
        <button class="icon-btn delete" data-action="delete" aria-label="Delete task" title="Delete">✕</button>
      </div>
    </li>`;
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  // Apply search + category filter
  const visible = tasks.filter(t =>
    t.title.toLowerCase().includes(query) &&
    (category === 'All' || t.category === category)
  );

  STATUSES.forEach(status => {
    const list = document.querySelector(`.task-list[data-status="${status}"]`);
    const items = visible.filter(t => t.status === status);
    list.innerHTML = items.length
      ? items.map(cardTemplate).join('')
      : `<li class="empty">${query || category !== 'All' ? 'No matches' : 'Nothing here yet ✿'}</li>`;
    document.querySelector(`[data-count="${status}"]`).textContent = items.length;
  });

  updateStats();
}

/** Bonus: active vs completed counter + progress ring. */
function updateStats() {
  const done = tasks.filter(t => t.status === 'done').length;
  const active = tasks.length - done;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  document.getElementById('active-count').textContent = active;
  document.getElementById('done-count').textContent = done;
  document.getElementById('progress-text').textContent = `${pct}%`;
  document.getElementById('progress-ring').style.setProperty('--pct', pct);
}

// ---------- Toast ----------
function showToast(message) {
  toastMsg.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 5000);
}

function hideToast() {
  toast.hidden = true;
}

// ---------- Drag & drop (native HTML5 API) ----------
function initDragAndDrop() {
  document.addEventListener('dragstart', e => {
    const card = e.target.closest('.card');
    if (!card) return;
    card.classList.add('dragging');
    e.dataTransfer.setData('text/plain', card.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
  });

  document.addEventListener('dragend', e => {
    e.target.closest?.('.card')?.classList.remove('dragging');
  });

  document.querySelectorAll('.column').forEach(column => {
    column.addEventListener('dragover', e => {
      e.preventDefault();
      column.classList.add('drag-over');
    });
    column.addEventListener('dragleave', e => {
      if (!column.contains(e.relatedTarget)) column.classList.remove('drag-over');
    });
    column.addEventListener('drop', e => {
      e.preventDefault();
      column.classList.remove('drag-over');
      moveTask(e.dataTransfer.getData('text/plain'), column.dataset.status);
    });
  });
}

// ---------- Theme ----------
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.checked = theme === 'dark';
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch { /* ignore */ }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));

  themeToggle.addEventListener('change', () => {
    const theme = themeToggle.checked ? 'dark' : 'light';
    applyTheme(theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  });
}

// ---------- Event wiring ----------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDragAndDrop();
  render();

  form.addEventListener('submit', addTask);
  searchInput.addEventListener('input', render);
  categoryFilter.addEventListener('change', render);
  clearDoneBtn.addEventListener('click', clearCompleted);
  toastUndo.addEventListener('click', undoDelete);

  // Event delegation for card buttons
  document.querySelector('.board').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.closest('.card').dataset.id;
    const actions = {
      left: () => stepTask(id, -1),
      right: () => stepTask(id, 1),
      delete: () => deleteTask(id),
    };
    actions[btn.dataset.action]();
  });
});
