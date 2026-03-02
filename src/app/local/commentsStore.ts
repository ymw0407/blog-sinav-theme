export type LocalComment = {
  id: string;
  postId: string;
  user: string;
  body: string;
  createdAt: string;
};

const KEY = 'blog.local.comments.v1';

function readAll(): LocalComment[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LocalComment[];
  } catch {
    return [];
  }
}

function writeAll(comments: LocalComment[]) {
  localStorage.setItem(KEY, JSON.stringify(comments));
}

export function listLocalComments(postId: string): LocalComment[] {
  return readAll()
    .filter((c) => c.postId === postId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function addLocalComment(params: { postId: string; user: string; body: string }) {
  const all = readAll();
  const comment: LocalComment = {
    id: crypto.randomUUID(),
    postId: params.postId,
    user: params.user.trim() || 'local',
    body: params.body,
    createdAt: new Date().toISOString()
  };
  all.push(comment);
  writeAll(all);
  return comment;
}

