/** IndexedDB storage for larger local demo media (images uploaded to the CMS media library). */
const DB_NAME = "m212-media";
const STORE = "files";
export const MEDIA_MAX_BYTES = 2 * 1024 * 1024;
export const MEDIA_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

export function validateMediaFile(file: { type: string; size: number }): string | null {
  if (!MEDIA_TYPES.includes(file.type)) return "Only PNG, JPEG, WebP, GIF or SVG images are allowed.";
  if (file.size > MEDIA_MAX_BYTES) return "Images must be 2 MB or smaller.";
  return null;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("IndexedDB unavailable")); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await open();
  return new Promise((resolve, reject) => {
    const r = fn(d.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export const mediaDb = {
  put: (id: string, blob: Blob) => tx("readwrite", (s) => s.put(blob, id)),
  get: (id: string) => tx<Blob | undefined>("readonly", (s) => s.get(id) as IDBRequest<Blob | undefined>),
  delete: (id: string) => tx("readwrite", (s) => s.delete(id)),
  clear: () => tx("readwrite", (s) => s.clear()),
};
