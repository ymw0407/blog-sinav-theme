import type { Album } from './types';

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

async function readJsonArrayFromRepo(params: { owner: string; repo: string; octokit: any; path: string }) {
  let sha: string | undefined;
  let arr: any[] = [];
  try {
    const res = await params.octokit.repos.getContent({ owner: params.owner, repo: params.repo, path: params.path });
    if (!Array.isArray(res.data) && res.data.type === 'file') {
      sha = res.data.sha;
      const content = atob((res.data.content as string).replace(/\n/g, ''));
      const raw = new TextDecoder().decode(Uint8Array.from(content, (c) => c.charCodeAt(0)));
      const parsed = JSON.parse(raw);
      arr = Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // new file
  }
  if (!Array.isArray(arr)) arr = [];
  return { sha, arr };
}

export async function uploadAlbumImage(params: {
  octokit: any;
  owner: string;
  repo: string;
  albumId: string;
  file: File;
  username: string;
}) {
  const safeName = params.file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const ext = safeName.includes('.') ? '' : '.png';
  const fileName = `${Date.now()}-${safeName}${ext}`;
  const assetPath = `assets/albums/${params.albumId}/${fileName}`;
  await params.octokit.repos.createOrUpdateFileContents({
    owner: params.owner,
    repo: params.repo,
    path: assetPath,
    message: `chore(asset): add ${assetPath}\n\nGenerated-By: blog-web\nSource-User: ${params.username}`,
    content: await fileToBase64(params.file)
  });
  return `media/${assetPath}`;
}

export async function upsertAlbumJsonInRepo(params: {
  owner: string;
  repo: string;
  octokit: any;
  album: Album;
  username: string;
}) {
  const path = 'albums/albums.json';
  const { sha, arr } = await readJsonArrayFromRepo({ owner: params.owner, repo: params.repo, octokit: params.octokit, path });

  const idx = arr.findIndex((a: any) => a?.id === params.album.id);
  if (idx >= 0) arr[idx] = params.album;
  else arr.unshift(params.album);

  const nextText = JSON.stringify(arr, null, 2) + '\n';
  await params.octokit.repos.createOrUpdateFileContents({
    owner: params.owner,
    repo: params.repo,
    path,
    message: `feat(album): upsert ${params.album.id}\n\nGenerated-By: blog-web\nSource-User: ${params.username}`,
    content: b64Utf8(nextText),
    sha
  });
}

export async function deleteAlbumFromRepo(params: {
  owner: string;
  repo: string;
  octokit: any;
  albumId: string;
  username: string;
}) {
  const path = 'albums/albums.json';
  const { sha, arr } = await readJsonArrayFromRepo({ owner: params.owner, repo: params.repo, octokit: params.octokit, path });
  const next = arr.filter((a: any) => a?.id !== params.albumId);
  const nextText = JSON.stringify(next, null, 2) + '\n';
  await params.octokit.repos.createOrUpdateFileContents({
    owner: params.owner,
    repo: params.repo,
    path,
    message: `feat(album): delete ${params.albumId}\n\nGenerated-By: blog-web\nSource-User: ${params.username}`,
    content: b64Utf8(nextText),
    sha
  });
}

