import type { Portfolio } from './types';

function b64Utf8(text: string) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(text)));
}

async function fileToBase64(file: File) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
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

export async function uploadPortfolioAsset(params: {
  octokit: any;
  owner: string;
  repo: string;
  scope: 'profile' | 'project' | 'cover' | 'work' | 'award' | 'certificate' | 'education' | 'publication';
  scopeId?: string;
  file: File;
  username: string;
}) {
  const safeName = params.file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const ext = safeName.includes('.') ? '' : '.png';
  const fileName = `${Date.now()}-${safeName}${ext}`;
  const safeScopeId = (params.scopeId ?? '').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-|-$/g, '');
  const subdir =
    params.scope === 'project'
      ? `projects/${safeScopeId || 'project'}`
      : params.scope === 'cover'
        ? 'cover'
        : params.scope === 'work'
          ? `work/${safeScopeId || 'work'}`
          : params.scope === 'award'
            ? `awards/${safeScopeId || 'award'}`
            : params.scope === 'certificate'
              ? `certificates/${safeScopeId || 'certificate'}`
            : params.scope === 'education'
              ? `education/${safeScopeId || 'education'}`
              : params.scope === 'publication'
                ? `publications/${safeScopeId || 'publication'}`
          : 'profile';
  const assetPath = `assets/portfolio/${subdir}/${fileName}`;

  await params.octokit.repos.createOrUpdateFileContents({
    owner: params.owner,
    repo: params.repo,
    path: assetPath,
    message: `chore(asset): add ${assetPath}\n\nGenerated-By: blog-web\nSource-User: ${params.username}`,
    content: await fileToBase64(params.file)
  });

  return `media/${assetPath}`;
}

export async function upsertPortfolioJsonInRepo(params: {
  owner: string;
  repo: string;
  octokit: any;
  portfolio: Portfolio;
  username: string;
}) {
  const path = 'portfolio/portfolio.json';
  const { sha } = await readJsonFromRepo({ owner: params.owner, repo: params.repo, octokit: params.octokit, path });
  const nextText = JSON.stringify(params.portfolio, null, 2) + '\n';
  await params.octokit.repos.createOrUpdateFileContents({
    owner: params.owner,
    repo: params.repo,
    path,
    message: `feat(portfolio): update\n\nGenerated-By: blog-web\nSource-User: ${params.username}`,
    content: b64Utf8(nextText),
    sha
  });
}
