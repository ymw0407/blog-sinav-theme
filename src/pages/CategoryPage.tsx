import clsx from 'clsx';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getPostsByCategory } from '../app/content/contentindex';
import { resolveCategory } from '../app/config/siteConfig';
import ResolvedThumb from '../shared/ui/ResolvedThumb';
import { formatDateTime } from '../shared/lib/datetime';

export default function CategoryPage() {
  const { category } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const tag = sp.get('tag');
  const meta = resolveCategory(category);
  if (!meta) return <div className="card">Unknown category.</div>;

  const posts = getPostsByCategory(meta.key).filter((p) => (tag ? p.tags.includes(tag) : true));

  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>
        {meta.label} {tag ? <span className="muted">/ tag: {tag}</span> : null}
      </h1>
      {meta.description ? <p className="muted" style={{ marginTop: 0 }}>{meta.description}</p> : null}
      <div style={{ display: 'grid', gap: 10 }}>
        {posts.map((p) => (
          <div
            key={p.id}
            className="card"
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
            onClick={() => nav(`/post/${encodeURIComponent(p.category)}/${encodeURIComponent(p.slug)}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                nav(`/post/${encodeURIComponent(p.category)}/${encodeURIComponent(p.slug)}`);
              }
            }}
          >
            <div className="postListRow">
              <div className="postListBody">
                <div className="postListHead">
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.title}</div>
                    <div className="muted" style={{ marginTop: 6 }}>
                      {formatDateTime((p as any).datetime ?? (p as any).date)}
                    </div>
                  </div>
                  <div className="postListMetaRight">
                    <div className="pill">{meta.label}</div>
                    {p.tags.slice(0, 4).map((t) => (
                      <Link
                        key={t}
                        to={
                          tag === t
                            ? `/category/${encodeURIComponent(meta.key)}`
                            : `/category/${encodeURIComponent(meta.key)}?${new URLSearchParams({ tag: t }).toString()}`
                        }
                        className={clsx('pill', 'tagChip', tag === t && 'selected')}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        #{t}
                      </Link>
                    ))}
                  </div>
                </div>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {p.summary}
                </p>
              </div>
              {p.thumbnail?.src ? (
                <div className="postThumb" aria-hidden="true">
                  <ResolvedThumb src={p.thumbnail.src} alt={p.thumbnail.alt ?? p.title} loading="lazy" />
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {posts.length === 0 ? <div className="muted">No posts.</div> : null}
      </div>
    </div>
  );
}

