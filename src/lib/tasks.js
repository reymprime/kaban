// Task helpers — pure functions for the Task List cards.
// A task = { id, text, done, priority, due }.

// Priority tiers. 1 is most urgent. Colors are inline hex so they render the
// same in both themes without needing new CSS tokens.
export const PRIORITIES = {
  1: { label: 'P1', name: 'Urgent', color: '#dc2626', soft: '#fee2e2' },
  2: { label: 'P2', name: 'Soon', color: '#d97706', soft: '#fef3c7' },
  3: { label: 'P3', name: 'Someday', color: '#64748b', soft: '#eef2f6' },
};

export function newTask(text = '', priority = 2) {
  return {
    id: 't' + Math.random().toString(36).slice(2, 9),
    text: text.trim(),
    done: false,
    priority,
    due: null,
  };
}

// Completed fraction of a list, 0..100.
export function taskProgress(tasks = []) {
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => t.done).length;
  return Math.round((done / tasks.length) * 100);
}

export function taskCounts(tasks = []) {
  const done = tasks.filter((t) => t.done).length;
  return { done, total: tasks.length, left: tasks.length - done };
}

// Sort for display: unfinished first, then by priority (P1→P3), then by due
// date (soonest first, undated last), stable-ish by original text.
export function sortTasks(tasks = []) {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.priority !== b.priority) return a.priority - b.priority;
    const ad = a.due || '9999-99-99';
    const bd = b.due || '9999-99-99';
    if (ad !== bd) return ad < bd ? -1 : 1;
    return 0;
  });
}

// Whole days from today to a due date. null if no due date.
export function taskDaysLeft(due) {
  if (!due) return null;
  const target = new Date(due + 'T00:00:00');
  if (isNaN(target)) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

export function dueLabel(due) {
  const d = taskDaysLeft(due);
  if (d === null) return '';
  if (d > 1) return `${d}d`;
  if (d === 1) return 'Tomorrow';
  if (d === 0) return 'Today';
  if (d === -1) return '1d late';
  return `${Math.abs(d)}d late`;
}

export function dueTone(due) {
  const d = taskDaysLeft(due);
  if (d === null) return 'none';
  if (d < 0) return 'overdue';
  if (d <= 1) return 'soon';
  return 'normal';
}

// How many urgent (P1) tasks are still open — powers the gentle "Rule of 3" hint.
export function openP1Count(tasks = []) {
  return tasks.filter((t) => !t.done && t.priority === 1).length;
}
