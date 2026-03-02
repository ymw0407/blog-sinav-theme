import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../app/auth/AuthContext';
import { uploadAlbumImage, upsertAlbumJsonInRepo } from '../app/content/albumsRepo';
import { getAlbumsMerged } from '../app/content/contentindex';
import type { Album } from '../app/content/types';
import { getEnv } from '../app/env';
import { upsertLocalAlbum } from '../app/local/albumsStore';
import { saveLocalImage } from '../app/local/mediaStore';
import { isGitHubWriteEnabled, isLocalMode } from '../app/mode';
import ResolvedImage from '../shared/ui/ResolvedImage';

export default function AlbumEditorPage() {
  const env = getEnv();
  const nav = useNavigate();
  const { albumId } = useParams();
  const editingId = albumId ? decodeURIComponent(albumId) : null;

  const local = isLocalMode();
  const ghEnabled = isGitHubWriteEnabled();
  const { state, isAllowedUser, getOctokit, login } = useAuth();
  const canGitHubWrite = ghEnabled && Boolean(state.accessToken) && isAllowedUser;
  const canWrite = local ? true : canGitHubWrite;

  const existing = React.useMemo(() => {
    if (!editingId) return null;
    return getAlbumsMerged().find((a) => a.id === editingId) ?? null;
  }, [editingId]);

  const [id, setId] = React.useState(editingId ?? `album-${Date.now().toString(36).slice(-4)}`);
  const [title, setTitle] = React.useState(existing?.title ?? 'New Album');
  const [date, setDate] = React.useState(existing?.date ?? new Date().toISOString().slice(0, 10));
  const [periodFrom, setPeriodFrom] = React.useState(existing?.period?.from ?? '');
  const [periodTo, setPeriodTo] = React.useState(existing?.period?.to ?? '');
  const [description, setDescription] = React.useState(existing?.description ?? '');
  const [saving, setSaving] = React.useState(false);

  type EditItem =
    | {
        id: string;
        kind: 'existing';
        src: string;
        alt: string;
        caption: string;
        pinned: boolean;
        removed: boolean;
        replaceFile: File | null;
        replacePreview: string | null;
      }
    | {
        id: string;
        kind: 'new';
        file: File;
        preview: string;
        alt: string;
        caption: string;
        pinned: boolean;
        removed: boolean;
      };

  const [photoItems, setPhotoItems] = React.useState<EditItem[]>(() => {
    const base = existing?.items ?? [];
    return base.map((it, idx) => ({
      id: `ex:${idx}:${it.src}`,
      kind: 'existing' as const,
      src: it.src,
      alt: it.alt ?? '',
      caption: it.caption ?? '',
      pinned: Boolean(it.pinned),
      removed: false,
      replaceFile: null,
      replacePreview: null
    }));
  });
  const addInputRef = React.useRef<HTMLInputElement | null>(null);
  const replaceInputRef = React.useRef<HTMLInputElement | null>(null);
  const [addDragActive, setAddDragActive] = React.useState(false);
  const addDragDepthRef = React.useRef(0);
  const [replaceTargetId, setReplaceTargetId] = React.useState<string | null>(null);
  const [coverTargetId, setCoverTargetId] = React.useState<string | null>(null);

  // Initialize cover when creating a brand new album from an existing template state.
  React.useEffect(() => {
    if (editingId) return;
    if (coverTargetId) return;
    const coverSrc = existing?.cover?.src ?? null;
    if (!coverSrc) return;
    const match = photoItems.find((p) => p.kind === 'existing' && p.src === coverSrc) ?? null;
    if (match) setCoverTargetId(match.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  React.useEffect(() => {
    if (!existing) return;
    setId(existing.id);
    setTitle(existing.title ?? '');
    setDate(existing.date ?? new Date().toISOString().slice(0, 10));
    setPeriodFrom(existing.period?.from ?? '');
    setPeriodTo(existing.period?.to ?? '');
    setDescription(existing.description ?? '');
    const nextPhotos = (existing.items ?? []).map((it, idx) => ({
      id: `ex:${idx}:${it.src}`,
      kind: 'existing' as const,
      src: it.src,
      alt: it.alt ?? '',
      caption: it.caption ?? '',
      pinned: Boolean(it.pinned),
      removed: false,
      replaceFile: null,
      replacePreview: null
    }));
    setPhotoItems(nextPhotos);
    const coverSrc = existing.cover?.src ?? null;
    if (coverSrc) {
      const match = nextPhotos.find((p) => p.kind === 'existing' && p.src === coverSrc) ?? null;
      setCoverTargetId(match ? match.id : null);
    } else {
      setCoverTargetId(null);
    }
  }, [existing?.id]); // run once per album id

  React.useEffect(() => {
    // Cleanup object URLs created for previews.
    return () => {
      for (const it of photoItems) {
        if (it.kind === 'new') URL.revokeObjectURL(it.preview);
        if (it.kind === 'existing' && it.replacePreview) URL.revokeObjectURL(it.replacePreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (editingId && !existing) {
    return (
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h1 style={{ marginTop: 0 }}>Edit album</h1>
          <Link className="pill" to="/albums">
            Back
          </Link>
        </div>
        <div className="muted" style={{ marginTop: 8 }}>
          Album not found.
        </div>
      </div>
    );
  }

  const album: Album = {
    id: id.trim(),
    title: title.trim(),
    date: date.trim() || undefined,
    period: periodFrom.trim() ? { from: periodFrom.trim(), to: periodTo.trim() || undefined } : undefined,
    description: description.trim() || undefined,
    cover: existing?.cover,
    items: existing?.items ?? []
  };

  async function uploadImageForAlbum(file: File, albumId: string) {
    if (local) return await saveLocalImage(file);
    if (!canGitHubWrite) {
      await login(editingId ? `/albums/${encodeURIComponent(editingId)}/edit` : '/albums/new');
      throw new Error('Please login to upload.');
    }
    const octokit = getOctokit();
    return await uploadAlbumImage({
      octokit,
      owner: env.VITE_CONTENT_REPO_OWNER,
      repo: env.VITE_CONTENT_REPO_NAME,
      albumId,
      file,
      username: state.username ?? 'unknown'
    });
  }

  function addNewFiles(files: File[]) {
    if (!files.length) return;
    setPhotoItems((prev) => {
      const next = [...prev];
      for (const f of files) {
        if (!f.type.startsWith('image/')) continue;
        const preview = URL.createObjectURL(f);
        next.push({
          id: `new:${Date.now().toString(36)}:${Math.random().toString(16).slice(2)}`,
          kind: 'new',
          file: f,
          preview,
          alt: '',
          caption: '',
          pinned: false,
          removed: false
        });
      }
      return next;
    });
    if (addInputRef.current) addInputRef.current.value = '';
  }

  async function saveAll() {
    if (!album.id || !album.title) return;
    setSaving(true);
    try {
      const nextItems: NonNullable<Album['items']> = [];
      const idToSrc = new Map<string, string>();
      for (const it of photoItems) {
        if (it.removed) continue;
        if (it.kind === 'existing') {
          const src = it.replaceFile ? await uploadImageForAlbum(it.replaceFile, album.id) : it.src;
          idToSrc.set(it.id, src);
          nextItems.push({ src, alt: it.alt.trim() || undefined, caption: it.caption.trim() || undefined, pinned: it.pinned || undefined });
        } else {
          const src = await uploadImageForAlbum(it.file, album.id);
          idToSrc.set(it.id, src);
          nextItems.push({ src, alt: it.alt.trim() || undefined, caption: it.caption.trim() || undefined, pinned: it.pinned || undefined });
        }
      }

      const nextAlbum: Album = {
        ...album,
        items: nextItems
      };

      const coverSrc = coverTargetId ? idToSrc.get(coverTargetId) ?? null : null;
      if (coverSrc) nextAlbum.cover = { src: coverSrc, alt: nextAlbum.title };
      else if (!nextAlbum.cover && nextItems[0]?.src) nextAlbum.cover = { src: nextItems[0].src, alt: nextAlbum.title };

      if (local) {
        upsertLocalAlbum(nextAlbum);
      } else {
        const octokit = getOctokit();
        await upsertAlbumJsonInRepo({
          owner: env.VITE_CONTENT_REPO_OWNER,
          repo: env.VITE_CONTENT_REPO_NAME,
          octokit,
          album: nextAlbum,
          username: state.username ?? 'unknown'
        });
      }

      nav(`/albums/${encodeURIComponent(nextAlbum.id)}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ marginTop: 0 }}>{editingId ? 'Edit album' : 'New album'}</h1>
        {!state.accessToken && !local ? (
          <button className="btn primary" onClick={() => login(editingId ? `/albums/${encodeURIComponent(editingId)}/edit` : '/albums/new')}>
            Login with GitHub
          </button>
        ) : (
          <div className="pill">{local ? 'local mode' : `@${state.username ?? 'unknown'}`}</div>
        )}
      </div>

      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
        <div className="col-12">
          <label className="muted">Album ID</label>
          <input className="input" value={id} onChange={(e) => setId(e.target.value)} disabled={saving || Boolean(editingId)} />
          {editingId ? (
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              Album ID is fixed to avoid breaking links.
            </div>
          ) : null}
        </div>

        <div className="col-12">
          <label className="muted">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} disabled={saving} />
        </div>

        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="muted">Date (optional)</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} disabled={saving} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="muted">Period From (optional)</label>
            <input type="date" className="input" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} disabled={saving} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="muted">Period To (optional)</label>
            <input type="date" className="input" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} disabled={saving} />
          </div>
        </div>

        <div className="col-12">
          <label className="muted">Description (optional)</label>
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving} style={{ minHeight: 90 }} />
        </div>

        <div className="col-12" style={{ marginTop: 8 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Photos</h2>
            <div className="muted" style={{ fontSize: 12 }}>
              Saved when you click Save.
            </div>
          </div>

          <input
            ref={addInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            disabled={saving || !canWrite}
            onChange={(e) => addNewFiles(Array.from(e.target.files ?? []))}
          />
          <input
            ref={replaceInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            disabled={saving || !canWrite}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (!file || !replaceTargetId) return;
              setPhotoItems((prev) =>
                prev.map((it) => {
                  if (it.id !== replaceTargetId) return it;
                  if (it.kind === 'existing') {
                    if (it.replacePreview) URL.revokeObjectURL(it.replacePreview);
                    return { ...it, replaceFile: file, replacePreview: URL.createObjectURL(file), removed: false };
                  }
                  // new item: replace its file/preview
                  URL.revokeObjectURL(it.preview);
                  return { ...it, file, preview: URL.createObjectURL(file), removed: false };
                })
              );
              setReplaceTargetId(null);
              if (replaceInputRef.current) replaceInputRef.current.value = '';
            }}
          />

          <div
            className={`dropZone${addDragActive ? ' active' : ''}`}
            style={{ marginTop: 10 }}
            onClick={() => (addInputRef.current && !saving && canWrite ? addInputRef.current.click() : null)}
            onDragEnter={(e) => {
              e.preventDefault();
              if (saving || !canWrite) return;
              addDragDepthRef.current += 1;
              setAddDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              addDragDepthRef.current -= 1;
              if (addDragDepthRef.current <= 0) {
                addDragDepthRef.current = 0;
                setAddDragActive(false);
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (saving || !canWrite) return;
              setAddDragActive(true);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (saving || !canWrite) return;
              addDragDepthRef.current = 0;
              setAddDragActive(false);
              addNewFiles(Array.from(e.dataTransfer.files ?? []));
            }}
          >
            <div style={{ fontWeight: 750 }}>Add photos</div>
            <div className="muted" style={{ fontSize: 12 }}>
              drag & drop, or click (multiple supported)
            </div>
            {!canWrite ? (
              <div className="muted" style={{ fontSize: 12 }}>
                {local ? 'Read-only.' : 'Login required to add photos.'}
              </div>
            ) : null}
          </div>

          {photoItems.length ? (
            <div className="albumEditGrid" style={{ marginTop: 12 }}>
              {[...photoItems]
                .sort((a, b) => {
                  if (a.removed !== b.removed) return a.removed ? 1 : -1;
                  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                  return a.id.localeCompare(b.id);
                })
                .map((it) => {
                const removed = it.removed;
                const key = it.id;
                const previewSrc = it.kind === 'existing' ? it.replacePreview : it.preview;
                const existingSrc = it.kind === 'existing' ? it.src : null;
                const isCover = coverTargetId === it.id;
                return (
                  <div key={key} className={`albumEditCard${removed ? ' isRemoved' : ''}`}>
                    <div className="mediaPreviewFrame" style={{ aspectRatio: '16 / 10' }}>
                      {previewSrc ? (
                        <img src={previewSrc} alt="Preview" className="mediaPreviewImg" />
                      ) : existingSrc ? (
                        <ResolvedImage src={existingSrc} alt={album.title} className="mediaPreviewImg" loading="lazy" />
                      ) : null}
                    </div>

                    <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                      <div className="row" style={{ justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                        <button
                          type="button"
                          className={`pill${it.pinned ? ' selected' : ''}`}
                          disabled={saving || !canWrite}
                          onClick={() => {
                            setPhotoItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, pinned: !x.pinned, removed: false } : x)));
                          }}
                        >
                          {it.pinned ? 'Pinned' : 'Pin'}
                        </button>
                        <button
                          type="button"
                          className={`pill${isCover ? ' selected' : ''}`}
                          disabled={saving || !canWrite}
                          onClick={() => {
                            setPhotoItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, removed: false } : x)));
                            setCoverTargetId((cur) => (cur === it.id ? null : it.id));
                          }}
                          aria-pressed={isCover}
                        >
                          {isCover ? 'Cover' : 'Set cover'}
                        </button>
                      </div>

                      <div>
                        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                          Caption
                        </div>
                        <input
                          className="input"
                          value={it.caption}
                          disabled={saving || !canWrite || removed}
                          onChange={(e) => {
                            const v = e.target.value;
                            setPhotoItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, caption: v } : x)));
                          }}
                        />
                      </div>
                      <div>
                        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                          Alt text
                        </div>
                        <input
                          className="input"
                          value={it.alt}
                          disabled={saving || !canWrite || removed}
                          onChange={(e) => {
                            const v = e.target.value;
                            setPhotoItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, alt: v } : x)));
                          }}
                        />
                      </div>

                      <div className="row" style={{ justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn"
                          disabled={saving || !canWrite}
                          onClick={() => {
                            setReplaceTargetId(it.id);
                            if (replaceInputRef.current) replaceInputRef.current.click();
                          }}
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          className={removed ? 'btn' : 'btn danger'}
                          disabled={saving || !canWrite}
                          onClick={() => {
                            setPhotoItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, removed: !x.removed } : x)));
                            if (!removed && coverTargetId === it.id) setCoverTargetId(null);
                          }}
                        >
                          {removed ? 'Undo' : it.kind === 'new' ? 'Remove' : 'Delete'}
                        </button>
                      </div>

                      {removed ? (
                        <div className="muted" style={{ fontSize: 12 }}>
                          Marked for deletion (won't be saved).
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
              No photos yet.
            </div>
          )}
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
        <Link to={editingId ? `/albums/${encodeURIComponent(editingId)}` : '/albums'} className="pill">
          Cancel
        </Link>

        <div className="row" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            className="btn primary"
            disabled={saving || !canWrite || !album.id || !album.title}
            onClick={saveAll}
          >
            {saving ? 'Saving...' : local ? 'Save (local)' : 'Save to repo'}
          </button>
        </div>
      </div>
    </div>
  );
}

