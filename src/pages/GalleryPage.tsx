import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/auth/AuthContext';
import { getGalleryIndex } from '../app/content/contentIndex';
import { getEnv } from '../app/env';
import { deleteLocalWork, upsertLocalWork } from '../app/local/galleryStore';
import { saveLocalImage } from '../app/local/mediaStore';
import { isGitHubWriteEnabled, isLocalMode } from '../app/mode';
import JustifiedGrid, { type JustifiedItem } from '../shared/ui/JustifiedGrid';
import Lightbox, { type LightboxItem } from '../shared/ui/Lightbox';
import ResolvedImage from '../shared/ui/ResolvedImage';
import ThemeToggle from '../shared/ui/ThemeToggle';
import { IconChevronLeft, IconEdit, IconPin, IconTrash } from '../shared/ui/icons';

function isImageUrl(url: string) {
  if (url.startsWith('local-media:')) return true;
  if (url.startsWith('data:image/')) return true;
  return /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(url);
}

export default function GalleryPage() {
  const local = isLocalMode();
  const ghEnabled = isGitHubWriteEnabled();
  const { state, isAllowedUser, getOctokit, login } = useAuth();
  const env = getEnv();

  const canGitHubWrite = ghEnabled && Boolean(state.accessToken) && isAllowedUser;
  const canWrite = local ? true : canGitHubWrite;

  const [rev, setRev] = React.useState(0);
  const g = React.useMemo(() => getGalleryIndex(), [rev, local]);

  const works = React.useMemo(() => {
    const arr = [...g.works];
    arr.sort((a, b) => {
      const ap = a.pinned ? 1 : 0;
      const bp = b.pinned ? 1 : 0;
      if (ap !== bp) return bp - ap;
      const ad = a.date ?? '';
      const bd = b.date ?? '';
      if (ad !== bd) return bd.localeCompare(ad);
      return (a.title ?? '').localeCompare(b.title ?? '');
    });
    return arr;
  }, [g.works]);

  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const [focusId, setFocusId] = React.useState<string | null>(() => works[0]?.id ?? null);

  React.useEffect(() => {
    if (!works.length) return;
    if (focusId && works.some((w) => w.id === focusId)) return;
    setFocusId(works[0]?.id ?? null);
  }, [works, focusId]);

  const focused = React.useMemo(() => works.find((w) => w.id === focusId) ?? works[0] ?? null, [works, focusId]);

  const photos = React.useMemo(() => {
    const out: (JustifiedItem & { workId: string })[] = [];
    for (const w of works) {
      const a = (w.assets ?? []).find((x) => isImageUrl(x.url));
      if (!a) continue;
      out.push({
        key: `${w.id}:${a.url}`,
        src: a.url,
        alt: a.alt || w.title,
        caption: w.title,
        workId: w.id,
        pinned: w.pinned
      });
    }
    return out;
  }, [works]);

  const workById = React.useMemo(() => {
    const map = new Map<string, (typeof g.works)[number]>();
    for (const w of g.works) map.set(w.id, w);
    return map;
  }, [g.works]);

  const lightboxItems = React.useMemo(() => {
    return photos.map((p) => {
      const w = workById.get(p.workId);
      return {
        src: p.src,
        alt: p.alt,
        caption: w ? undefined : p.caption,
        meta: w
          ? {
              title: w.title,
              intent: w.intent,
              date: w.date,
              pinned: w.pinned,
              camera: w.camera,
              lens: w.lens,
              film: w.film,
              location: (w as any).location,
              note: w.note
            }
          : undefined
      } satisfies LightboxItem;
    });
  }, [photos, workById]);

  const focusedFirstPhotoIndex = React.useMemo(() => {
    if (!focused?.id) return -1;
    return photos.findIndex((p) => p.workId === focused.id);
  }, [focused?.id, photos]);

  const [addOpen, setAddOpen] = React.useState(false);
  const [addTitle, setAddTitle] = React.useState('New Work');
  const [addIntent, setAddIntent] = React.useState('');
  const [addDate, setAddDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [addCamera, setAddCamera] = React.useState('');
  const [addLens, setAddLens] = React.useState('');
  const [addFilm, setAddFilm] = React.useState('');
  const [addLocation, setAddLocation] = React.useState('');
  const [addNote, setAddNote] = React.useState('');
  const [addPinned, setAddPinned] = React.useState(false);
  const [adding, setAdding] = React.useState(false);

  const addInputRef = React.useRef<HTMLInputElement | null>(null);
  const [addDragActive, setAddDragActive] = React.useState(false);
  const addDragDepthRef = React.useRef(0);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!pendingPreview) return;
    return () => URL.revokeObjectURL(pendingPreview);
  }, [pendingPreview]);

  function clearPending() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
    addDragDepthRef.current = 0;
    setAddDragActive(false);
    if (addInputRef.current) addInputRef.current.value = '';
  }

  function setPendingFromFiles(files: FileList | null) {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'));
    const first = list[0] ?? null;
    setPendingFile(first);
    setPendingPreview(first ? URL.createObjectURL(first) : null);
  }

  async function fileToBase64(file: File) {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    return btoa(binary);
  }

  async function uploadGalleryAsset(file: File, workId: string) {
    if (local) throw new Error('Local upload handled internally.');
    if (!canGitHubWrite) throw new Error('Not authenticated.');
    const octokit = getOctokit();
    const owner = env.VITE_CONTENT_REPO_OWNER;
    const repo = env.VITE_CONTENT_REPO_NAME;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const ext = safeName.includes('.') ? '' : '.png';
    const fileName = `${Date.now()}-${safeName}${ext}`;
    const assetPath = `assets/gallery/${workId}/${fileName}`;
    const content = await fileToBase64(file);
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: assetPath,
      message: `chore(gallery-asset): add ${assetPath}\n\nGenerated-By: blog-web\nSource-User: ${state.username ?? 'unknown'}`,
      content
    });
    return `media/${assetPath}`;
  }

  async function upsertGitHubWorksJson(newWork: {
    id: string;
    title: string;
    intent: string;
    assets: { url: string; alt?: string }[];
    pinned?: boolean;
    date?: string;
    camera?: string;
    lens?: string;
    film?: string;
    location?: string;
    note?: string;
  }) {
    if (local) throw new Error('Local write handled internally.');
    if (!canGitHubWrite) throw new Error('Not authenticated.');
    const octokit = getOctokit();
    const owner = env.VITE_CONTENT_REPO_OWNER;
    const repo = env.VITE_CONTENT_REPO_NAME;
    const path = 'gallery/works.json';

    let sha: string | undefined;
    let existing: any = [];
    try {
      const res = await octokit.repos.getContent({ owner, repo, path });
      if (!Array.isArray(res.data) && res.data.type === 'file') {
        sha = res.data.sha;
        const base64 = String(res.data.content ?? '').replace(/\n/g, '');
        const bin = atob(base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const raw = new TextDecoder().decode(bytes);
        existing = JSON.parse(raw);
      }
    } catch {
      existing = [];
    }

    const arr = Array.isArray(existing) ? existing : [];
    const next = [newWork, ...arr.filter((w: any) => w?.id !== newWork.id)];
    const text = JSON.stringify(next, null, 2) + '\n';
    const content = btoa(String.fromCharCode(...new TextEncoder().encode(text)));

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `feat(gallery): add ${newWork.id}\n\nGenerated-By: blog-web\nSource-User: ${state.username ?? 'unknown'}`,
      content,
      sha
    });
  }

  async function addPhoto(file: File) {
    const title = addTitle.trim() || 'Untitled';
    const intent = addIntent.trim();
    const date = addDate.trim() || undefined;
    const camera = addCamera.trim() || undefined;
    const lens = addLens.trim() || undefined;
    const film = addFilm.trim() || undefined;
    const location = addLocation.trim() || undefined;
    const note = addNote.trim() || undefined;
    const pinned = addPinned;

    const id = `${date ?? new Date().toISOString().slice(0, 10)}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'work'}-${Date.now()
      .toString(36)
      .slice(-4)}`;

    setAdding(true);
    try {
      if (local) {
        const url = await saveLocalImage(file);
        upsertLocalWork({ id, title, intent, assets: [{ url, alt: file.name }], pinned, date, camera, lens, film, location, note, tags: [] });
        setAddOpen(false);
        clearPending();
        setAddPinned(false);
        setFocusId(id);
        setRev((x) => x + 1);
        return;
      }

      if (!canGitHubWrite) {
        await login('/gallery');
        return;
      }

      const url = await uploadGalleryAsset(file, id);
      await upsertGitHubWorksJson({ id, title, intent, assets: [{ url, alt: file.name }], pinned, date, camera, lens, film, location, note });
      alert('Uploaded. A rebuild will deploy soon.');
      setAddOpen(false);
      clearPending();
      setAddPinned(false);
    } finally {
      setAdding(false);
    }
  }

  const [editOpen, setEditOpen] = React.useState(false);
  const [editingWorkId, setEditingWorkId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editIntent, setEditIntent] = React.useState('');
  const [editDate, setEditDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [editCamera, setEditCamera] = React.useState('');
  const [editLens, setEditLens] = React.useState('');
  const [editFilm, setEditFilm] = React.useState('');
  const [editLocation, setEditLocation] = React.useState('');
  const [editNote, setEditNote] = React.useState('');
  const [editPinned, setEditPinned] = React.useState(false);
  const [editFile, setEditFile] = React.useState<File | null>(null);
  const [editPreview, setEditPreview] = React.useState<string | null>(null);
  const editInputRef = React.useRef<HTMLInputElement | null>(null);
  const [editDragActive, setEditDragActive] = React.useState(false);
  const editDragDepthRef = React.useRef(0);

  const editingWork = React.useMemo(() => {
    if (!editingWorkId) return null;
    return workById.get(editingWorkId) ?? null;
  }, [editingWorkId, workById]);

  React.useEffect(() => {
    if (!addOpen && !editOpen) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prevOverflow;
    };
  }, [addOpen, editOpen]);

  React.useEffect(() => {
    if (!addOpen && !editOpen) return;
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('drop', onDrop);
    window.addEventListener('dragover', onDragOver);
    return () => {
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('dragover', onDragOver);
    };
  }, [addOpen, editOpen]);

  React.useEffect(() => {
    if (!editPreview) return;
    return () => URL.revokeObjectURL(editPreview);
  }, [editPreview]);

  function openEdit(workId: string) {
    const w = workById.get(workId);
    if (!w) return;
    setEditingWorkId(workId);
    setEditTitle(w.title ?? '');
    setEditIntent(w.intent ?? '');
    setEditDate(w.date ?? new Date().toISOString().slice(0, 10));
    setEditCamera(w.camera ?? '');
    setEditLens(w.lens ?? '');
    setEditFilm(w.film ?? '');
    setEditLocation((w as any).location ?? '');
    setEditNote(w.note ?? '');
    setEditPinned(Boolean(w.pinned));
    setEditFile(null);
    if (editPreview) URL.revokeObjectURL(editPreview);
    setEditPreview(null);
    if (editInputRef.current) editInputRef.current.value = '';
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditingWorkId(null);
    setEditFile(null);
    setEditPinned(false);
    editDragDepthRef.current = 0;
    setEditDragActive(false);
    if (editPreview) URL.revokeObjectURL(editPreview);
    setEditPreview(null);
    if (editInputRef.current) editInputRef.current.value = '';
  }

  async function updateWork(workId: string) {
    setAdding(true);
    try {
    const current = workById.get(workId);
    if (!current) throw new Error('Work not found.');

    const nextTitle = editTitle.trim() || 'Untitled';
    const nextIntent = editIntent.trim();
    const nextDate = editDate.trim() || undefined;
    const nextCamera = editCamera.trim() || undefined;
    const nextLens = editLens.trim() || undefined;
    const nextFilm = editFilm.trim() || undefined;
    const nextLocation = editLocation.trim() || undefined;
    const nextNote = editNote.trim() || undefined;
    const nextPinned = editPinned;

    let nextAssetUrl = current.assets?.[0]?.url ?? '';
    let nextAssetAlt = current.assets?.[0]?.alt ?? current.title;
    if (editFile) {
      if (local) {
        nextAssetUrl = await saveLocalImage(editFile);
      } else {
        if (!canGitHubWrite) {
          await login('/gallery');
          return;
        }
        nextAssetUrl = await uploadGalleryAsset(editFile, workId);
      }
      nextAssetAlt = editFile.name;
    }

    const nextWork = {
      ...current,
      id: workId,
      title: nextTitle,
      intent: nextIntent,
      date: nextDate,
      pinned: nextPinned,
      camera: nextCamera,
      lens: nextLens,
      film: nextFilm,
      location: nextLocation,
      note: nextNote,
      assets: nextAssetUrl ? [{ url: nextAssetUrl, alt: nextAssetAlt }] : []
    };

    if (local) {
      upsertLocalWork(nextWork);
      setRev((x) => x + 1);
      closeEdit();
      return;
    }

    if (!canGitHubWrite) throw new Error('Not authenticated.');
    const octokit = getOctokit();
    const owner = env.VITE_CONTENT_REPO_OWNER;
    const repo = env.VITE_CONTENT_REPO_NAME;
    const path = 'gallery/works.json';

    let sha: string | undefined;
    let existing: any = [];
    const res = await octokit.repos.getContent({ owner, repo, path });
    if (!Array.isArray(res.data) && res.data.type === 'file') {
      sha = res.data.sha;
      const base64 = String(res.data.content ?? '').replace(/\n/g, '');
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const raw = new TextDecoder().decode(bytes);
      existing = JSON.parse(raw);
    }

    const arr = Array.isArray(existing) ? existing : [];
    const idx = arr.findIndex((w: any) => w?.id === workId);
    if (idx < 0) throw new Error('Work not found in repo.');
    arr[idx] = nextWork;

    const text = JSON.stringify(arr, null, 2) + '\n';
    const content = btoa(String.fromCharCode(...new TextEncoder().encode(text)));
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `feat(gallery): update ${workId}\n\nGenerated-By: blog-web\nSource-User: ${state.username ?? 'unknown'}`,
      content,
      sha
    });

    closeEdit();
    alert('Updated. A rebuild will deploy soon.');
    } finally {
      setAdding(false);
    }
  }

  async function setPinned(workId: string, pinned: boolean) {
    setAdding(true);
    try {
      const current = workById.get(workId);
      if (!current) throw new Error('Work not found.');
      const nextWork = { ...current, pinned };

      if (local) {
        upsertLocalWork(nextWork);
        setRev((x) => x + 1);
        return;
      }

      if (!canGitHubWrite) {
        await login('/gallery');
        return;
      }

      const octokit = getOctokit();
      const owner = env.VITE_CONTENT_REPO_OWNER;
      const repo = env.VITE_CONTENT_REPO_NAME;
      const path = 'gallery/works.json';

      let sha: string | undefined;
      let existing: any = [];
      const res = await octokit.repos.getContent({ owner, repo, path });
      if (!Array.isArray(res.data) && res.data.type === 'file') {
        sha = res.data.sha;
        const base64 = String(res.data.content ?? '').replace(/\n/g, '');
        const bin = atob(base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const raw = new TextDecoder().decode(bytes);
        existing = JSON.parse(raw);
      }

      const arr = Array.isArray(existing) ? existing : [];
      const idx = arr.findIndex((w: any) => w?.id === workId);
      if (idx < 0) throw new Error('Work not found in repo.');
      arr[idx] = nextWork;

      const text = JSON.stringify(arr, null, 2) + '\n';
      const content = btoa(String.fromCharCode(...new TextEncoder().encode(text)));
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `feat(gallery): ${pinned ? 'pin' : 'unpin'} ${workId}\n\nGenerated-By: blog-web\nSource-User: ${state.username ?? 'unknown'}`,
        content,
        sha
      });
      alert('Pinned state updated. A rebuild will deploy soon.');
    } finally {
      setAdding(false);
    }
  }

  async function deleteWork(workId: string) {
    if (!confirm('Delete this photo?')) return;

    setAdding(true);
    try {
    if (local) {
      deleteLocalWork(workId);
      setOpenIndex(null);
      setRev((x) => x + 1);
      closeEdit();
      return;
    }

    if (!canGitHubWrite) {
      await login('/gallery');
      return;
    }

    const octokit = getOctokit();
    const owner = env.VITE_CONTENT_REPO_OWNER;
    const repo = env.VITE_CONTENT_REPO_NAME;
    const path = 'gallery/works.json';

    let sha: string | undefined;
    let existing: any = [];
    const res = await octokit.repos.getContent({ owner, repo, path });
    if (!Array.isArray(res.data) && res.data.type === 'file') {
      sha = res.data.sha;
      const base64 = String(res.data.content ?? '').replace(/\n/g, '');
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const raw = new TextDecoder().decode(bytes);
      existing = JSON.parse(raw);
    }

    const arr = Array.isArray(existing) ? existing : [];
    const next = arr.filter((w: any) => w?.id !== workId);
    const text = JSON.stringify(next, null, 2) + '\n';
    const content = btoa(String.fromCharCode(...new TextEncoder().encode(text)));
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `feat(gallery): delete ${workId}\n\nGenerated-By: blog-web\nSource-User: ${state.username ?? 'unknown'}`,
      content,
      sha
    });

    setOpenIndex(null);
    closeEdit();
    alert('Deleted. A rebuild will deploy soon.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="galleryExhibit">
        <div className="exhibitTopbar">
          <Link to="/" className="exhibitBack exhibitExit" aria-label="Exit exhibition">
          <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 6 }}>
            <IconChevronLeft size={14} />
          </span>
          Exit
        </Link>
        <div className="exhibitTopTitle">Digital Exhibition</div>
        <div className="exhibitTopActions">
          {canWrite ? (
            <button type="button" className="exhibitBack" onClick={() => setAddOpen(true)}>
              Add photo
            </button>
          ) : null}
          <Link to="/timeline" className="exhibitBack">
            Timeline
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="exhibitHero">
        <h1 className="exhibitTitle">Gallery</h1>
        <p className="exhibitSubtitle">Scroll the wall, hover to reveal, click to enter. (mouse/scroll affects the space)</p>
      </div>

      {addOpen ? (
        <div
          className="exhibitAddOverlay"
          role="dialog"
          aria-modal="true"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.target === e.currentTarget && !adding) {
              clearPending();
              setAddOpen(false);
              setAddPinned(false);
            }
          }}
        >
          <div className="exhibitAddPanel" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="pill">Add photo</div>
              <button
                className="btn"
                type="button"
                disabled={adding}
                onClick={() => {
                  clearPending();
                  setAddOpen(false);
                  setAddPinned(false);
                }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Title
                </div>
                <input className="input" value={addTitle} onChange={(e) => setAddTitle(e.target.value)} disabled={adding} />
              </div>
              <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`pill${addPinned ? ' selected' : ''}`}
                  disabled={adding}
                  onClick={() => setAddPinned((x) => !x)}
                  aria-pressed={addPinned}
                  title="Pinned works appear first"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <IconPin size={14} />
                    Pin
                  </span>
                </button>
                <div className="muted" style={{ fontSize: 12 }}>
                  Pinned works show first.
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Intent (optional)
                </div>
                <input className="input" value={addIntent} onChange={(e) => setAddIntent(e.target.value)} disabled={adding} />
              </div>
              <div className="row" style={{ gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                    Date
                  </div>
                  <input type="date" className="input" value={addDate} onChange={(e) => setAddDate(e.target.value)} disabled={adding} />
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Photo
                </div>
                <input
                  ref={addInputRef}
                  type="file"
                  accept="image/*"
                  multiple={false}
                  disabled={adding}
                  style={{ display: 'none' }}
                  onChange={(e) => setPendingFromFiles(e.target.files)}
                />
                <div
                  className={`dropZone${addDragActive ? ' active' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label="Add photo: drag & drop or click to choose"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      addInputRef.current?.click();
                    }
                  }}
                  onClick={() => addInputRef.current?.click()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    if (adding) return;
                    addDragDepthRef.current += 1;
                    setAddDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    if (adding) return;
                    addDragDepthRef.current -= 1;
                    if (addDragDepthRef.current <= 0) {
                      addDragDepthRef.current = 0;
                      setAddDragActive(false);
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (adding) return;
                    setAddDragActive(true);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (adding) return;
                    addDragDepthRef.current = 0;
                    setAddDragActive(false);
                    setPendingFromFiles(e.dataTransfer.files);
                  }}
                >
                  <div style={{ fontWeight: 750 }}>Drag & drop an image</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    or click to choose
                  </div>
                  {pendingFile ? (
                    <div className="pill" style={{ justifySelf: 'start' }}>
                      Selected: {pendingFile.name}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="row" style={{ gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                    Camera (optional)
                  </div>
                  <input className="input" value={addCamera} onChange={(e) => setAddCamera(e.target.value)} disabled={adding} placeholder="e.g. Fujifilm X-T5" />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                    Lens (optional)
                  </div>
                  <input className="input" value={addLens} onChange={(e) => setAddLens(e.target.value)} disabled={adding} placeholder="e.g. 35mm f/1.4" />
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Film (optional)
                </div>
                <input className="input" value={addFilm} onChange={(e) => setAddFilm(e.target.value)} disabled={adding} placeholder="e.g. Kodak Portra 400" />
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Location (optional)
                </div>
                <input
                  className="input"
                  value={addLocation}
                  onChange={(e) => setAddLocation(e.target.value)}
                  disabled={adding}
                  placeholder="e.g. Seoul, KR"
                />
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Note (optional)
                </div>
                <textarea
                  className="textarea"
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  disabled={adding}
                  placeholder="Any extra notes?"
                  style={{ minHeight: 90 }}
                />
              </div>

              <div className="row" style={{ justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  {local ? 'Saved locally.' : 'Uploads to GitHub after rebuild.'}
                </div>
                <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                  {pendingFile ? (
                    <button className="btn" type="button" disabled={adding} onClick={() => clearPending()}>
                      Clear
                    </button>
                  ) : null}
                  <button
                    className="btn primary"
                    type="button"
                    disabled={adding || !pendingFile}
                    onClick={() => (pendingFile ? addPhoto(pendingFile).catch((err) => alert(err instanceof Error ? err.message : String(err))) : null)}
                  >
                    Upload
                  </button>
                </div>
              </div>

              {pendingPreview ? (
                <div className="mediaPreviewFrame" style={{ aspectRatio: '16 / 10' }}>
                  <img src={pendingPreview} alt={pendingFile?.name ?? 'Selected photo'} className="mediaPreviewImg" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {editOpen && editingWorkId ? (
        <div
          className="exhibitAddOverlay"
          role="dialog"
          aria-modal="true"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.target === e.currentTarget && !adding) closeEdit();
          }}
        >
          <div className="exhibitAddPanel" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="pill">Edit photo</div>
              <button className="btn" type="button" disabled={adding} onClick={() => closeEdit()}>
                Close
              </button>
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Title
                </div>
                <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} disabled={adding} />
              </div>
              <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`pill${editPinned ? ' selected' : ''}`}
                  disabled={adding}
                  onClick={() => setEditPinned((x) => !x)}
                  aria-pressed={editPinned}
                  title="Pinned works appear first"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <IconPin size={14} />
                    Pin
                  </span>
                </button>
                <div className="muted" style={{ fontSize: 12 }}>
                  Pinned works show first.
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Intent (optional)
                </div>
                <input className="input" value={editIntent} onChange={(e) => setEditIntent(e.target.value)} disabled={adding} />
              </div>
              <div className="row" style={{ gap: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                    Date
                  </div>
                  <input type="date" className="input" value={editDate} onChange={(e) => setEditDate(e.target.value)} disabled={adding} />
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Replace photo (optional)
                </div>
                <input
                  ref={editInputRef}
                  type="file"
                  accept="image/*"
                  disabled={adding}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (editPreview) URL.revokeObjectURL(editPreview);
                    setEditFile(file);
                    setEditPreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
                <div
                  className={`dropZone${editDragActive ? ' active' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label="Replace photo: drag & drop or click to choose"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      editInputRef.current?.click();
                    }
                  }}
                  onClick={() => editInputRef.current?.click()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    if (adding) return;
                    editDragDepthRef.current += 1;
                    setEditDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    if (adding) return;
                    editDragDepthRef.current -= 1;
                    if (editDragDepthRef.current <= 0) {
                      editDragDepthRef.current = 0;
                      setEditDragActive(false);
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (adding) return;
                    setEditDragActive(true);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (adding) return;
                    editDragDepthRef.current = 0;
                    setEditDragActive(false);
                    const file = e.dataTransfer.files?.[0] ?? null;
                    if (editPreview) URL.revokeObjectURL(editPreview);
                    setEditFile(file);
                    setEditPreview(file ? URL.createObjectURL(file) : null);
                    if (editInputRef.current) editInputRef.current.value = '';
                  }}
                >
                  <div style={{ fontWeight: 750 }}>Drag & drop an image</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    or click to choose
                  </div>
                  {editFile ? (
                    <div className="pill" style={{ justifySelf: 'start' }}>
                      Selected: {editFile.name}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="row" style={{ gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                    Camera (optional)
                  </div>
                  <input className="input" value={editCamera} onChange={(e) => setEditCamera(e.target.value)} disabled={adding} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                    Lens (optional)
                  </div>
                  <input className="input" value={editLens} onChange={(e) => setEditLens(e.target.value)} disabled={adding} />
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Film (optional)
                </div>
                <input className="input" value={editFilm} onChange={(e) => setEditFilm(e.target.value)} disabled={adding} />
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Location (optional)
                </div>
                <input className="input" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} disabled={adding} />
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Note (optional)
                </div>
                <textarea className="textarea" value={editNote} onChange={(e) => setEditNote(e.target.value)} disabled={adding} style={{ minHeight: 90 }} />
              </div>

              <div className="row" style={{ justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                <button
                  className="btn danger"
                  type="button"
                  disabled={adding}
                  onClick={() => deleteWork(editingWorkId).catch((err) => alert(err instanceof Error ? err.message : String(err)))}
                >
                  Delete
                </button>
                <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn" type="button" disabled={adding} onClick={() => closeEdit()}>
                    Cancel
                  </button>
                  <button
                    className="btn primary"
                    type="button"
                    disabled={adding}
                    onClick={() => updateWork(editingWorkId).catch((err) => alert(err instanceof Error ? err.message : String(err)))}
                  >
                    Save
                  </button>
                </div>
              </div>

              {(editPreview || editingWork?.assets?.[0]?.url) ? (
                <div className="mediaPreviewFrame" style={{ aspectRatio: '16 / 10' }}>
                  {editPreview ? (
                    <img src={editPreview} alt="Preview" className="mediaPreviewImg" />
                  ) : editingWork?.assets?.[0]?.url ? (
                    <ResolvedImage
                      src={editingWork.assets[0].url}
                      alt={editingWork.title ?? 'Preview'}
                      className="mediaPreviewImg"
                      loading="lazy"
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="exhibitLayout">
        <aside className="exhibitAside">
          {focused ? (
            <>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center', justifySelf: 'start' }}>
                {focused.pinned ? <div className="pill">Pinned</div> : null}
                <div className="pill">{focused.date ?? '-'}</div>
              </div>
              <h2 className="exhibitWorkTitle">{focused.title}</h2>
              <p className="exhibitIntent">{focused.intent}</p>
              {focused.camera || focused.lens || focused.film || (focused as any).location || focused.note ? (
                <div className="exhibitMetaGrid">
                  {focused.camera ? (
                    <>
                      <div className="exhibitMetaKey">Camera</div>
                      <div className="exhibitMetaVal">{focused.camera}</div>
                    </>
                  ) : null}
                  {focused.lens ? (
                    <>
                      <div className="exhibitMetaKey">Lens</div>
                      <div className="exhibitMetaVal">{focused.lens}</div>
                    </>
                  ) : null}
                  {focused.film ? (
                    <>
                      <div className="exhibitMetaKey">Film</div>
                      <div className="exhibitMetaVal">{focused.film}</div>
                    </>
                  ) : null}
                  {(focused as any).location ? (
                    <>
                      <div className="exhibitMetaKey">Location</div>
                      <div className="exhibitMetaVal">{(focused as any).location}</div>
                    </>
                  ) : null}
                  {focused.note ? (
                    <>
                      <div className="exhibitMetaKey">Note</div>
                      <div className="exhibitMetaVal exhibitMetaNote">{focused.note}</div>
                    </>
                  ) : null}
                </div>
              ) : null}
              {focusedFirstPhotoIndex >= 0 ? (
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => {
                    if (focusedFirstPhotoIndex < 0) return;
                    setOpenIndex(focusedFirstPhotoIndex);
                  }}
                >
                  Enter
                </button>
              ) : null}
            </>
          ) : (
            <div className="muted">No works.</div>
          )}
        </aside>

        <section className="exhibitWall" aria-label="Photos">
          <JustifiedGrid
            items={photos}
            gap={10}
            onItemFocus={(_, idx) => {
              const p = photos[idx];
              if (p?.workId) setFocusId(p.workId);
            }}
            onItemClick={(_, idx) => {
              const p = photos[idx];
              if (!p?.workId) return;
              if (focusId !== p.workId) return setFocusId(p.workId);
              if (!lightboxItems.length) return;
              setOpenIndex(idx);
            }}
          />
          {photos.length === 0 ? <div className="muted">No images.</div> : null}
        </section>
      </div>

      <Lightbox
        items={lightboxItems}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={(i) => setOpenIndex(i)}
        renderMetaActions={({ index }) => {
          if (!canWrite) return null;
          const workId = photos[index]?.workId ?? null;
          if (!workId) return null;
          const pinned = Boolean(workById.get(workId)?.pinned);
          return (
            <div className="lightboxActions" aria-label="Actions">
              <button
                className="btn lightboxActionBtn"
                type="button"
                disabled={adding}
                onClick={() => setPinned(workId, !pinned).catch((err) => alert(err instanceof Error ? err.message : String(err)))}
                title={pinned ? 'Unpin' : 'Pin'}
              >
                <IconPin className="lightboxActionIcon" size={16} />
                <span>{pinned ? 'Unpin' : 'Pin'}</span>
              </button>
              <button
                className="btn lightboxActionBtn"
                type="button"
                disabled={adding}
                onClick={() => {
                  setOpenIndex(null);
                  setFocusId(workId);
                  openEdit(workId);
                }}
              >
                <IconEdit className="lightboxActionIcon" size={16} />
                <span>Edit</span>
              </button>
              <button
                className="btn danger lightboxActionBtn"
                type="button"
                disabled={adding}
                onClick={() => {
                  setOpenIndex(null);
                  deleteWork(workId).catch((err) => alert(err instanceof Error ? err.message : String(err)));
                }}
              >
                <IconTrash className="lightboxActionIcon" size={16} />
                <span>Delete</span>
              </button>
            </div>
          );
        }}
      />
    </div>
  );
}


