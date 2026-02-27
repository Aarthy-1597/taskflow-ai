const DB_NAME = 'taskflow-db';
const DB_VERSION = 1;
const ATTACHMENTS_STORE = 'attachments';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB is not available'));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(ATTACHMENTS_STORE)) {
        db.createObjectStore(ATTACHMENTS_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(ATTACHMENTS_STORE, mode);
        const store = tx.objectStore(ATTACHMENTS_STORE);
        const req = fn(store);
        req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
        req.onsuccess = () => resolve(req.result);
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          reject(tx.error ?? new Error('IndexedDB transaction failed'));
          db.close();
        };
      })
  );
}

export async function putAttachmentBlob(id: string, blob: Blob): Promise<void> {
  await withStore('readwrite', (store) => store.put(blob, id));
}

export async function getAttachmentBlob(id: string): Promise<Blob | undefined> {
  return withStore('readonly', (store) => store.get(id));
}

export async function deleteAttachmentBlob(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id));
}

