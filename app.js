/* =========================================================
   Taskly – app.js
   Persistent task reminders with browser notifications
   and in-app toasts. Uses localStorage for persistence.
   ========================================================= */

let tasks = [];
let filter = 'all';
let alreadyNotified = new Set();

/* ── Storage helpers (localStorage) ── */
function saveTasks() {
  localStorage.setItem('taskly-tasks', JSON.stringify(tasks));
  localStorage.setItem('taskly-notified', JSON.stringify([...alreadyNotified]));
}

function loadTasks() {
  try {
    const t = localStorage.getItem('taskly-tasks');
    if (t) tasks = JSON.parse(t);
    const n = localStorage.getItem('taskly-notified');
    if (n) alreadyNotified = new Set(JSON.parse(n));
  } catch (e) {
    tasks = [];
  }
  render();
}

/* ── Utility ── */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function escHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isOverdue(t) {
  return t.due && !t.done && new Date(t.due) < new Date();
}

function formatDue(due) {
  if (!due) return '';
  const d = new Date(due);
  const now = new Date();
  const diff = d - now;
  if (diff < 0) {
    const mins = Math.round(-diff / 60000);
    if (mins < 60) return `${mins}m overdue`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h overdue`;
    return `${Math.round(hrs / 24)}d overdue`;
  }
  if (diff < 3600000)  return `in ${Math.round(diff / 60000)}m`;
  if (diff < 86400000) return `in ${Math.round(diff / 3600000)}h`;
  return d.toLocaleDateString('en-IN', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/* ── Task CRUD ── */
function addTask() {
  const title = document.getElementById('inp-title').value.trim();
  if (!title) { shake('inp-title'); return; }

  const due      = document.getElementById('inp-due').value;
  const priority = document.getElementById('inp-priority').value;
  const desc     = document.getElementById('inp-desc').value.trim();

  tasks.unshift({
    id: genId(), title, desc, due, priority,
    done: false, createdAt: Date.now()
  });

  document.getElementById('inp-title').value = '';
  document.getElementById('inp-desc').value  = '';
  document.getElementById('inp-due').value   = '';

  saveTasks();
  render();
  showNotif('remind', 'Task added!', `"${title}" is on your list.`);
}

function toggleDone(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  saveTasks();
  render();
  if (t.done) {
    launchConfetti();
    showNotif('congrats', 'Congratulations! 🎉', `You crushed "${t.title}"! Keep it up!`);
    if (Notification.permission === 'granted') {
      new Notification('Task complete! 🎉', { body: `Great job finishing "${t.title}"!` });
    }
  }
}

function deleteTask(id) {
  tasks = tasks.filter(x => x.id !== id);
  alreadyNotified.delete(id);
  saveTasks();
  render();
}

/* ── Filter ── */
function setFilter(f, btn) {
  filter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

/* ── Render ── */
function render() {
  let visible = tasks;
  if (filter === 'pending') visible = tasks.filter(t => !t.done);
  else if (filter === 'done') visible = tasks.filter(t => t.done);
  else if (filter === 'overdue') visible = tasks.filter(isOverdue);

  const total   = tasks.length;
  const done    = tasks.filter(t => t.done).length;
  const pending = tasks.filter(t => !t.done).length;
  const overdue = tasks.filter(isOverdue).length;

  document.getElementById('stat-total').textContent   = total;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-done').textContent    = done;

  const oi = document.getElementById('overdue-indicator');
  if (overdue > 0) {
    oi.style.display = 'flex';
    document.getElementById('overdue-count').textContent = overdue + ' overdue';
  } else {
    oi.style.display = 'none';
  }

  const list = document.getElementById('task-list');
  if (!visible.length) {
    const msgs = {
      overdue: 'No overdue tasks — nice work!',
      done:    'No completed tasks yet.',
      all:     'No tasks yet. Add something above!'
    };
    list.innerHTML = `<div class="empty">
      <i class="ti ti-checklist" aria-hidden="true"></i>
      ${msgs[filter] || msgs.all}
    </div>`;
    return;
  }

  list.innerHTML = visible.map(t => {
    const ov  = isOverdue(t);
    const due = t.due ? formatDue(t.due) : '';
    return `<div class="task${ov ? ' overdue' : ''}${t.done ? ' done' : ''}">
      <div class="task-top">
        <div class="task-check${t.done ? ' checked' : ''}"
             onclick="toggleDone('${t.id}')"
             role="checkbox"
             aria-checked="${t.done}"
             tabindex="0"
             aria-label="Mark ${t.done ? 'incomplete' : 'complete'}">
          ${t.done ? '<i class="ti ti-check" style="font-size:13px;color:#0f0e0c" aria-hidden="true"></i>' : ''}
        </div>
        <div class="task-body">
          <div class="task-title">${escHtml(t.title)}</div>
          ${t.desc ? `<div class="task-desc">${escHtml(t.desc)}</div>` : ''}
          <div class="task-meta">
            <span class="badge badge-priority-${t.priority}">
              <i class="ti ti-flag" aria-hidden="true"></i>${t.priority}
            </span>
            ${due ? `<span class="badge ${ov ? 'badge-overdue' : 'badge-time'}">
              <i class="ti ti-clock" aria-hidden="true"></i>${due}
            </span>` : ''}
            ${t.done ? `<span class="badge" style="background:rgba(76,175,125,0.15);color:#4caf7d">
              <i class="ti ti-circle-check" aria-hidden="true"></i>done
            </span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="btn-icon btn-del" onclick="deleteTask('${t.id}')" aria-label="Delete task">
            <i class="ti ti-trash" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ── Input shake on validation error ── */
function shake(id) {
  const el = document.getElementById(id);
  el.style.borderColor = 'var(--red)';
  setTimeout(() => { el.style.borderColor = ''; }, 600);
}

/* ── Toast notifications ── */
let notifId = 0;
function showNotif(type, title, body) {
  const bar = document.getElementById('notif-bar');
  const el  = document.createElement('div');
  el.className = `notif ${type}`;
  el.innerHTML = `
    <i class="ti ${type === 'congrats' ? 'ti-confetti' : 'ti-bell-ringing'} notif-icon ${type}" aria-hidden="true"></i>
    <div class="notif-text">
      <div class="notif-title">${title}</div>
      <div class="notif-body">${body}</div>
    </div>
    <button class="notif-close" onclick="this.closest('.notif').remove()" aria-label="Close">
      <i class="ti ti-x"></i>
    </button>`;
  bar.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.4s';
    el.style.opacity    = '0';
    setTimeout(() => el.remove(), 400);
  }, 5000);
}

/* ── Confetti burst ── */
function launchConfetti() {
  const colors = ['#e8a320', '#4caf7d', '#e05a4b', '#7b9ef0', '#f0ece3'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left             = Math.random() * 100 + 'vw';
    el.style.top              = '-20px';
    el.style.background       = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDelay    = Math.random() * 0.8 + 's';
    el.style.animationDuration = (1.2 + Math.random() * 1) + 's';
    el.style.transform        = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }
}

/* ── Browser notification permission ── */
async function requestNotifPerm() {
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    document.getElementById('notif-perm-bar').style.display = 'none';
    showNotif('congrats', 'Notifications enabled!', "You'll be reminded when tasks are due.");
  }
}

function initNotifPermBar() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    document.getElementById('notif-perm-bar').style.display = 'flex';
  }
}

/* ── Reminder checker (runs every 30s) ── */
function checkReminders() {
  const now = new Date();
  tasks.forEach(t => {
    if (t.done || !t.due) return;
    const due  = new Date(t.due);
    const diff = due - now;

    const key15  = t.id + '-15min';
    const keyDue = t.id + '-due';
    const keyOver= t.id + '-over';

    // 15-minute warning
    if (diff > 0 && diff <= 15 * 60 * 1000 && !alreadyNotified.has(key15)) {
      alreadyNotified.add(key15);
      showNotif('remind', 'Task due soon!', `"${t.title}" is due in 15 minutes.`);
      if (Notification.permission === 'granted')
        new Notification('Due in 15 min!', { body: `"${t.title}" is due soon!` });
      saveTasks();
    }

    // Due now
    if (diff > -60000 && diff <= 0 && !alreadyNotified.has(keyDue)) {
      alreadyNotified.add(keyDue);
      showNotif('remind', 'Task due now!', `"${t.title}" is due — get it done!`);
      if (Notification.permission === 'granted')
        new Notification('Task due now!', { body: `"${t.title}" — time's up!` });
      render();
      saveTasks();
    }

    // Overdue (1+ min late)
    if (diff < -60000 && !alreadyNotified.has(keyOver)) {
      alreadyNotified.add(keyOver);
      showNotif('remind', 'Overdue task!', `"${t.title}" is past due. Finish it up!`);
      render();
      saveTasks();
    }
  });
}

/* ── Keyboard shortcut: Enter in title field ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.activeElement.id === 'inp-title') addTask();
});

/* ── Boot ── */
loadTasks();
initNotifPermBar();
checkReminders();
setInterval(() => { checkReminders(); render(); }, 30000);
