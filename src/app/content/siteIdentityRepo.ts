import type { SiteIdentity } from '../local/siteIdentityStore';

function b64Utf8(text: string) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(text)));
}

async function readJsonFromRepo(params: { owner: string; repo: string; octokit: any; path: string }) {
  let sha: string | undefined;
  let obj: any = null;
  try {
    const res = await params.octokit.repos.getContent({ owner: params.owner, repo: params.repo, path: params.path });
    if (!Array.isArray(res.data) && res.data.type === 'file') {
      sha = res.data.sha;
      const content = atob((res.data.content as string).replace(/\n/g, ''));
      const raw = new TextDecoder().decode(Uint8Array.from(content, (c) => c.charCodeAt(0)));
      obj = JSON.parse(raw);
    }
  } catch {
    // new file
  }
  return { sha, obj };
}

export async function upsertSiteIdentityJsonInRepo(params: {
  owner: string;
  repo: string;
  octokit: any;
  identity: SiteIdentity;
  username: string;
}) {
  const path = 'site/identity.json';
  const { sha } = await readJsonFromRepo({ owner: params.owner, repo: params.repo, octokit: params.octokit, path });
  const nextText = JSON.stringify(params.identity ?? {}, null, 2) + '\n';
  await params.octokit.repos.createOrUpdateFileContents({
    owner: params.owner,
    repo: params.repo,
    path,
    message: `feat(site): update landing identity\n\nGenerated-By: blog-web\nSource-User: ${params.username}`,
    content: b64Utf8(nextText),
    sha
  });
}

