/**
 * Persistence. The sealed vault lives in IndexedDB (no size cliff like
 * localStorage, which matters once recipe photos accumulate). Everything
 * written here is already encrypted by lib/os/crypto.
 */

import type { Sealed } from "./crypto";

const DB_NAME = "batch-os";
const STORE = "vault";
const KEY = "sealed";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function readSealed(): Promise<Sealed | null> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve((req.result as Sealed) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function writeSealed(sealed: Sealed): Promise<void> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(sealed, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearVault(): Promise<void> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function hasVault(): Promise<boolean> {
  return (await readSealed()) !== null;
}
