// Kaban IndexedDB layer — v3 adds the 'meta' store (vault security settings).
// Existing users upgrade automatically; their items are untouched.
const DB_NAME = 'kaban-db';
const ITEMS = 'items';
const FOLDERS = 'folders';
const META = 'meta';
const VERSION = 3;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(ITEMS)) {
        db.createObjectStore(ITEMS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(FOLDERS)) {
        db.createObjectStore(FOLDERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(db, store, mode) {
  return db.transaction(store, mode).objectStore(store);
}

function reqGetAll(store) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const req = tx(db, store, 'readonly').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      })
  );
}

// Svelte 5 $state values are Proxies, which IndexedDB cannot structured-clone
// (it throws DataCloneError and the write silently fails). Strip the proxy to a
// plain object before storing so every caller is safe.
function toPlain(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function reqPut(store, value) {
  const plain = toPlain(value);
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const req = tx(db, store, 'readwrite').put(plain);
        req.onsuccess = () => resolve(plain);
        req.onerror = () => reject(req.error);
      })
  );
}

function reqRemove(store, id) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const req = tx(db, store, 'readwrite').delete(id);
        req.onsuccess = () => resolve(id);
        req.onerror = () => reject(req.error);
      })
  );
}

function reqBulkPut(store, values) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(store, 'readwrite');
        const s = t.objectStore(store);
        for (const v of values) s.put(toPlain(v));
        t.oncomplete = () => resolve(values.length);
        t.onerror = () => reject(t.error);
      })
  );
}

// Items
export const getAll = () => reqGetAll(ITEMS);
export const put = (item) => reqPut(ITEMS, item);
export const remove = (id) => reqRemove(ITEMS, id);
export const bulkPut = (items) => reqBulkPut(ITEMS, items);

// Folders
export const getAllFolders = () => reqGetAll(FOLDERS);
export const putFolder = (folder) => reqPut(FOLDERS, folder);
export const removeFolder = (id) => reqRemove(FOLDERS, id);
export const bulkPutFolders = (folders) => reqBulkPut(FOLDERS, folders);

// Meta (security settings, theme, drafts, etc.)
export const putMeta = (obj) => reqPut(META, obj);
export const removeMeta = (key) => reqRemove(META, key);
export const getMeta = (key) =>
  openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const req = tx(db, META, 'readonly').get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      })
  );
