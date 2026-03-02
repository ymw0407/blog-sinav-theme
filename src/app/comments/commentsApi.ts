import { Octokit } from '@octokit/rest';
import { getEnv } from '../env';

export async function ensureCommentIssue(octokit: Octokit, postId: string) {
  const env = getEnv();
  const owner = env.VITE_CONTENT_REPO_OWNER;
  const repo = env.VITE_CONTENT_REPO_NAME;

  const q = `repo:${owner}/${repo} is:issue in:title "Comments: ${postId}"`;
  const found = await octokit.search.issuesAndPullRequests({ q, per_page: 1 });
  const item = found.data.items[0];
  if (item?.number) return item.number;

  const created = await octokit.issues.create({
    owner,
    repo,
    title: `Comments: ${postId}`,
    body: `자동 생성된 댓글 스레드입니다.\n\npostId: \`${postId}\``,
    labels: ['blog-comment']
  });
  return created.data.number;
}

export async function createComment(octokit: Octokit, issueNumber: number, body: string) {
  const env = getEnv();
  return octokit.issues.createComment({
    owner: env.VITE_CONTENT_REPO_OWNER,
    repo: env.VITE_CONTENT_REPO_NAME,
    issue_number: issueNumber,
    body
  });
}

