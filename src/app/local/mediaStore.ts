export type LocalMediaRef = `local-media:${string}`;

type StoredMedia = {
  id: string;
  type: string;
  name: string;
  size: number;
  createdAt: string;
  blob: Blob;
};

const DB_NAME = 'blog-local-media';
const STORE = 'media';
const VERSION = 1;

function generateId() {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export async function saveLocalImage(file: File): Promise<string> {
  const id = generateId();
  const record: StoredMedia = {
    id,
    type: file.type,
    name: file.name,
    size: file.size,
    createdAt: new Date().toISOString(),
    blob: file
  };
  try {
    await tx('readwrite', (s) => s.put(record));
    return `local-media:${id}`;
  } catch {
    // Fallback for environments where IndexedDB is blocked (private mode / policies).
    return fileToDataUrl(file);
  }
}

export async function loadLocalMedia(ref: string): Promise<Blob | null> {
  if (!ref.startsWith('local-media:')) return null;
  const id = ref.slice('local-media:'.length);
  const record = await tx<any>('readonly', (s) => s.get(id));
  return record?.blob ?? null;
}
