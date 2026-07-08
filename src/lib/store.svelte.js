import * as db from './db.js';

// Item shape:
// { id, type: 'image'|'video'|'link'|'note', title, content, tags: [], pinned, createdAt, updatedAt }

export const vault = $state({
  items: [],
  folders: [],
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
    const [items, folders] = await Promise.all([db.getAll(), db.getAllFolders()]);
    vault.items = items;
    vault.folders = folders;
  } catch (e) {
    console.error('Failed to load vault:', e);
    vault.items = [];
    vault.folders = [];
  }
  vault.loaded = true;
}

export function newId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// IndexedDB cannot clone Svelte's reactive proxies — always write plain copies.
function plain(i) {
  return {
    id: i.id,
    type: i.type,
    title: i.title,
    content: i.content,
    description: i.description || '',
    tags: [...(i.tags || [])],
    pinned: !!i.pinned,
    locked: !!i.locked,
    folderId: i.folderId || null,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  };
}

function plainFolder(f) {
  return {
    id: f.id,
    name: f.name,
    category: f.category || 'all',
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  };
}

export async function saveItem(data) {
  const now = Date.now();
  const existing = data.id ? vault.items.find((i) => i.id === data.id) : null;
  const item = {
    id: data.id || newId(),
    type: data.type,
    title: (data.title || '').trim() || 'Untitled',
    content: (data.content || '').trim(),
    description: (data.description || '').trim(),
    tags: [...(data.tags || [])],
    pinned: existing ? !!existing.pinned : false,
    locked: existing ? !!existing.locked : false,
    // Preserve folder when caller (e.g. NoteViewer) doesn't send folderId
    folderId:
      data.folderId !== undefined
        ? data.folderId || null
        : existing
          ? existing.folderId || null
          : null,
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

// ---- Folders ----

export async function saveFolder(data) {
  const now = Date.now();
  const existing = data.id ? vault.folders.find((f) => f.id === data.id) : null;
  const folder = {
    id: data.id || newId(),
    name: (data.name || '').trim() || 'Untitled folder',
    category: data.category || 'all',
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  };
  await db.putFolder(folder);
  if (existing) {
    const idx = vault.folders.findIndex((f) => f.id === folder.id);
    vault.folders[idx] = folder;
  } else {
    vault.folders.push(folder);
  }
  return folder;
}

export async function deleteFolder(id) {
  // Cards inside are NOT deleted — they just leave the folder.
  const members = vault.items.filter((i) => i.folderId === id).map(plain);
  for (const m of members) m.folderId = null;
  if (members.length) await db.bulkPut(members);
  await db.removeFolder(id);
  vault.items = vault.items.map((i) =>
    i.folderId === id ? { ...plain(i), folderId: null } : i
  );
  vault.folders = vault.folders.filter((f) => f.id !== id);
}

export async function deleteItem(id) {
  const item = vault.items.find((i) => i.id === id);
  if (item?.locked) throw new Error('Item is locked');
  await db.remove(id);
  vault.items = vault.items.filter((i) => i.id !== id);
}

export async function togglePin(item) {
  const updated = plain(item);
  updated.pinned = !item.pinned;
  await db.put(updated);
  const idx = vault.items.findIndex((i) => i.id === item.id);
  vault.items[idx] = updated;
}

export async function toggleLock(item) {
  const updated = plain(item);
  updated.locked = !item.locked;
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
    items: vault.items.map(plain),
    folders: vault.folders.map(plainFolder),
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

// Share selected cards as a JSON file (same format as backup, so the
// receiver can import it via Backup & Restore -> Restore from file).
export async function shareItems(ids) {
  const items = vault.items.filter((i) => ids.includes(i.id)).map(plain);
  if (!items.length) return 'empty';
  const payload = {
    app: 'kaban',
    version: 1,
    exportedAt: new Date().toISOString(),
    items,
  };
  const json = JSON.stringify(payload, null, 2);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `kaban-share-${stamp}.json`;
  const file = new File([json], filename, { type: 'application/json' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Kaban cards',
        text: `${items.length} card${items.length === 1 ? '' : 's'} from my Kaban vault`,
      });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
      // fall through to download
    }
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
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
      description: raw.description || '',
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      pinned: !!raw.pinned,
      locked: !!raw.locked,
      folderId: raw.folderId || null,
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

  // Merge folders from backup (if present)
  const incomingFolders = Array.isArray(data.folders) ? data.folders : [];
  const folderById = new Map(vault.folders.map((f) => [f.id, f]));
  const foldersToWrite = [];
  for (const raw of incomingFolders) {
    if (!raw || !raw.id || !raw.name) continue;
    const folder = {
      id: raw.id,
      name: raw.name,
      category: raw.category || 'all',
      createdAt: raw.createdAt || Date.now(),
      updatedAt: raw.updatedAt || Date.now(),
    };
    const existing = folderById.get(folder.id);
    if (!existing || (folder.updatedAt || 0) > (existing.updatedAt || 0)) {
      foldersToWrite.push(folder);
    }
  }
  if (foldersToWrite.length) {
    await db.bulkPutFolders(foldersToWrite);
    for (const folder of foldersToWrite) {
      const idx = vault.folders.findIndex((f) => f.id === folder.id);
      if (idx >= 0) vault.folders[idx] = folder;
      else vault.folders.push(folder);
    }
  }
  return { added, updated };
}
