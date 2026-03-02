import { Link } from 'react-router-dom';
import { getAlbumsMerged } from '../app/content/contentIndex';
import ResolvedImage from '../shared/ui/ResolvedImage';

export default function AlbumsPage() {
  const albums = getAlbumsMerged();
  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>Albums</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Collections of photos. Open an album to view, and manage its photos.
      </p>

      <div style={{ display: 'grid', gap: 10 }}>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <Link to="/albums/new" className="pill">
            + New Album
          </Link>
        </div>

        {albums.map((al) => {
          const thumb = al.cover?.src ?? al.items?.find((it) => Boolean(it.pinned))?.src ?? al.items?.[0]?.src ?? null;
          return (
            <Link key={al.id} to={`/albums/${encodeURIComponent(al.id)}`} className="albumListItem">
              <div className="albumListThumb" aria-hidden="true">
                {thumb ? <ResolvedImage src={thumb} alt={al.title} loading="lazy" /> : <div />}
              </div>
              <div className="albumListBody">
                <div className="albumListTitleRow">
                  <div className="albumListTitle">{al.title}</div>
                  <div className="row" style={{ gap: 6 }}>
                    {al.period?.from ? (
                      <div className="pill">
                        {al.period.from}
                        {al.period.to ? ` ~ ${al.period.to}` : ''}
                      </div>
                    ) : null}
                    {al.date ? <div className="pill">{al.date}</div> : null}
                  </div>
                </div>
                {al.description ? <div className="muted albumListDesc">{al.description}</div> : <div className="muted albumListDesc"> </div>}
              </div>
            </Link>
          );
        })}

        {albums.length === 0 ? <div className="muted">No albums.</div> : null}
      </div>
    </div>
  );
}
