import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../app/auth/AuthContext';
import { getAlbumsMerged } from '../app/content/contentIndex';
import { deleteAlbumFromRepo } from '../app/content/albumsRepo';
import { getEnv } from '../app/env';
import { deleteLocalAlbum } from '../app/local/albumsStore';
import { isGitHubWriteEnabled, isLocalMode } from '../app/mode';
import JustifiedGrid, { type JustifiedItem } from '../shared/ui/JustifiedGrid';
import Lightbox, { type LightboxItem } from '../shared/ui/Lightbox';

function getTimeKeyFromSrc(src: string) {
  const ts = src.match(/(?:^|\/)(\d{13})-/)?.[1];
  if (ts) return Number(ts);
  const iso = src.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
  if (iso) return Date.parse(iso);
  return null;
}

export default function AlbumPage() {
  const { albumId } = useParams();
  const id = albumId ? decodeURIComponent(albumId) : '';
  const nav = useNavigate();

  const local = isLocalMode();
  const ghEnabled = isGitHubWriteEnabled();
  const { state, isAllowedUser, getOctokit, login } = useAuth();
  const env = getEnv();
  const canGitHubWrite = ghEnabled && Boolean(state.accessToken) && isAllowedUser;
  const canWrite = local ? true : canGitHubWrite;

  const album = React.useMemo(() => getAlbumsMerged().find((a) => a.id === id) ?? null, [id]);

  const items = React.useMemo(() => {
    if (!album?.items?.length) return [];
    const rawItems = album.items ?? [];
    return rawItems
      .map((it, idx) => ({ it, idx, key: getTimeKeyFromSrc(it.src), pinned: Boolean(it.pinned) }))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        const ak = a.key ?? a.idx;
        const bk = b.key ?? b.idx;
        return ak - bk;
      })
      .map((x) => x.it);
  }, [album]);

  const photos = React.useMemo(() => {
    if (!album) return [];
    return items.map((it, idx) => {
      const alt = it.alt || `${album.title} ${idx + 1}`;
      const caption = it.caption || it.alt || '';
      return { key: `${album.id}:${idx}:${it.src}`, src: it.src, alt, caption } satisfies JustifiedItem;
    });
  }, [album, items]);

  const lightboxItems = React.useMemo(() => {
    return photos.map((p) => ({ src: p.src, alt: p.alt, caption: p.caption || undefined }) satisfies LightboxItem);
  }, [photos]);

  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  async function deleteAlbum() {
    if (!album) return;
    if (!window.confirm('Delete this album?')) return;
    try {
      if (local) {
        deleteLocalAlbum(album.id);
        nav('/albums');
        return;
      }
      if (!canGitHubWrite) {
        await login(`/albums/${encodeURIComponent(album.id)}`);
        return;
      }
      const octokit = getOctokit();
      await deleteAlbumFromRepo({
        owner: env.VITE_CONTENT_REPO_OWNER,
        repo: env.VITE_CONTENT_REPO_NAME,
        octokit,
        albumId: album.id,
        username: state.username ?? 'unknown'
      });
      alert('Deleted. A rebuild will deploy soon.');
      nav('/albums');
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  if (!album) return <div className="card">Album not found.</div>;

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0 }}>{album.title}</h1>
          <div className="muted">
            {album.period?.from ? (
              <>
                {album.period.from}
                {album.period.to ? ` ~ ${album.period.to}` : ''}
              </>
            ) : album.date ? (
              album.date
            ) : null}
          </div>
        </div>

        <div className="row" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link to="/albums" className="pill">
            Back
          </Link>
          {canWrite ? (
            <Link to={`/albums/${encodeURIComponent(album.id)}/edit`} className="pill">
              Edit album
            </Link>
          ) : null}
          {canWrite ? (
            <button type="button" className="pill" onClick={() => deleteAlbum()}>
              Delete album
            </button>
          ) : null}
        </div>
      </div>

      {album.description ? (
        <p className="muted" style={{ marginTop: 6 }}>
          {album.description}
        </p>
      ) : null}

      <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
        Photos are managed in "Edit album".
      </div>

      {photos.length ? (
        <div style={{ marginTop: 14 }}>
          <JustifiedGrid items={photos} onItemClick={(_, idx) => setOpenIndex(idx)} />
        </div>
      ) : (
        <div className="muted" style={{ marginTop: 12 }}>
          No photos yet.
        </div>
      )}

      <Lightbox items={lightboxItems} index={openIndex} onClose={() => setOpenIndex(null)} onIndexChange={setOpenIndex} />
    </div>
  );
}
