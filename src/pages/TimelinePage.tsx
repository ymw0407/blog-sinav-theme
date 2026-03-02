import clsx from 'clsx';
import { Link, useSearchParams } from 'react-router-dom';
import { getTimelinePosts } from '../app/content/contentIndex';
import { getSiteConfig, listTimelineCategories, resolveCategory } from '../app/config/siteConfig';
import ResolvedThumb from '../shared/ui/ResolvedThumb';
import { formatDateTime } from '../shared/lib/datetime';
import { vars } from '../styles/tokens/theme.css';

export default function TimelinePage() {
  const [sp] = useSearchParams();
  const tag = sp.get('tag');
  const catKey = sp.get('cat');
  const cat = resolveCategory(catKey)?.key ?? null;

  const site = getSiteConfig();
  const ordered = listTimelineCategories().map((c) => c.key);

  const posts = getTimelinePosts({ tag, category: cat, includeDraft: false });

  const laneKeys = (() => {
    if (cat) return [cat];
    const fromPosts = Array.from(new Set(posts.map((p) => p.category)));
    const known = fromPosts.filter((k) => ordered.includes(k));
    const unknown = fromPosts.filter((k) => !ordered.includes(k));
    const inOrder = ordered.filter((k) => known.includes(k));
    return [...inOrder, ...unknown];
  })();

  const step = 14;
  const leftPad = 12;
  const laneX = new Map<string, number>();
  laneKeys.forEach((k, i) => laneX.set(k, leftPad + i * step));
  const w = Math.max(64, leftPad + (laneKeys.length - 1) * step + 12);
  const rowGap = 12;
  const yTop = 0;
  const yMid = 50;
  const yBottom = 100;

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ marginTop: 0 }}>Timeline</h1>
        <div className="row">
          {cat ? <div className="pill">cat: {resolveCategory(cat)?.label ?? cat}</div> : <div className="pill">all</div>}
          {tag ? <div className="pill">tag: {tag}</div> : null}
        </div>
      </div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <div className="filtersRow">
          <Link to="/timeline" className={clsx('pill', !cat && 'selected')}>
            All
          </Link>
          {site.categories
            .filter((c) => c.timeline !== false)
            .map((c) => (
              <Link
                key={c.key}
                to={`/timeline?cat=${encodeURIComponent(c.key)}`}
                className={clsx('pill', cat === c.key && 'selected')}
              >
                {c.label}
              </Link>
            ))}
        </div>
        <div className="muted" style={{ fontSize: 12 }}>
          Git-graph style
        </div>
      </div>
      <div
        className="timelineList"
        style={{ ['--timeline-gap' as any]: `${rowGap}px`, ['--timeline-w' as any]: `${w}px` }}
      >
        <div className="timelineGuides" aria-hidden="true">
          <svg
            className="timelineGuidesSvg"
            viewBox={`0 0 ${w} 100`}
            preserveAspectRatio="none"
            style={{ color: vars.color.border }}
          >
            {laneKeys.map((k, i) => (
              <line
                key={k}
                x1={laneX.get(k) ?? 0}
                y1={0}
                x2={laneX.get(k) ?? 0}
                y2={100}
                stroke="currentColor"
                strokeOpacity={Math.max(0.12, 0.28 - i * 0.03)}
                strokeWidth="1.1"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </div>
        {posts.map((post, idx) => {
          const curX = laneX.get(post.category) ?? leftPad;
          const nextPost = idx < posts.length - 1 ? posts[idx + 1] : null;
          const nextX = nextPost ? (laneX.get(nextPost.category) ?? curX) : curX;
          const dot = resolveCategory(post.category)?.accent ?? '#2f6feb';

          return (
            <div key={post.id} className="timelineRow" style={{ gridTemplateColumns: `${w}px 1fr` }}>
              <div className="timelineGraphCell">
                <div className="timelineGraphWrap">
                  <svg className="timelineGraph" viewBox={`0 0 ${w} 100`} preserveAspectRatio="none" style={{ color: vars.color.border }}>
                    {/* incoming */}
                    <line
                      x1={curX}
                      y1={yTop}
                      x2={curX}
                      y2={yMid}
                      stroke="currentColor"
                      strokeOpacity={idx === 0 ? 0.3 : 0.58}
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />

                    {/* outgoing */}
                    {idx < posts.length - 1 ? (
                      nextX === curX ? (
                        <line
                          x1={curX}
                          y1={yMid}
                          x2={curX}
                          y2={yBottom}
                          stroke="currentColor"
                          strokeOpacity="0.58"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      ) : (
                        <path
                          d={`M ${curX} ${yMid} C ${curX} ${yMid + (yBottom - yMid) * 0.62}, ${nextX} ${yMid + (yBottom - yMid) * 0.38}, ${nextX} ${yBottom}`}
                          fill="none"
                          stroke="currentColor"
                          strokeOpacity="0.58"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      )
                    ) : (
                      <line
                        x1={curX}
                        y1={yMid}
                        x2={curX}
                        y2={yBottom}
                        stroke="currentColor"
                        strokeOpacity={0.22}
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                  </svg>
                  <div className="timelineDotOuter" style={{ left: curX }} />
                  <div className="timelineDotInner" style={{ left: curX, background: dot }} />
                </div>
              </div>

              <div className="card timelineCard">
                <div className="postListRow">
                  <div className="postListBody">
                    <div className="postListHead">
                      <div>
                        <Link to={`/post/${encodeURIComponent(post.category)}/${encodeURIComponent(post.slug)}`}>
                          {post.title}
                        </Link>
                        <div className="muted" style={{ marginTop: 6 }}>
                          {formatDateTime((post as any).datetime ?? (post as any).date)} · {resolveCategory(post.category)?.label ?? post.category}
                        </div>
                      </div>
                      <div className="postListMetaRight">
                        {post.tags.slice(0, 4).map((t) => (
                          <Link
                            key={t}
                            to={
                              (() => {
                                const next = new URLSearchParams({
                                  ...(cat ? { cat } : {}),
                                  ...(tag === t ? {} : { tag: t })
                                }).toString();
                                return next ? `/timeline?${next}` : '/timeline';
                              })()
                            }
                            className={clsx('pill', 'tagChip', tag === t && 'selected')}
                          >
                            #{t}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <p className="muted" style={{ marginBottom: 0 }}>
                      {post.summary}
                    </p>
                  </div>
                  {post.thumbnail?.src ? (
                    <div className="postThumb" aria-hidden="true">
                      <ResolvedThumb src={post.thumbnail.src} alt={post.thumbnail.alt ?? post.title} loading="lazy" />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
        {posts.length === 0 ? <div className="muted">No timeline items.</div> : null}
      </div>
    </div>
  );
}

