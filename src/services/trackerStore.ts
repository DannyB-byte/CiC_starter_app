export type Entry = { id: string; kind: string; date: string; values: Record<string,string> };
function open(): Promise<IDBDatabase> {
  return new Promise((resolve,reject) => {
    const request = indexedDB.open('cic-tracking', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('entries', {keyPath:'id'});
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Database blocked. Close other app windows.'));
  });
}
async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try { return await new Promise<T>((resolve,reject) => {
    const tx = db.transaction('entries', mode);
    const request = operation(tx.objectStore('entries'));
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = () => reject(tx.error ?? new Error('Storage operation aborted.'));
    tx.onerror = () => reject(tx.error ?? new Error('Storage operation failed.'));
  }); } finally { db.close(); }
}
export const listEntries = () => transaction('readonly', store => store.getAll()) as Promise<Entry[]>;
export const saveEntry = (entry: Entry) => transaction('readwrite', store => store.put(entry));
export const deleteEntry = (id: string) => transaction('readwrite', store => store.delete(id));
