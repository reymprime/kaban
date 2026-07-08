// Kaban IndexedDB layer — v2 adds the 'folders' store.
// Existing users upgrade automatically; their items are untouched.
const DB_NAME = 'kaban-db';
const ITEMS = 'items';
const FOLDERS = 'folders';
const VERSION = 2;

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

function reqPut(store, value) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const req = tx(db, store, 'readwrite').put(value);
        req.onsuccess = () => resolve(value);
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
        for (const v of values) s.put(v);
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
