/**
 * =============================================
 * MODERN TODO APP - Premium Vanilla JavaScript
 * Clean, Modular, Recruiter-Ready Code
 * =============================================
 */

// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
  tasks: [],
  filter: 'all',
  searchQuery: '',
  deletedTask: null,
  draggedItem: null
};

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
  themeToggle: null,
  taskInput: null,
  prioritySelect: null,
  categorySelect: null,
  dateInput: null,
  addBtn: null,
  searchInput: null,
  filterBtns: null,
  taskList: null,
  totalTasks: null,
  completedTasks: null,
  pendingTasks: null,
  progressFill: null,
  progressPercentage: null,
  clearBtn: null,
  modalOverlay: null,
  toastContainer: null
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', init);

function init() {
  cacheDOM();
  loadTheme();
  loadTasks();
  bindEvents();
  render();
}

function cacheDOM() {
  elements.themeToggle = document.getElementById('themeToggle');
  elements.taskInput = document.getElementById('taskInput');
  elements.prioritySelect = document.getElementById('prioritySelect');
  elements.categorySelect = document.getElementById('categorySelect');
  elements.dateInput = document.getElementById('dateInput');
  elements.addBtn = document.getElementById('addBtn');
  elements.searchInput = document.getElementById('searchInput');
  elements.filterBtns = document.querySelectorAll('.filter-btn');
  elements.taskList = document.getElementById('taskList');
  elements.totalTasks = document.getElementById('totalTasks');
  elements.completedTasks = document.getElementById('completedTasks');
  elements.pendingTasks = document.getElementById('pendingTasks');
  elements.progressFill = document.getElementById('progressFill');
  elements.progressPercentage = document.getElementById('progressPercentage');
  elements.clearBtn = document.getElementById('clearBtn');
  elements.modalOverlay = document.getElementById('modalOverlay');
  elements.toastContainer = document.getElementById('toastContainer');
}

// ============================================
// EVENT BINDINGS
// ============================================
function bindEvents() {
  // Theme toggle
  elements.themeToggle.addEventListener('click', toggleTheme);

  // Add task
  elements.addBtn.addEventListener('click', addTask);
  elements.taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });

  // Search
  elements.searchInput.addEventListener('input', debounce(handleSearch, 300));

  // Filters
  elements.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  // Clear completed
  elements.clearBtn.addEventListener('click', clearCompleted);

  // Task list delegation
  elements.taskList.addEventListener('click', handleTaskClick);
  elements.taskList.addEventListener('change', handleTaskChange);
  elements.taskList.addEventListener('keydown', handleTaskKeydown);

  // Drag and drop
  elements.taskList.addEventListener('dragstart', handleDragStart);
  elements.taskList.addEventListener('dragend', handleDragEnd);
  elements.taskList.addEventListener('dragover', handleDragOver);
  elements.taskList.addEventListener('drop', handleDrop);

  // Modal
  elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) closeModal();
  });

  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalConfirm').addEventListener('click', confirmDelete);

  // Keyboard accessibility
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// ============================================
// THEME MANAGEMENT
// ============================================
function loadTheme() {
  const savedTheme = localStorage.getItem('todo-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('todo-theme', newTheme);
  
  // Animate toggle button
  elements.themeToggle.style.transform = 'scale(0.8) rotate(180deg)';
  setTimeout(() => {
    elements.themeToggle.style.transform = '';
  }, 300);
}

// ============================================
// TASK OPERATIONS
// ============================================
function addTask() {
  const text = elements.taskInput.value.trim();
  
  if (!text) {
    showToast('Please enter a task', 'warning');
    elements.taskInput.focus();
    shakeElement(elements.taskInput);
    return;
  }

  const task = {
    id: generateId(),
    text: text,
    completed: false,
    priority: elements.prioritySelect.value,
    category: elements.categorySelect.value,
    dueDate: elements.dateInput.value,
    createdAt: new Date().toISOString()
  };

  state.tasks.unshift(task);
  saveTasks();
  render();
  resetInputs();
  showToast('Task added successfully!', 'success');
}

function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    render();
  }
}

function deleteTask(id) {
  state.deletedTask = { id, task: state.tasks.find(t => t.id === id) };
  openModal();
}

function confirmDelete() {
  if (!state.deletedTask) return;

  const { id, task } = state.deletedTask;
  const index = state.tasks.findIndex(t => t.id === id);
  
  if (index > -1) {
    // Animate removal
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    if (taskElement) {
      taskElement.classList.add('removing');
      setTimeout(() => {
        state.tasks.splice(index, 1);
        saveTasks();
        render();
        showToast('Task deleted', 'error', true);
      }, 300);
    }
  }

  closeModal();
}

function undoDelete() {
  if (state.deletedTask && state.deletedTask.task) {
    state.tasks.unshift(state.deletedTask.task);
    state.deletedTask = null;
    saveTasks();
    render();
    showToast('Task restored!', 'success');
  }
}

function startEdit(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  const taskElement = document.querySelector(`[data-id="${id}"]`);
  const textSpan = taskElement.querySelector('.task-text');
  const currentText = task.text;

  // Replace with input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'task-text-input';
  input.value = currentText;
  input.dataset.id = id;
  
  textSpan.replaceWith(input);
  input.focus();
  input.select();
}

function saveEdit(id, newText) {
  const task = state.tasks.find(t => t.id === id);
  if (task && newText.trim()) {
    task.text = newText.trim();
    saveTasks();
    showToast('Task updated!', 'success');
  }
  render();
}

function clearCompleted() {
  const completedCount = state.tasks.filter(t => t.completed).length;
  if (completedCount === 0) return;

  state.tasks = state.tasks.filter(t => !t.completed);
  saveTasks();
  render();
  showToast(`Cleared ${completedCount} completed task${completedCount > 1 ? 's' : ''}`, 'success');
}

// ============================================
// EVENT HANDLERS
// ============================================
function handleTaskClick(e) {
  const taskItem = e.target.closest('.task-item');
  if (!taskItem) return;

  const id = taskItem.dataset.id;

  if (e.target.closest('.edit-btn')) {
    startEdit(id);
  } else if (e.target.closest('.delete-btn')) {
    deleteTask(id);
  }
}

function handleTaskChange(e) {
  if (e.target.classList.contains('task-checkbox')) {
    const id = e.target.closest('.task-item').dataset.id;
    toggleTask(id);
  }
}

function handleTaskKeydown(e) {
  if (e.target.classList.contains('task-text-input')) {
    const id = e.target.dataset.id;
    if (e.key === 'Enter') {
      saveEdit(id, e.target.value);
    } else if (e.key === 'Escape') {
      render();
    }
  }
}

function handleSearch(e) {
  state.searchQuery = e.target.value.toLowerCase();
  render();
}

function setFilter(filter) {
  state.filter = filter;
  
  elements.filterBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  
  render();
}

// ============================================
// DRAG AND DROP
// ============================================
function handleDragStart(e) {
  const taskItem = e.target.closest('.task-item');
  if (!taskItem) return;

  state.draggedItem = taskItem;
  taskItem.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', taskItem.dataset.id);
}

function handleDragEnd(e) {
  const taskItem = e.target.closest('.task-item');
  if (taskItem) {
    taskItem.classList.remove('dragging');
  }
  state.draggedItem = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const afterElement = getDragAfterElement(elements.taskList, e.clientY);
  const dragging = document.querySelector('.dragging');
  
  if (dragging) {
    if (afterElement) {
      elements.taskList.insertBefore(dragging, afterElement);
    } else {
      elements.taskList.appendChild(dragging);
    }
  }
}

function handleDrop(e) {
  e.preventDefault();
  
  // Update state order
  const newOrder = Array.from(elements.taskList.children).map(el => el.dataset.id);
  state.tasks = newOrder.map(id => state.tasks.find(t => t.id === id)).filter(Boolean);
  saveTasks();
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ============================================
// MODAL
// ============================================
function openModal() {
  elements.modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  document.getElementById('modalConfirm').focus();
}

function closeModal() {
  elements.modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  state.deletedTask = null;
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'success', showUndo = false) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
    warning: '<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
    error: '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'
  };

  toast.innerHTML = `
    <svg class="toast-icon" viewBox="0 0 24 24">${icons[type]}</svg>
    <span class="toast-message">${message}</span>
    ${showUndo ? '<button class="toast-undo" onclick="undoDelete()">Undo</button>' : ''}
  `;

  elements.toastContainer.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, showUndo ? 5000 : 3000);
}

// ============================================
// RENDERING
// ============================================
function render() {
  renderTasks();
  renderStats();
  renderProgress();
  updateClearButton();
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();

  if (filteredTasks.length === 0) {
    elements.taskList.innerHTML = `
      <div class="empty-state">
        <div class="empty-illustration">
          <div class="empty-circle"></div>
          <svg class="empty-icon" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </div>
        <h3 class="empty-title">No tasks yet</h3>
        <p class="empty-text">Add a new task to get started!</p>
      </div>
    `;
    return;
  }

  elements.taskList.innerHTML = filteredTasks.map((task, index) => `
    <li class="task-item ${task.completed ? 'completed' : ''}" 
        data-id="${task.id}" 
        data-priority="${task.priority}"
        draggable="true"
        style="animation-delay: ${index * 0.05}s">
      <label class="checkbox-wrapper">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task as complete">
        <span class="checkbox-custom">
          <svg viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      </label>
      <div class="task-content">
        <span class="task-text">${escapeHtml(task.text)}</span>
        <div class="task-meta">
          ${task.category ? `<span class="task-tag tag-category">${task.category}</span>` : ''}
          ${task.priority ? `<span class="task-tag tag-priority ${task.priority}">${task.priority}</span>` : ''}
          ${task.dueDate ? `<span class="task-tag tag-date">${formatDate(task.dueDate)}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="action-btn edit-btn" aria-label="Edit task">
          <svg viewBox="0 0 24 24">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <button class="action-btn delete-btn" aria-label="Delete task">
          <svg viewBox="0 0 24 24">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    </li>
  `).join('');
}

function renderStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const pending = total - completed;

  elements.totalTasks.textContent = total;
  elements.completedTasks.textContent = completed;
  elements.pendingTasks.textContent = pending;
}

function renderProgress() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  elements.progressFill.style.width = `${percentage}%`;
  elements.progressPercentage.textContent = `${percentage}%`;
}

function updateClearButton() {
  const hasCompleted = state.tasks.some(t => t.completed);
  elements.clearBtn.disabled = !hasCompleted;
}

function getFilteredTasks() {
  let tasks = [...state.tasks];

  // Apply search filter
  if (state.searchQuery) {
    tasks = tasks.filter(t => 
      t.text.toLowerCase().includes(state.searchQuery) ||
      t.category.toLowerCase().includes(state.searchQuery)
    );
  }

  // Apply status/priority filter
  switch (state.filter) {
    case 'completed':
      tasks = tasks.filter(t => t.completed);
      break;
    case 'pending':
      tasks = tasks.filter(t => !t.completed);
      break;
    case 'high':
      tasks = tasks.filter(t => t.priority === 'high');
      break;
    case 'medium':
      tasks = tasks.filter(t => t.priority === 'medium');
      break;
    case 'low':
      tasks = tasks.filter(t => t.priority === 'low');
      break;
  }

  return tasks;
}

// ============================================
// STORAGE
// ============================================
function saveTasks() {
  try {
    localStorage.setItem('modern-todo-tasks', JSON.stringify(state.tasks));
  } catch (e) {
    console.error('Failed to save tasks:', e);
  }
}

function loadTasks() {
  try {
    const saved = localStorage.getItem('modern-todo-tasks');
    if (saved) {
      state.tasks = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load tasks:', e);
    state.tasks = [];
  }
}

// ============================================
// UTILITIES
// ============================================
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function shakeElement(element) {
  element.style.animation = 'none';
  element.offsetHeight; // Trigger reflow
  element.style.animation = 'shake 0.5s ease';
  setTimeout(() => element.style.animation = '', 500);
}

// Add shake keyframes dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);

function resetInputs() {
  elements.taskInput.value = '';
  elements.prioritySelect.value = 'medium';
  elements.categorySelect.value = 'personal';
  elements.dateInput.value = '';
  elements.taskInput.focus();
}
