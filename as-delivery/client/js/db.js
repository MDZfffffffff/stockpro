// IndexedDB wrapper for offline storage
const DB_NAME = 'as-delivery-offline';
const DB_VERSION = 1;

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pending_deliveries')) {
        const store = db.createObjectStore('pending_deliveries', { keyPath: 'localId', autoIncrement: true });
        store.createIndex('invoice_no', 'invoice_no', { unique: false });
      }
      if (!db.objectStoreNames.contains('cached_deliveries')) {
        db.createObjectStore('cached_deliveries', { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

async function addPending(record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_deliveries', 'readwrite');
    const req = tx.objectStore('pending_deliveries').add({ ...record, _ts: Date.now() });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllPending() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_deliveries', 'readonly');
    const req = tx.objectStore('pending_deliveries').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function clearPending(localIds) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_deliveries', 'readwrite');
    const store = tx.objectStore('pending_deliveries');
    let done = 0;
    if (localIds.length === 0) { resolve(); return; }
    for (const id of localIds) {
      const req = store.delete(id);
      req.onsuccess = () => { if (++done === localIds.length) resolve(); };
      req.onerror = () => reject(req.error);
    }
  });
}

async function cacheDeliveries(rows) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cached_deliveries', 'readwrite');
    const store = tx.objectStore('cached_deliveries');
    for (const row of rows) store.put(row);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getCachedDeliveries() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cached_deliveries', 'readonly');
    const req = tx.objectStore('cached_deliveries').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

window.OfflineDB = { addPending, getAllPending, clearPending, cacheDeliveries, getCachedDeliveries };
