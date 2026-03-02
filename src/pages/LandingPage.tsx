import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAlbumsMerged, getAllPostsMerged, getGalleryIndex, getPortfolioIndex } from '../app/content/contentIndex';
import { getSiteConfig, listLandingCategories } from '../app/config/siteConfig';
import { clearSiteIdentity, getSiteIdentity, setSiteIdentity, subscribeSiteIdentity, type SiteIdentity } from '../app/local/siteIdentityStore';
import { useAuth } from '../app/auth/AuthContext';
import { getEnv } from '../app/env';
import { isGitHubWriteEnabled, isLocalMode } from '../app/mode';
import { seedDemoContent } from '../app/local/demo/seedDemoContent';
import { applyCategoryAccent } from '../app/theme/accent';
import Carousel from '../shared/ui/Carousel';
import ResolvedImage from '../shared/ui/ResolvedImage';
import ResolvedThumb from '../shared/ui/ResolvedThumb';
import { formatDateTime } from '../shared/lib/datetime';
import JustifiedGrid, { type JustifiedItem } from '../shared/ui/JustifiedGrid';
import { saveLocalImage } from '../app/local/mediaStore';
import { IconX } from '../shared/ui/icons';

function isImageUrl(url: string) {
  if (url.startsWith('local-media:')) return true;
  if (url.startsWith('data:image/')) return true;
  return /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(url);
}

async function fileToBase64(file: File) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

export default function LandingPage() {
  const site = getSiteConfig();
  const posts = getAllPostsMerged();
  const albums = getAlbumsMerged();
  const works = getGalleryIndex().works;
  const portfolio = getPortfolioIndex().portfolio;
  const env = getEnv();
  const local = isLocalMode();
  const ghEnabled = isGitHubWriteEnabled();
  const { state, isAllowedUser, getOctokit, login } = useAuth();
  const nav = useNavigate();
  const featuredPosts = posts.slice(0, 4);
  const featuredAlbums = albums.slice(0, 6);
  // Keep Featured gallery preview bounded (similar footprint to the 4-post Featured grid).
  const featuredWorks = works.slice(0, 16);
  const featuredWorkItems: JustifiedItem[] = React.useMemo(() => {
    return featuredWorks
      .map((w) => {
        const first = (w.assets ?? []).find((a) => a?.url && isImageUrl(a.url)) ?? null;
        if (!first) return null;
        return {
          key: w.id,
          src: first.url,
          alt: first.alt || w.title,
          caption: w.title,
          pinned: Boolean(w.pinned)
        } satisfies JustifiedItem;
      })
      .filter(Boolean) as JustifiedItem[];
  }, [featuredWorks]);

  const goCategory = React.useCallback(
    (category: string) => {
      document.documentElement.dataset.category = category;
      applyCategoryAccent(category);
      nav(`/category/${category}`);
    },
    [nav]
  );

  const categories = listLandingCategories();

  const [siteIdentity, setSiteIdentityState] = React.useState<SiteIdentity | null>(() => getSiteIdentity());
  const [editingHero, setEditingHero] = React.useState(false);
  const [heroDraft, setHeroDraft] = React.useState<SiteIdentity>(() => getSiteIdentity() ?? {});
  const [heroBusy, setHeroBusy] = React.useState(false);
  const [heroUrl, setHeroUrl] = React.useState('');
  const [heroDrag, setHeroDrag] = React.useState(false);
  const heroDragDepthRef = React.useRef(0);
  const heroFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [heroUploadPreviews, setHeroUploadPreviews] = React.useState<{ id: string; url: string; name: string }[]>([]);
  const siteSocial = site.social ?? [];

  React.useEffect(() => {
    return subscribeSiteIdentity(() => setSiteIdentityState(getSiteIdentity()));
  }, []);

  const canEditHero = local || (ghEnabled && Boolean(state.accessToken) && isAllowedUser);

  const siteName = siteIdentity?.siteName?.trim() || site.site.name;
  const heroTitle = siteIdentity?.heroTitle?.trim() || site.site.heroTitle;
  const heroSubtitle = siteIdentity?.heroSubtitle?.trim() || site.site.heroSubtitle;
  const heroKicker = siteIdentity?.kicker?.trim() || site.site.kicker;
  const heroMedia = siteIdentity?.heroMedia ?? (siteIdentity?.heroImage?.src ? [siteIdentity.heroImage] : []);
  const heroSocial = siteIdentity?.social ?? null;

  const visibleHeroMedia = editingHero ? (heroDraft.heroMedia ?? heroMedia) : heroMedia;

  const draftMedia = React.useMemo(() => {
    const arr = (heroDraft.heroMedia ?? visibleHeroMedia ?? []) as any[];
    return Array.isArray(arr) ? (arr.filter((m) => m && typeof m === 'object' && typeof m.src === 'string' && m.src.trim()) as { src: string; alt?: string }[]) : [];
  }, [heroDraft.heroMedia, visibleHeroMedia]);

  const uploadHeroFile = React.useCallback(
    async (file: File) => {
      if (local) {
        const src = await saveLocalImage(file);
        return { src, alt: file.name };
      }
      if (!ghEnabled || !state.accessToken || !isAllowedUser) throw new Error('Not authenticated.');
      const owner = env.VITE_CONTENT_REPO_OWNER;
      const repo = env.VITE_CONTENT_REPO_NAME;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const ext = safeName.includes('.') ? '' : '.png';
      const fileName = `${Date.now()}-${safeName}${ext}`;
      const assetPath = `assets/site/hero/${fileName}`;
      await getOctokit().repos.createOrUpdateFileContents({
        owner,
        repo,
        path: assetPath,
        message: `chore(asset): add ${assetPath}\n\nGenerated-By: blog-web\nSource-User: ${state.username ?? 'unknown'}`,
        content: await fileToBase64(file)
      });
      return { src: `media/${assetPath}`, alt: file.name };
    },
    [env.VITE_CONTENT_REPO_NAME, env.VITE_CONTENT_REPO_OWNER, getOctokit, ghEnabled, isAllowedUser, local, state.accessToken, state.username]
  );

  const addHeroFiles = React.useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      if (!canEditHero) return;
      setHeroBusy(true);
      try {
        for (const file of files) {
          const id = `${Date.now().toString(36)}:${Math.random().toString(16).slice(2)}`;
          const url = URL.createObjectURL(file);
          setHeroUploadPreviews((prev) => [...prev, { id, url, name: file.name }]);
          try {
            const out = await uploadHeroFile(file);
            setHeroDraft((p) => ({ ...p, heroMedia: [...(p.heroMedia ?? draftMedia), out] }));
          } finally {
            setHeroUploadPreviews((prev) => prev.filter((x) => x.id !== id));
            URL.revokeObjectURL(url);
          }
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : String(err));
      } finally {
        setHeroBusy(false);
      }
    },
    [canEditHero, draftMedia, uploadHeroFile]
  );

  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-scroll-amt', '1.55');
    root.style.setProperty('--bg-mouse-amt', '1.15');
    return () => {
      root.style.removeProperty('--bg-scroll-amt');
      root.style.removeProperty('--bg-mouse-amt');
    };
  }, []);

  return (
    <div className="grid">
      <div className="col-12 heroCard">
        <div className="heroTop">
          <div className="heroKicker">{heroKicker ?? 'GitHub Pages · PKCE · 2-Repo'}</div>
          <div className="heroActions" aria-label="Landing actions">
            {canEditHero ? (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const cur = getSiteIdentity() ?? {};
                  setHeroDraft({ ...cur, heroMedia: cur.heroMedia ?? (cur.heroImage?.src ? [cur.heroImage] : []) });
                  setEditingHero((x) => !x);
                }}
                title="Edit landing hero"
              >
                Edit
              </button>
            ) : null}
          </div>
        </div>

        <h1 className="heroTitle">{heroTitle}</h1>
        <p className="heroSubtitle">{heroSubtitle}</p>

        {visibleHeroMedia.length ? (
          <div className="heroMedia" aria-label="Hero media">
            {visibleHeroMedia.length > 1 ? (
              <Carousel
                variant="minimal"
                ariaLabel="Hero images"
                autoPlayMs={4800}
                slides={visibleHeroMedia.map((m, i) => (
                  <div key={`${m.src}:${i}`} className="heroMediaSlide">
                    <ResolvedImage
                      src={m.src}
                      alt={m.alt ?? ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      loading="lazy"
                    />
                  </div>
                ))}
              />
            ) : (
              <ResolvedImage
                src={visibleHeroMedia[0]!.src}
                alt={visibleHeroMedia[0]!.alt ?? ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                loading="lazy"
              />
            )}
          </div>
        ) : null}

        {editingHero ? (
          <div className="card heroEditor" style={{ marginTop: 16 }}>
            {!local && ghEnabled && !state.accessToken ? (
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div className="muted">Login is required to edit in GitHub mode.</div>
                <button className="btn primary" type="button" onClick={() => login('/')}>
                  Login
                </button>
              </div>
            ) : null}

            <div className="grid" style={{ marginTop: 10 }}>
              <div className="col-12">
                <label className="muted">Navbar Title</label>
                <input
                  className="input"
                  value={heroDraft.siteName ?? siteName}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, siteName: e.target.value }))}
                  disabled={!canEditHero || heroBusy}
                />
              </div>
              <div className="col-12">
                <label className="muted">Title</label>
                <input
                  className="input"
                  value={heroDraft.heroTitle ?? heroTitle}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, heroTitle: e.target.value }))}
                  disabled={!canEditHero || heroBusy}
                />
              </div>
              <div className="col-12">
                <label className="muted">Subtitle</label>
                <textarea
                  className="input"
                  rows={2}
                  value={heroDraft.heroSubtitle ?? heroSubtitle}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, heroSubtitle: e.target.value }))}
                  disabled={!canEditHero || heroBusy}
                />
              </div>
              <div className="col-12">
                <label className="muted">Kicker</label>
                <input
                  className="input"
                  value={heroDraft.kicker ?? heroKicker ?? ''}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, kicker: e.target.value }))}
                  disabled={!canEditHero || heroBusy}
                />
              </div>

              <div className="col-12">
                <label className="muted">Images (optional)</label>

                <div
                  className={`heroDropZone${heroDrag ? ' dragging' : ''}${!canEditHero || heroBusy ? ' disabled' : ''}`}
                  role="button"
                  tabIndex={!canEditHero || heroBusy ? -1 : 0}
                  aria-label="Hero images"
                  onClick={() => {
                    if (!canEditHero || heroBusy) return;
                    heroFileInputRef.current?.click();
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    if (!canEditHero || heroBusy) return;
                    e.preventDefault();
                    heroFileInputRef.current?.click();
                  }}
                  onDragEnter={(e) => {
                    if (!canEditHero || heroBusy) return;
                    const types = Array.from(e.dataTransfer?.types ?? []);
                    if (!types.includes('Files')) return;
                    heroDragDepthRef.current += 1;
                    setHeroDrag(true);
                  }}
                  onDragOver={(e) => {
                    if (!canEditHero || heroBusy) return;
                    const types = Array.from(e.dataTransfer?.types ?? []);
                    if (!types.includes('Files')) return;
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDragLeave={(e) => {
                    if (!canEditHero || heroBusy) return;
                    const types = Array.from(e.dataTransfer?.types ?? []);
                    if (!types.includes('Files')) return;
                    heroDragDepthRef.current = Math.max(0, heroDragDepthRef.current - 1);
                    if (heroDragDepthRef.current === 0) setHeroDrag(false);
                  }}
                  onDrop={(e) => {
                    if (!canEditHero || heroBusy) return;
                    e.preventDefault();
                    e.stopPropagation();
                    heroDragDepthRef.current = 0;
                    setHeroDrag(false);
                    const files = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith('image/'));
                    addHeroFiles(files).catch(() => {});
                  }}
                >
                  <div className="heroDropHeader" aria-hidden="true">
                    <div style={{ minWidth: 0 }}>
                      <div className="heroDropTitle">Drop images here</div>
                      <div className="heroDropHint muted">Click to select images. (They will be cropped like the preview.)</div>
                    </div>
                    <div className="heroDropMeta muted">
                      {draftMedia.length + heroUploadPreviews.length ? `${draftMedia.length + heroUploadPreviews.length} selected` : 'No images yet'}
                    </div>
                  </div>
                  <div className="heroCropGrid" aria-label="Hero crop previews">
                    {draftMedia.map((m, idx) => (
                      <div key={`${m.src}:${idx}`} className="heroCropItem">
                        <div className="heroCropFrame">
                          <ResolvedImage src={m.src} alt={m.alt ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                        </div>
                        <button
                          type="button"
                          className="btn iconBtn heroCropRemove"
                          aria-label="Remove image"
                          disabled={!canEditHero || heroBusy}
                          onClick={(e) => {
                            e.stopPropagation();
                            setHeroDraft((p) => {
                              const base = p.heroMedia ?? draftMedia;
                              return { ...p, heroMedia: base.filter((_, i) => i !== idx) };
                            });
                          }}
                        >
                          <IconX size={14} />
                        </button>
                      </div>
                    ))}

                    {heroUploadPreviews.map((u) => (
                      <div key={u.id} className="heroCropItem">
                        <div className="heroCropFrame">
                          <img src={u.url} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                        <div className="heroCropBadge">Uploading…</div>
                      </div>
                    ))}

                    {draftMedia.length === 0 && heroUploadPreviews.length === 0 ? (
                      <div className="muted" style={{ fontSize: 12, padding: 8 }}>
                        Drop images here, or click to select files.
                      </div>
                    ) : null}
                  </div>
                </div>

                <input
                  ref={heroFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  disabled={!canEditHero || heroBusy}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
                    e.target.value = '';
                    await addHeroFiles(files);
                  }}
                />

                <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
                  <button type="button" className="btn primary" disabled={!canEditHero || heroBusy} onClick={() => heroFileInputRef.current?.click()}>
                    Select images
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={!canEditHero || heroBusy || (draftMedia.length === 0 && heroUploadPreviews.length === 0)}
                    onClick={() => setHeroDraft((p) => ({ ...p, heroMedia: [] }))}
                    title="Remove all hero images"
                  >
                    Remove all
                  </button>
                </div>

                <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
                  <input
                    className="input"
                    style={{ flex: 1, minWidth: 240 }}
                    placeholder="Add by URL (https://...)"
                    value={heroUrl}
                    onChange={(e) => setHeroUrl(e.target.value)}
                    disabled={!canEditHero || heroBusy}
                  />
                  <button
                    type="button"
                    className="btn"
                    disabled={!canEditHero || heroBusy || !heroUrl.trim()}
                    onClick={() => {
                      const url = heroUrl.trim();
                      if (!url) return;
                      setHeroDraft((p) => ({ ...p, heroMedia: [...(p.heroMedia ?? draftMedia), { src: url }] }));
                      setHeroUrl('');
                    }}
                  >
                    Add URL
                  </button>
                </div>
              </div>

              <div className="col-12">
                <label className="muted">Social Links</label>
                <div className="muted" style={{ fontSize: 12, marginTop: 6, marginBottom: 10 }}>
                  These override the navbar social buttons for this browser.
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  {(heroDraft.social ?? heroSocial ?? siteSocial).map((s, idx) => (
                    <div key={idx} className="card" style={{ padding: 12 }}>
                      <div className="grid">
                        <div className="col-4">
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Icon
                          </div>
                          <select
                            className="select"
                            value={(s.icon ?? 'website') as any}
                            onChange={(e) => {
                              const icon = e.target.value as any;
                              setHeroDraft((p) => {
                                const base = p.social ?? heroSocial ?? siteSocial;
                                const next = base.map((x, i) => (i === idx ? { ...x, icon } : x));
                                return { ...p, social: next };
                              });
                            }}
                            disabled={!canEditHero || heroBusy}
                          >
                            <option value="website">Website</option>
                            <option value="github">GitHub</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="instagram">Instagram</option>
                            <option value="email">Email</option>
                          </select>
                        </div>
                        <div className="col-4">
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Label
                          </div>
                          <input
                            className="input"
                            value={s.label}
                            onChange={(e) => {
                              const label = e.target.value;
                              setHeroDraft((p) => {
                                const base = p.social ?? heroSocial ?? siteSocial;
                                const next = base.map((x, i) => (i === idx ? { ...x, label } : x));
                                return { ...p, social: next };
                              });
                            }}
                            disabled={!canEditHero || heroBusy}
                          />
                        </div>
                        <div className="col-4">
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            URL
                          </div>
                          <input
                            className="input"
                            value={s.url}
                            onChange={(e) => {
                              const url = e.target.value;
                              setHeroDraft((p) => {
                                const base = p.social ?? heroSocial ?? siteSocial;
                                const next = base.map((x, i) => (i === idx ? { ...x, url } : x));
                                return { ...p, social: next };
                              });
                            }}
                            disabled={!canEditHero || heroBusy}
                          />
                        </div>
                      </div>

                      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
                        <button
                          type="button"
                          className="btn"
                          disabled={!canEditHero || heroBusy}
                          onClick={() => {
                            setHeroDraft((p) => {
                              const base = p.social ?? heroSocial ?? siteSocial;
                              const next = base.filter((_, i) => i !== idx);
                              return { ...p, social: next };
                            });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
                  <button
                    type="button"
                    className="btn"
                    disabled={!canEditHero || heroBusy}
                    onClick={() => setHeroDraft((p) => ({ ...p, social: null }))}
                    title="Use the default links from site.yml"
                  >
                    Use default
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={!canEditHero || heroBusy}
                    onClick={() => {
                      setHeroDraft((p) => {
                        const base = p.social ?? heroSocial ?? siteSocial;
                        return {
                          ...p,
                          social: [...base, { icon: 'website', label: 'Website', url: 'https://' }]
                        };
                      });
                    }}
                  >
                    + Add link
                  </button>
                </div>
              </div>
            </div>

            <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
              <div className="muted" style={{ fontSize: 12 }}>
                Saved to this browser (localStorage).
              </div>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn"
                  disabled={heroBusy}
                  onClick={() => {
                    clearSiteIdentity();
                    setHeroDraft({});
                    setEditingHero(false);
                  }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="btn primary"
                  disabled={!canEditHero || heroBusy}
                  onClick={() => {
                    const next: SiteIdentity = {
                      siteName: (heroDraft.siteName ?? siteName).trim() || undefined,
                      heroTitle: (heroDraft.heroTitle ?? heroTitle).trim(),
                      heroSubtitle: (heroDraft.heroSubtitle ?? heroSubtitle).trim(),
                      kicker: (heroDraft.kicker ?? heroKicker ?? '').trim() || undefined,
                      heroMedia: (heroDraft.heroMedia ?? draftMedia).filter((m) => m && typeof m.src === 'string' && m.src.trim()),
                      social: (() => {
                        const s = heroDraft.social;
                        if (s === null) return null; // explicit: use default
                        if (!Array.isArray(s)) return heroSocial ?? undefined;
                        const clean = s
                          .map((it) => ({
                            icon: it.icon,
                            label: String(it.label ?? '').trim(),
                            url: String(it.url ?? '').trim()
                          }))
                          .filter((it) => it.label && it.url);
                        return clean;
                      })(),
                      // Keep legacy field empty; we now use heroMedia for rendering.
                      heroImage: null
                    };
                    setSiteIdentity(next);
                    setEditingHero(false);
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="heroStats">
          <div className="stat">
            <div className="statValue">{posts.length}</div>
            <div className="statLabel">Posts</div>
          </div>
          <div className="stat">
            <div className="statValue">{albums.length}</div>
            <div className="statLabel">Albums</div>
          </div>
          <div className="stat">
            <div className="statValue">{works.length}</div>
            <div className="statLabel">Works</div>
          </div>
          <div className="stat">
            <div className="statValue">{portfolio.projects?.length ?? 0}</div>
            <div className="statLabel">Projects</div>
          </div>
          <div className="stat">
            <div className="statValue">{local ? 'LOCAL' : 'GH'}</div>
            <div className="statLabel">Mode</div>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="sectionHeader">
          <div>
            <h2 style={{ margin: 0 }}>Featured</h2>
            <p className="muted" style={{ margin: '8px 0 0' }}>
              최근 콘텐츠를 한 번에 훑어보기.
            </p>
          </div>
          <div className="row">
            <Link to="/timeline" className="pill">
              Open Timeline
            </Link>
          </div>
        </div>

        <Carousel
          ariaLabel="Featured carousel"
          slides={[
            <div className="featuredCard" key="posts">
              <div className="featuredTop">
                <div className="pill">Posts</div>
                <Link to="/timeline" className="pill">
                  View all
                </Link>
              </div>
              <div className="featuredGrid">
                {featuredPosts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/post/${encodeURIComponent(p.category)}/${encodeURIComponent(p.slug)}`}
                    className="featuredItem"
                    onMouseEnter={() => {
                      document.documentElement.dataset.category = p.category;
                      applyCategoryAccent(p.category);
                    }}
                    onMouseLeave={() => delete document.documentElement.dataset.category}
                  >
                    <div className="featuredPostThumb" aria-hidden="true">
                      {p.thumbnail?.src ? <ResolvedThumb src={p.thumbnail.src} alt={p.thumbnail.alt ?? p.title} loading="lazy" /> : <div />}
                    </div>
                    <div className="featuredTitle">{p.title}</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                      {formatDateTime((p as any).datetime ?? (p as any).date)} · {p.category}
                    </div>
                    <div className="muted featuredSummary">{p.summary}</div>
                    <div className="featuredTags">
                      {p.tags.slice(0, 3).map((t) => (
                        <span key={t} className="pill tagChip">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
                {featuredPosts.length === 0 ? <div className="muted">No posts yet.</div> : null}
              </div>
            </div>,
            <div className="featuredCard" key="albums">
              <div className="featuredTop">
                <div className="pill">Albums</div>
                <Link to="/albums" className="pill">
                  View all
                </Link>
              </div>
              <div className="featuredGrid2">
                {featuredAlbums.map((a) => {
                  const thumb = a.cover?.src ?? a.items?.find((it) => Boolean(it.pinned))?.src ?? a.items?.[0]?.src ?? null;
                  return (
                    <Link key={a.id} to={`/albums/${encodeURIComponent(a.id)}`} className="featuredAlbum">
                      <div className="featuredThumb">
                        {thumb ? <ResolvedImage src={thumb} alt={a.title} loading="lazy" /> : <div />}
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <div className="featuredTitle">{a.title}</div>
                        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                          {a.period?.from ? `${a.period.from}${a.period.to ? ` ~ ${a.period.to}` : ''}` : a.date || ''}
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {featuredAlbums.length === 0 ? <div className="muted">No albums yet.</div> : null}
              </div>
            </div>,
            <div className="featuredCard" key="works">
              <div className="featuredTop">
                <div className="pill">Gallery</div>
                <Link to="/gallery" className="pill">
                  View all
                </Link>
              </div>
              <div className="featuredWorksWall">
                {featuredWorkItems.length ? (
                  <JustifiedGrid items={featuredWorkItems} gap={10} variant="featured" maxRows={2} onItemClick={() => nav('/gallery')} />
                ) : (
                  <div className="muted">No works yet.</div>
                )}
              </div>
            </div>
          ]}
        />
      </div>

      <div className="col-12">
        <div className="grid">
          {categories.map((c) => (
            <button
              key={c.key}
              className="categoryCard"
              onMouseEnter={() => {
                document.documentElement.dataset.category = c.key;
                applyCategoryAccent(c.key);
              }}
              onMouseLeave={() => delete document.documentElement.dataset.category}
              onFocus={() => {
                document.documentElement.dataset.category = c.key;
                applyCategoryAccent(c.key);
              }}
              onBlur={() => delete document.documentElement.dataset.category}
              onClick={() => goCategory(c.key)}
              type="button"
            >
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h2 style={{ margin: 0 }}>{c.label}</h2>
              </div>
              <p className="muted" style={{ margin: '10px 0 0' }}>
                {c.description ?? ''}
              </p>
            </button>
          ))}
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="col-12 card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <h2 style={{ margin: 0 }}>No content yet</h2>
              <p className="muted" style={{ margin: '8px 0 0' }}>
                로컬 모드에서도 바로 작성할 수 있어요.
              </p>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              {local ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const res = seedDemoContent();
                    if (!res.ok && res.reason === 'already-has-local-content') {
                      if (!confirm('Local content already exists. Overwrite with demo content?')) return;
                      seedDemoContent({ force: true });
                    }
                    window.location.reload();
                  }}
                >
                  Load demo content
                </button>
              ) : null}
              <Link to="/editor" className="btn primary">
                Post your first
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
