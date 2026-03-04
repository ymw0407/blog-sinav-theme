import type { CommentThread } from '../content/types';

const API_BASE = 'https://api.github.com';

async function ghJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json'
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub API error (${res.status})${text ? `: ${text}` : ''}`);
  }
  return (await res.json()) as T;
}

type SearchIssuesResponse = {
  items?: Array<{ number?: number; title?: string }>;
};

type IssueComment = {
  id: number;
  body?: string | null;
  created_at?: string | null;
  user?: { login?: string | null } | null;
};

async function findCommentIssueNumber(params: { owner: string; repo: string; postId: string }) {
  const { owner, repo, postId } = params;
  const q = `repo:${owner}/${repo} is:issue in:title "Comments: ${postId}"`;
  const url = `${API_BASE}/search/issues?q=${encodeURIComponent(q)}&per_page=1`;
  const data = await ghJson<SearchIssuesResponse>(url);
  const n = data.items?.[0]?.number ?? null;
  return typeof n === 'number' && n > 0 ? n : null;
}

async function listAllIssueComments(params: { owner: string; repo: string; issueNumber: number }) {
  const { owner, repo, issueNumber } = params;
  const out: IssueComment[] = [];
  const perPage = 100;
  for (let page = 1; page <= 20; page++) {
    const url = `${API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}/comments?per_page=${perPage}&page=${page}`;
    const chunk = await ghJson<IssueComment[]>(url);
    out.push(...chunk);
    if (chunk.length < perPage) break;
  }
  return out;
}

export async function fetchCommentThread(params: {
  owner: string;
  repo: string;
  postId: string;
  issueNumberHint?: number | null;
}): Promise<CommentThread | null> {
  const { owner, repo, postId } = params;
  const hint = typeof params.issueNumberHint === 'number' ? params.issueNumberHint : null;
  const issueNumber = hint ?? (await findCommentIssueNumber({ owner, repo, postId }));
  if (!issueNumber) return null;

  const raw = await listAllIssueComments({ owner, repo, issueNumber });
  const comments = raw
    .map((c) => ({
      id: c.id,
      user: c.user?.login ?? 'ghost',
      body: c.body ?? '',
      createdAt: c.created_at ?? new Date().toISOString()
    }))
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

  return { postId, issueNumber, comments };
}

