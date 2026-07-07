import * as db from './db.js';

// Item shape:
// { id, type: 'image'|'video'|'link'|'note', title, content, tags: [], pinned, createdAt, updatedAt }

export const vault = $state({
  items: [],
  loaded: false,
  toast: null,
});

let toastTimer = null;

export function toast(message) {
  vault.toast = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (vault.toast = null), 1800);
}

export async function loadVault() {
  try {
    vault.items = await db.getAll();
  } catch (e) {
    console.error('Failed to load vault:', e);
    vault.items = [];
  }
  vault.loaded = true;
}

export function newId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export async function saveItem(data) {
  const now = Date.now();
  const existing = data.id ? vault.items.find((i) => i.id === data.id) : null;
  const item = {
    id: data.id || newId(),
    type: data.type,
    title: (data.title || '').trim() || 'Untitled',
    content: (data.content || '').trim(),
    tags: data.tags || [],
    pinned: existing ? existing.pinned : false,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  };
  await db.put(item);
  if (existing) {
    const idx = vault.items.findIndex((i) => i.id === item.id);
    vault.items[idx] = item;
  } else {
    vault.items.push(item);
  }
  return item;
}

export async function deleteItem(id) {
  await db.remove(id);
  vault.items = vault.items.filter((i) => i.id !== id);
}

export async function togglePin(item) {
  const updated = { ...item, pinned: !item.pinned, updatedAt: item.updatedAt };
  await db.put(updated);
  const idx = vault.items.findIndex((i) => i.id === item.id);
  vault.items[idx] = updated;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older WebViews
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {}
    document.body.removeChild(ta);
    return ok;
  }
}

// ---- Backup / Restore ----

export function exportBackup() {
  const payload = {
    app: 'kaban',
    version: 1,
    exportedAt: new Date().toISOString(),
    items: vault.items,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `kaban-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file) {
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Not a valid JSON file.');
  }
  const incoming = Array.isArray(data) ? data : data.items;
  if (!Array.isArray(incoming)) throw new Error('No items found in this file.');

  const byId = new Map(vault.items.map((i) => [i.id, i]));
  let added = 0;
  let updated = 0;
  const toWrite = [];

  for (const raw of incoming) {
    if (!raw || !raw.id || !raw.type) continue;
    const item = {
      id: raw.id,
      type: raw.type,
      title: raw.title || 'Untitled',
      content: raw.content || '',
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      pinned: !!raw.pinned,
      createdAt: raw.createdAt || Date.now(),
      updatedAt: raw.updatedAt || Date.now(),
    };
    const existing = byId.get(item.id);
    if (!existing) {
      toWrite.push(item);
      added++;
    } else if ((item.updatedAt || 0) > (existing.updatedAt || 0)) {
      toWrite.push(item);
      updated++;
    }
  }

  if (toWrite.length) {
    await db.bulkPut(toWrite);
    for (const item of toWrite) {
      const idx = vault.items.findIndex((i) => i.id === item.id);
      if (idx >= 0) vault.items[idx] = item;
      else vault.items.push(item);
    }
  }
  return { added, updated };
}
