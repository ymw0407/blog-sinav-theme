import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../app/auth/AuthContext';
import { getSiteConfig } from '../app/config/siteConfig';
import { getPostById } from '../app/content/contentIndex';
import { loadDocByImportPath } from '../app/content/docLoader';
import { getEnv } from '../app/env';
import { clearEditorDraft, getEditorDraft, setEditorDraft, type EditorDraftData } from '../app/local/editorDraftStore';
import { deleteLocalPost, getLocalPost, upsertLocalPost } from '../app/local/postsStore';
import { saveLocalImage } from '../app/local/mediaStore';
import { isGitHubWriteEnabled, isLocalMode } from '../app/mode';
import RichEditor from '../app/editor/RichEditor';
import ResolvedImage from '../shared/ui/ResolvedImage';
import { datetimeLocalValueToIso, isoToDatetimeLocalValue } from '../shared/lib/datetime';
import { vars } from '../styles/tokens/theme.css';

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fileToBase64(file: File) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function b64Utf8(text: string) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(text)));
}

function nextSlugCandidate(base: string, n: number) {
  // n=0 => base, n=1 => base-2, n=2 => base-3 ...
  return n === 0 ? base : `${base}-${n + 1}`;
}

export default function EditorPage() {
  const { state, isAllowedUser, getOctokit, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const params = useParams();
  const env = getEnv();
  const local = isLocalMode();
  const ghEnabled = isGitHubWriteEnabled();
  const site = getSiteConfig();

  const editingId = params.category && params.slug ? `${params.category}/${params.slug}` : null;
  const canGitHubWrite = ghEnabled && Boolean(state.accessToken) && isAllowedUser;
  const canWrite = local ? true : canGitHubWrite;

  const [title, setTitle] = React.useState('New Post');
  const [datetime, setDatetime] = React.useState(new Date().toISOString());
  const [category, setCategory] = React.useState<string>(() => site.categories[0]?.key ?? 'dev');
  const [tags, setTags] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [thumbnail, setThumbnail] = React.useState<{ src: string; alt?: string } | null>(null);
  const [doc, setDoc] = React.useState<any>({ type: 'doc', content: [{ type: 'paragraph' }] });

  const [saving, setSaving] = React.useState(false);
  // Keep the editor unmounted until we've hydrated from localStorage / existing post,
  // because TipTap only reads initial content on mount.
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editorReady, setEditorReady] = React.useState(false);

  const originalIdRef = React.useRef<string | null>(null);
  const originalPathRef = React.useRef<string | null>(null);
  const thumbInputRef = React.useRef<HTMLInputElement | null>(null);

  const slug = slugify(title) || 'post';
  const postId = `${category}/${slug}`;
  const autosaveKey = editingId ? `edit:${editingId}` : 'new';

  const hydratedRef = React.useRef(false);
  const draftTimerRef = React.useRef<number | null>(null);
  const latestAutosaveRef = React.useRef<EditorDraftData | null>(null);
  const autosaveBlockedRef = React.useRef(false);

  React.useEffect(() => {
    hydratedRef.current = false;
    setError(null);
    setLoading(true);
    setEditorReady(false);
    autosaveBlockedRef.current = false;

    originalIdRef.current = editingId;
    originalPathRef.current = null;

    const d = getEditorDraft(autosaveKey);
    if (d) {
      setTitle(d.data.title);
      setDatetime(d.data.datetime ?? d.data.date ?? new Date().toISOString());
      setCategory(d.data.category);
      setTags(d.data.tags);
      setSummary(d.data.summary);
      setThumbnail(d.data.thumbnail);
      setDoc(d.data.doc ?? { type: 'doc', content: [{ type: 'paragraph' }] });
      hydratedRef.current = true;
      setLoading(false);
      setEditorReady(true);
      return;
    }

    (async () => {
      if (editingId) {
        if (local) {
          const p = getLocalPost(editingId);
          if (!p) throw new Error('Local post not found.');
          setTitle(p.title);
          setDatetime(p.datetime ?? p.date ?? new Date().toISOString());
          setCategory(p.category);
          setTags(p.tags.join(', '));
          setSummary(p.summary);
          setThumbnail(p.thumbnail ?? null);
          setDoc(p.doc ?? { type: 'doc', content: [{ type: 'paragraph' }] });
          hydratedRef.current = true;
          return;
        }

        const post = getPostById(editingId);
        if (!post) throw new Error('Post not found.');
        if (post.kind !== 'doc') throw new Error('MDX posts are read-only here. Convert to JSON(doc) to edit.');
        if (!post.docImportPath) throw new Error('Missing docImportPath.');

        originalPathRef.current = post.docImportPath.replace(/^\/content\//, '');

        const loaded = await loadDocByImportPath(post.docImportPath);
        // The JSON file is a full post payload: { title, date, category, tags, summary, thumbnail?, content: DocJson }.
        // Older/edge cases may contain just the doc itself, so normalize.
        const payloadRaw = (loaded ?? {}) as any;
        const payload =
          payloadRaw && typeof payloadRaw === 'object' && payloadRaw.type === 'doc' && Array.isArray(payloadRaw.content)
            ? { content: payloadRaw }
            : payloadRaw;

        setTitle(String(payload.title ?? post.title ?? ''));
        const dt = String(payload.datetime ?? payload.date ?? (post as any).datetime ?? (post as any).date ?? new Date().toISOString());
        setDatetime(dt);
        setCategory(String(payload.category ?? post.category ?? site.categories[0]?.key ?? 'dev'));
        setTags(Array.isArray(payload.tags) ? payload.tags.join(', ') : String(post.tags?.join(', ') ?? ''));
        setSummary(String(payload.summary ?? post.summary ?? ''));
        if (payload.thumbnail || (post as any).thumbnail) {
          const t = (payload.thumbnail ?? (post as any).thumbnail) as any;
          setThumbnail(t && typeof t.src === 'string' ? { src: String(t.src), alt: t.alt ? String(t.alt) : undefined } : null);
        } else {
          setThumbnail(null);
        }
        const nextDoc = payload.content ?? payload.doc ?? { type: 'doc', content: [{ type: 'paragraph' }] };
        setDoc(nextDoc);
        hydratedRef.current = true;
        return;
      }

      // new post defaults
      setThumbnail(null);
      setDatetime(new Date().toISOString());
      setCategory((cur) => cur || site.categories[0]?.key || 'dev');
      hydratedRef.current = true;
    })()
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => {
        setLoading(false);
        setEditorReady(true);
      });
  }, [autosaveKey, editingId, local, site.categories]);

  React.useLayoutEffect(() => {
    if (!canWrite) return;
    if (loading) return;
    if (!hydratedRef.current) return;
    if (autosaveBlockedRef.current) return;

    latestAutosaveRef.current = {
      title,
      datetime,
      date: (datetime || '').slice(0, 10),
      category,
      tags,
      summary,
      thumbnail,
      doc
    };
  }, [canWrite, loading, title, datetime, category, tags, summary, thumbnail, doc]);

  React.useEffect(() => {
    if (!canWrite) return;
    if (loading) return;
    if (!hydratedRef.current) return;
    if (autosaveBlockedRef.current) return;

    const data: EditorDraftData = {
      title,
      datetime,
      date: (datetime || '').slice(0, 10),
      category,
      tags,
      summary,
      thumbnail,
      doc
    };

    if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
    draftTimerRef.current = window.setTimeout(() => {
      try {
        setEditorDraft(autosaveKey, data);
      } catch {
        // ignore
      }
    }, 500);

    return () => {
      if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
    };
  }, [canWrite, loading, title, datetime, category, tags, summary, thumbnail, doc, autosaveKey]);

  React.useEffect(() => {
    if (!canWrite) return;
    if (loading) return;
    if (!hydratedRef.current) return;
    if (autosaveBlockedRef.current) return;

    const flush = () => {
      if (autosaveBlockedRef.current) return;
      const data = latestAutosaveRef.current;
      if (!data) return;
      try {
        setEditorDraft(autosaveKey, data);
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      flush();
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [canWrite, loading, autosaveKey]);

  async function getShaForPath(owner: string, repo: string, path: string) {
    const octokit = getOctokit();
    const res = await octokit.repos.getContent({ owner, repo, path });
    if (Array.isArray(res.data) || res.data.type !== 'file') throw new Error('Not a file.');
    return res.data.sha;
  }

  async function deleteGitHubFile(owner: string, repo: string, path: string, message: string) {
    const octokit = getOctokit();
    const sha = await getShaForPath(owner, repo, path);
    await octokit.repos.deleteFile({ owner, repo, path, sha, message });
  }

  async function uploadImage(file: File) {
    if (local) {
      throw new Error('Local upload handled internally.');
    }
    if (!canGitHubWrite) throw new Error('Not authenticated.');
    const octokit = getOctokit();
    const owner = env.VITE_CONTENT_REPO_OWNER;
    const repo = env.VITE_CONTENT_REPO_NAME;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const ext = safeName.includes('.') ? '' : '.png';
    const fileName = `${Date.now()}-${safeName}${ext}`;
    const assetPath = `assets/posts/${category}/${slug}/${fileName}`;
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: assetPath,
      message: `chore(asset): add ${assetPath}\n\nGenerated-By: blog-web\nSource-User: ${state.username ?? 'unknown'}`,
      content: await fileToBase64(file)
    });
    return `media/${assetPath}`;
  }

  async function setThumbnailFromFile(file: File) {
    if (!canWrite) return;
    if (local) {
      const src = await saveLocalImage(file);
      setThumbnail({ src, alt: file.name });
      return;
    }
    const src = await uploadImage(file);
    setThumbnail({ src, alt: file.name });
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 6 }}>{editingId ? 'Edit' : 'Write'}</h1>
          {editingId ? <div className="muted">id: {editingId}</div> : null}
        </div>
        {local ? (
          <div className="pill">local mode</div>
        ) : !state.accessToken ? (
          <button className="btn primary" onClick={() => login(loc.pathname)} type="button">
            GitHub login
          </button>
        ) : (
          <div className="pill">@{state.username ?? '-'}</div>
        )}
      </div>

      {state.accessToken && !isAllowedUser ? (
        <div className="card" style={{ borderColor: vars.color.danger, marginTop: 12 }}>
          This account is not allowed to write.
        </div>
      ) : null}

      {error ? (
        <div className="card" style={{ borderColor: vars.color.danger, marginTop: 12 }}>
          {error}
        </div>
      ) : null}

      {editingId ? (
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
          <button
            className="btn danger"
            disabled={!canWrite || saving || loading}
            type="button"
            onClick={async () => {
              if (!confirm('Delete this post?')) return;
              setSaving(true);
              try {
                if (local) {
                  deleteLocalPost(editingId);
                  clearEditorDraft(autosaveKey);
                  alert('Deleted locally.');
                  nav('/timeline');
                  return;
                }
                if (!canGitHubWrite) throw new Error('GitHub write is not enabled.');
                const owner = env.VITE_CONTENT_REPO_OWNER;
                const repo = env.VITE_CONTENT_REPO_NAME;
                const originalPath = originalPathRef.current;
                if (!originalPath) throw new Error('Missing original path.');
                await deleteGitHubFile(
                  owner,
                  repo,
                  originalPath,
                  `chore(post): delete ${editingId}\n\nGenerated-By: blog-web\nSource-User: ${state.username ?? 'unknown'}`
                );
                clearEditorDraft(autosaveKey);
                alert('Deleted. A rebuild will deploy soon.');
                nav('/timeline');
              } catch (e) {
                alert(e instanceof Error ? e.message : String(e));
              } finally {
                setSaving(false);
              }
            }}
          >
            Delete
          </button>
        </div>
      ) : null}

      <div className="grid" style={{ marginTop: 12 }}>
        <div className="col-12">
          <label className="muted">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canWrite || saving || loading} />
        </div>
        <div className="col-6">
          <label className="muted">Datetime</label>
          <input
            type="datetime-local"
            step={1}
            className="input"
            value={isoToDatetimeLocalValue(datetime)}
            onChange={(e) => setDatetime(datetimeLocalValueToIso(e.target.value))}
            disabled={!canWrite || saving || loading}
          />
        </div>
        <div className="col-6">
          <label className="muted">Category</label>
          <select className="select editorCategorySelect" value={category} onChange={(e) => setCategory(e.target.value)} disabled={!canWrite || saving || loading}>
            {site.categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-6">
          <label className="muted">Tags (comma)</label>
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} disabled={!canWrite || saving || loading} />
        </div>
        <div className="col-6">
          <label className="muted">Summary</label>
          <input className="input" value={summary} onChange={(e) => setSummary(e.target.value)} disabled={!canWrite || saving || loading} />
        </div>
        <div className="col-12">
          <label className="muted">Thumbnail</label>
          <div className="row" style={{ gap: 12, alignItems: 'center' }}>
            <div className="thumbPreview">
              {thumbnail?.src ? (
                <ResolvedImage src={thumbnail.src} alt={thumbnail.alt ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
              ) : (
                <div className="muted" style={{ fontSize: 12 }}>
                  No thumbnail
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: 8, flex: 1, minWidth: 0 }}>
              <label className="pill" style={{ justifySelf: 'start', cursor: !canWrite || saving || loading ? 'not-allowed' : 'pointer', opacity: !canWrite || saving || loading ? 0.6 : 1 }}>
                {thumbnail ? 'Replace thumbnail' : '+ Thumbnail'}
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  disabled={!canWrite || saving || loading}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setThumbnailFromFile(file).catch((err) => alert(err instanceof Error ? err.message : String(err)));
                  }}
                />
              </label>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <input
                  className="input"
                  placeholder="Alt text (optional)"
                  value={thumbnail?.alt ?? ''}
                  disabled={!thumbnail || !canWrite || saving || loading}
                  onChange={(e) => setThumbnail((cur) => (cur ? { ...cur, alt: e.target.value } : cur))}
                  style={{ minWidth: 260, flex: 1 }}
                />
                {thumbnail ? (
                  <button
                    type="button"
                    className="btn"
                    disabled={!canWrite || saving || loading}
                    onClick={() => {
                      setThumbnail(null);
                      if (thumbInputRef.current) thumbInputRef.current.value = '';
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                Shown in post lists.
              </div>
            </div>
          </div>
        </div>
        <div className="col-12">
          <label className="muted">Content</label>
          {editorReady && !loading ? (
            <RichEditor key={autosaveKey} initialDoc={doc} onChange={(next) => setDoc(next)} onUploadImage={local ? undefined : uploadImage} />
          ) : (
            <div className="card" style={{ padding: 12 }}>
              <div className="muted">Loading editor...</div>
            </div>
          )}
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
        <div className="muted">
          {local ? `local: ${postId}` : `repo: ${env.VITE_CONTENT_REPO_OWNER}/${env.VITE_CONTENT_REPO_NAME} · path: posts/${category}/${slug}.json`}
        </div>
        <button
          className="btn primary"
          disabled={!canWrite || saving || loading}
          type="button"
          onClick={async () => {
            setSaving(true);
            try {
              const tagsArr = tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);

              const baseSlug = slugify(title) || 'post';

              // Allocate a unique slug/id so we never overwrite an unrelated post.
              const resolveUniqueSlug = async () => {
                const max = 80;
                for (let i = 0; i < max; i++) {
                  const cand = nextSlugCandidate(baseSlug, i);
                  const candId = `${category}/${cand}`;

                  // For edits, allow writing to the original id.
                  const sameAsEditing = Boolean(editingId && candId === editingId);

                  if (local) {
                    const taken = !sameAsEditing && (Boolean(getLocalPost(candId)) || Boolean(getPostById(candId)));
                    if (!taken) return cand;
                    continue;
                  }

                  // At minimum, avoid known index collisions.
                  if (!sameAsEditing && getPostById(candId)) continue;
                  if (!canGitHubWrite) return cand;

                  const owner = env.VITE_CONTENT_REPO_OWNER;
                  const repo = env.VITE_CONTENT_REPO_NAME;
                  const filePath = `posts/${category}/${cand}.json`;
                  const originalPath = originalPathRef.current;
                  if (editingId && originalPath && originalPath === filePath) return cand;

                  const octokit = getOctokit();
                  try {
                    const existing = await octokit.repos.getContent({ owner, repo, path: filePath });
                    if (!Array.isArray(existing.data) && existing.data.type === 'file') continue;
                    continue;
                  } catch {
                    return cand;
                  }
                }
                throw new Error('Could not allocate a unique post id. Try a different title.');
              };

              const finalSlug = await resolveUniqueSlug();
              const finalId = `${category}/${finalSlug}`;

              const payload = {
                title: title.trim(),
                datetime,
                date: (datetime || '').slice(0, 10),
                category,
                tags: tagsArr,
                summary: summary.trim(),
                ...(thumbnail ? { thumbnail } : {}),
                content: doc
              };

              if (local) {
                upsertLocalPost({
                  id: finalId,
                  slug: finalSlug,
                  title: payload.title,
                  datetime: payload.datetime,
                  date: payload.date,
                  category: payload.category as any,
                  tags: payload.tags,
                  summary: payload.summary,
                  thumbnail: thumbnail ?? undefined,
                  doc: payload.content
                });

                const originalId = originalIdRef.current;
                if (editingId && originalId && originalId !== finalId) deleteLocalPost(originalId);

                // Prevent unmount-flush from recreating the draft after we've cleared it.
                autosaveBlockedRef.current = true;
                latestAutosaveRef.current = null;
                if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
                draftTimerRef.current = null;
                clearEditorDraft(autosaveKey);
                alert('Saved locally.');
                nav(`/post/${encodeURIComponent(category)}/${encodeURIComponent(finalSlug)}`);
                return;
              }

              if (!canGitHubWrite) throw new Error('GitHub write is not enabled.');
              const octokit = getOctokit();
              const username = state.username ?? 'unknown';
              const owner = env.VITE_CONTENT_REPO_OWNER;
              const repo = env.VITE_CONTENT_REPO_NAME;
              const filePath = `posts/${category}/${finalSlug}.json`;

              let sha: string | undefined;
              try {
                const existing = await octokit.repos.getContent({ owner, repo, path: filePath });
                if (!Array.isArray(existing.data) && existing.data.type === 'file') sha = existing.data.sha;
              } catch {
                // ignore
              }

              const text = JSON.stringify(payload, null, 2) + '\n';
              await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: filePath,
                message: `${editingId ? 'feat(post): update' : 'feat(post): add'} ${category}/${finalSlug}\n\nGenerated-By: blog-web\nSource-User: ${username}`,
                content: b64Utf8(text),
                sha
              });

              const originalPath = originalPathRef.current;
              if (editingId && originalPath && originalPath !== filePath) {
                await deleteGitHubFile(
                  owner,
                  repo,
                  originalPath,
                  `chore(post): rename ${editingId} -> ${finalId}\n\nGenerated-By: blog-web\nSource-User: ${username}`
                );
              }

              // Prevent unmount-flush from recreating the draft after we've cleared it.
              autosaveBlockedRef.current = true;
              latestAutosaveRef.current = null;
              if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
              draftTimerRef.current = null;
              clearEditorDraft(autosaveKey);
              alert('Uploaded. A rebuild will deploy soon.');
              nav(`/post/${encodeURIComponent(category)}/${encodeURIComponent(finalSlug)}`);
            } catch (e) {
              alert(e instanceof Error ? e.message : String(e));
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving
            ? 'Saving...'
            : local
              ? (editingId ? 'Update (Local)' : 'Save (Local)')
              : editingId
                ? 'Update (GitHub)'
                : 'Save (GitHub)'}
        </button>
      </div>
    </div>
  );
}


