import type { PostCategory } from '../content/types';

export type LocalPost = {
  id: string; // `${category}/${slug}`
  slug: string;
  title: string;
  date?: string; // legacy
  datetime?: string;
  category: PostCategory;
  tags: string[];
  summary: string;
  thumbnail?: { src: string; alt?: string };
  draft?: boolean;
  doc: any;
  updatedAt: string;
};

const KEY = 'blog.local.posts.v1';

function readAll(): LocalPost[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LocalPost[];
  } catch {
    return [];
  }
}

function writeAll(posts: LocalPost[]) {
  localStorage.setItem(KEY, JSON.stringify(posts));
}

export function listLocalPosts(): LocalPost[] {
  const dt = (p: LocalPost) => p.datetime ?? p.date ?? '';
  return readAll().sort((a, b) => dt(b).localeCompare(dt(a)));
}

export function getLocalPost(id: string): LocalPost | null {
  return readAll().find((p) => p.id === id) ?? null;
}

export function upsertLocalPost(post: Omit<LocalPost, 'updatedAt'>) {
  const all = readAll();
  const next: LocalPost = { ...post, updatedAt: new Date().toISOString() };
  const idx = all.findIndex((p) => p.id === post.id);
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  writeAll(all);
}

export function deleteLocalPost(id: string) {
  const all = readAll().filter((p) => p.id !== id);
  writeAll(all);
}

export function clearLocalPosts() {
  localStorage.removeItem(KEY);
}
