import type { GalleryWork } from '../content/types';

type LocalWork = GalleryWork & { updatedAt: string; sourceKind: 'local' };

const KEY = 'blog.local.gallery.v1';

function readAll(): LocalWork[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LocalWork[];
  } catch {
    return [];
  }
}

function writeAll(works: LocalWork[]) {
  localStorage.setItem(KEY, JSON.stringify(works));
}

export function listLocalWorks(): LocalWork[] {
  return readAll().sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.id.localeCompare(b.id));
}

export function upsertLocalWork(work: GalleryWork) {
  const all = readAll();
  const next: LocalWork = { ...work, updatedAt: new Date().toISOString(), sourceKind: 'local' };
  const idx = all.findIndex((w) => w.id === work.id);
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  writeAll(all);
}

export function deleteLocalWork(id: string) {
  const all = readAll().filter((w) => w.id !== id);
  writeAll(all);
}

export function clearLocalWorks() {
  localStorage.removeItem(KEY);
}
