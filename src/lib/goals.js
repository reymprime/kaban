// Goal helpers — pure functions, no state. Keeps the goal maths in one place
// so the editor, the card, and the full-screen view all agree.

// Effective progress 0..100. In milestone mode it's derived from how many
// milestones are done; in slider mode it's the stored number.
export function goalProgress(item) {
  if (item.trackMode === 'milestones') {
    const ms = item.milestones || [];
    if (!ms.length) return 0;
    const done = ms.filter((m) => m.done).length;
    return Math.round((done / ms.length) * 100);
  }
  return Math.max(0, Math.min(100, item.progress || 0));
}

export function isGoalDone(item) {
  return goalProgress(item) >= 100;
}

// Whole days between today (local midnight) and the target date.
// Positive = days remaining, 0 = due today, negative = overdue.
export function daysLeft(targetDate) {
  if (!targetDate) return null;
  const target = new Date(targetDate + 'T00:00:00');
  if (isNaN(target)) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

// Friendly countdown label for the card.
export function deadlineLabel(targetDate) {
  const d = daysLeft(targetDate);
  if (d === null) return '';
  if (d > 1) return `${d} days left`;
  if (d === 1) return 'Due tomorrow';
  if (d === 0) return 'Due today';
  if (d === -1) return '1 day overdue';
  return `${Math.abs(d)} days overdue`;
}

// Status for coloring the countdown chip.
export function deadlineTone(item) {
  if (isGoalDone(item)) return 'done';
  const d = daysLeft(item.targetDate);
  if (d === null) return 'normal';
  if (d < 0) return 'overdue';
  if (d <= 3) return 'soon';
  return 'normal';
}

export function newMilestone(text = '') {
  return {
    id: 'm' + Math.random().toString(36).slice(2, 9),
    text: text.trim(),
    done: false,
  };
}
