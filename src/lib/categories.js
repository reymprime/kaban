export const CATEGORIES = {
  image: {
    label: 'Image Prompt',
    plural: 'Image Prompts',
    color: 'var(--color-cat-image)',
    soft: 'var(--color-cat-image-soft)',
  },
  video: {
    label: 'Video Prompt',
    plural: 'Video Prompts',
    color: 'var(--color-cat-video)',
    soft: 'var(--color-cat-video-soft)',
  },
  link: {
    label: 'Stored Link',
    plural: 'Stored Links',
    color: 'var(--color-cat-link)',
    soft: 'var(--color-cat-link-soft)',
  },
  note: {
    label: 'Note',
    plural: 'Notes',
    color: 'var(--color-cat-note)',
    soft: 'var(--color-cat-note-soft)',
  },
  diary: {
    label: 'Diary Entry',
    plural: 'Diary',
    color: 'var(--color-cat-diary)',
    soft: 'var(--color-cat-diary-soft)',
  },
  goal: {
    label: 'Goal',
    plural: 'Goals',
    color: 'var(--color-cat-goal)',
    soft: 'var(--color-cat-goal-soft)',
  },
  task: {
    label: 'Task List',
    plural: 'Tasks',
    color: 'var(--color-cat-task)',
    soft: 'var(--color-cat-task-soft)',
  },
};

// Two worlds group the tabs by the user's mental mode:
//   Vault   — reference material you collect (prompts, links, notes)
//   Journey — your personal growth space (diary, goals, tasks)
export const WORLDS = [
  { id: 'vault', label: 'Vault' },
  { id: 'journey', label: 'Journey' },
];

// Tabs per world. 'all' and 'folder' stay in Vault; Journey has its own three.
export const TABS_BY_WORLD = {
  vault: [
    { id: 'all', label: 'All' },
    { id: 'image', label: 'Image Prompts' },
    { id: 'video', label: 'Video Prompts' },
    { id: 'link', label: 'Stored Links' },
    { id: 'note', label: 'Notes' },
    { id: 'folder', label: 'Folders' },
  ],
  journey: [
    { id: 'diary', label: 'Diary' },
    { id: 'goal', label: 'Goals' },
    { id: 'task', label: 'Tasks' },
  ],
};

// Which world a given tab id belongs to (used to keep the switcher in sync).
export const WORLD_OF_TAB = {
  all: 'vault', image: 'vault', video: 'vault', link: 'vault',
  note: 'vault', folder: 'vault',
  diary: 'journey', goal: 'journey', task: 'journey',
};

// Kept for backward compatibility with anything importing TABS directly.
export const TABS = [
  ...TABS_BY_WORLD.vault,
  ...TABS_BY_WORLD.journey,
];
