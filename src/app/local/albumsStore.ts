import type { Album } from '../content/types';

type LocalAlbum = Album & { updatedAt: string; sourceKind: 'local' };

const KEY = 'blog.local.albums.v1';

function readAll(): LocalAlbum[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LocalAlbum[];
  } catch {
    return [];
  }
}

function writeAll(albums: LocalAlbum[]) {
  localStorage.setItem(KEY, JSON.stringify(albums));
}

export function listLocalAlbums(): LocalAlbum[] {
  return readAll().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export function getLocalAlbum(id: string): LocalAlbum | null {
  return readAll().find((a) => a.id === id) ?? null;
}

export function upsertLocalAlbum(album: Album) {
  const all = readAll();
  const next: LocalAlbum = {
    ...album,
    items: album.items ?? [],
    updatedAt: new Date().toISOString(),
    sourceKind: 'local'
  };
  const idx = all.findIndex((a) => a.id === album.id);
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  writeAll(all);
}

export function deleteLocalAlbum(id: string) {
  const all = readAll();
  const next = all.filter((a) => a.id !== id);
  writeAll(next);
}

export function clearLocalAlbums() {
  localStorage.removeItem(KEY);
}
