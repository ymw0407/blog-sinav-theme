import React from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useMatch } from 'react-router-dom';
import { useAuth } from '../../app/auth/AuthContext';
import { listNavCategories, resolveCategory, getSiteConfig } from '../../app/config/siteConfig';
import { getEnv } from '../../app/env';
import { getSiteIdentity, subscribeSiteIdentity } from '../../app/local/siteIdentityStore';
import { isLocalMode, setLocalModeOverride } from '../../app/mode';
import { applyCategoryAccent } from '../../app/theme/accent';
import { applyResolvedTheme, readThemeMode, resolveTheme } from '../../app/theme/theme';
import AppBackground from './AppBackground';
import SocialLinks from './SocialLinks';
import ThemeToggle from './ThemeToggle';
import { IconChevronDown, IconMenu } from './icons';

type CategoryKey = string | 'default';

function normalizeCategory(raw?: string | null): CategoryKey {
  if (!raw) return 'default';
  return resolveCategory(raw) ? raw : 'default';
}

function useCategoryFromRoute(): CategoryKey {
  const matchCategory = useMatch('/category/:category');
  const matchPost = useMatch('/post/:category/:slug');
  const matchTimeline = useMatch('/timeline');
  const loc = useLocation();

  if (matchPost?.params?.category) return normalizeCategory(matchPost.params.category);
  if (matchCategory?.params?.category) return normalizeCategory(matchCategory.params.category);
  if (matchTimeline) {
    const cat = new URLSearchParams(loc.search).get('cat');
    return normalizeCategory(cat);
  }
  return 'default';
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const env = getEnv();
  const { state, login, logout } = useAuth();
  const loc = useLocation();
  const isExhibit = loc.pathname.startsWith('/gallery');
  const category = useCategoryFromRoute();
  const local = isLocalMode();
  const isDev = import.meta.env.DEV;
  const site = getSiteConfig();
  const [siteIdentity, setSiteIdentityState] = React.useState(() => getSiteIdentity());
  const siteName = siteIdentity?.siteName?.trim() || site.site.name;
  const categories = listNavCategories();
  const currentCategory = category === 'default' ? null : resolveCategory(category);
  const [catsOpen, setCatsOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [navOverflow, setNavOverflow] = React.useState(false);
  const headerCatsRef = React.useRef<HTMLElement | null>(null);
  const catsWrapRef = React.useRef<HTMLDivElement | null>(null);
  const catsBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const catsMenuRef = React.useRef<HTMLDivElement | null>(null);
  const [catsPos, setCatsPos] = React.useState<
    | {
        left: number;
        top: number;
        width: number;
        originX: number;
        placement: 'top' | 'bottom';
        maxHeight: number;
      }
    | null
  >(null);

  const computeCatsPos = React.useCallback(
    (rect: DOMRect, menuHeight: number | null) => {
      const viewportW = Math.max(1, window.innerWidth);
      const viewportH = Math.max(1, window.innerHeight);

      const width = Math.min(viewportW - 16, 360, Math.max(220, Math.max(rect.width, 260)));
      const minLeft = 8;
      const maxLeft = Math.max(minLeft, viewportW - width - 8);
      let left = rect.left; // desktop-friendly: align to trigger's left edge
      if (left > maxLeft) left = rect.right - width; // near right edge, align to right
      left = Math.max(minLeft, Math.min(maxLeft, left));

      const gap = 10;
      const belowTop = rect.bottom + gap;
      const spaceBelow = viewportH - belowTop - 8;
      const spaceAbove = rect.top - gap - 8;

      let placement: 'top' | 'bottom' = 'bottom';
      if (spaceBelow < 220 && spaceAbove > spaceBelow) placement = 'top';
      if (menuHeight != null && menuHeight > 0 && menuHeight > spaceBelow && spaceAbove > spaceBelow) placement = 'top';

      const maxHeight = Math.max(160, placement === 'bottom' ? spaceBelow : spaceAbove);
      const heightForTop = menuHeight != null && menuHeight > 0 ? Math.min(menuHeight, maxHeight) : maxHeight;
      const top = placement === 'bottom' ? Math.max(8, belowTop) : Math.max(8, rect.top - gap - heightForTop);

      const originX = Math.max(0, Math.min(1, (rect.left + rect.width / 2 - left) / Math.max(1, width)));
      return { left, top, width, originX, placement, maxHeight };
    },
    []
  );

  const openCats = React.useCallback(
    (btn: HTMLButtonElement | null) => {
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      setCatsPos(computeCatsPos(rect, null));
      setCatsOpen(true);
    },
    [computeCatsPos]
  );

  React.useLayoutEffect(() => {
    // Theme must be applied even on routes that hide the header (ex: /gallery),
    // otherwise the whole page can look "stuck" in the default styles.
    applyResolvedTheme(resolveTheme(readThemeMode()));
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

    root.style.setProperty('--bg-mx', '0.5');
    root.style.setProperty('--bg-my', '0.5');

    if (reduceMotion) {
      root.style.removeProperty('--bg-scroll');
      return () => {
        root.style.removeProperty('--bg-scroll');
        root.style.removeProperty('--bg-mx');
        root.style.removeProperty('--bg-my');
      };
    }

    let mx = 0.5;
    let my = 0.5;
    let raf = 0;

    const update = () => {
      raf = 0;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const dist = Math.max(1, Math.min(1400, maxScroll || 1));
      const raw = Math.max(0, Math.min(1, window.scrollY / dist));
      const eased = raw * raw * (3 - 2 * raw); // smoothstep
      root.style.setProperty('--bg-scroll', eased.toFixed(4));
      root.style.setProperty('--bg-mx', mx.toFixed(4));
      root.style.setProperty('--bg-my', my.toFixed(4));
    };

    const requestUpdate = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    const onScroll = () => requestUpdate();
    const onResize = () => requestUpdate();

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      mx = Math.max(0, Math.min(1, e.clientX / w));
      my = Math.max(0, Math.min(1, e.clientY / h));
      requestUpdate();
    };

    const onPointerLeave = () => {
      mx = 0.5;
      my = 0.5;
      requestUpdate();
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      if (raf) window.cancelAnimationFrame(raf);
      root.style.removeProperty('--bg-scroll');
      root.style.removeProperty('--bg-mx');
      root.style.removeProperty('--bg-my');
    };
  }, []);

  React.useEffect(() => {
    // `vh` (and even `dvh`) can diverge from the *visual* viewport on zoom / mobile browser UI.
    // Expose the visual viewport height to CSS so overlays (lightbox) can size safely.
    const root = document.documentElement;
    let raf = 0;
    const vv = window.visualViewport ?? null;

    const update = () => {
      raf = 0;
      const h = Math.max(1, (vv?.height ?? window.innerHeight) || 1);
      root.style.setProperty('--vvh', `${h}px`);
    };

    const requestUpdate = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('resize', requestUpdate);
    vv?.addEventListener('resize', requestUpdate);
    vv?.addEventListener('scroll', requestUpdate);
    return () => {
      window.removeEventListener('resize', requestUpdate);
      vv?.removeEventListener('resize', requestUpdate);
      vv?.removeEventListener('scroll', requestUpdate);
      if (raf) window.cancelAnimationFrame(raf);
      root.style.removeProperty('--vvh');
    };
  }, []);

  React.useEffect(() => {
    const hasFiles = (dt: DataTransfer | null) => {
      if (!dt) return false;
      if (dt.files && dt.files.length) return true;
      return Array.from(dt.types ?? []).includes('Files');
    };

    const onDragOver = (e: DragEvent) => {
      if (!hasFiles(e.dataTransfer)) return;
      e.preventDefault();
    };

    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e.dataTransfer)) return;
      e.preventDefault();
    };

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  React.useEffect(() => {
    if (category === 'default') delete document.documentElement.dataset.category;
    else document.documentElement.dataset.category = category;
    applyCategoryAccent(category === 'default' ? null : category);
  }, [category]);

  React.useEffect(() => {
    // Keep a stable page "mode" attribute for CSS (ex: hide scrollbars on landing).
    // Always set a value so we don't get stuck in an old page mode after navigation.
    if (isExhibit) document.documentElement.dataset.page = 'gallery';
    else if (loc.pathname === '/') document.documentElement.dataset.page = 'landing';
    else document.documentElement.dataset.page = 'app';
  }, [isExhibit, loc.pathname]);

  React.useLayoutEffect(() => {
    if (isExhibit) {
      delete document.documentElement.dataset.navOverflow;
      setNavOverflow(false);
      return;
    }

    const el = headerCatsRef.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const next = el.scrollWidth > el.clientWidth + 4;
      setNavOverflow(next);
      if (next) document.documentElement.dataset.navOverflow = '1';
      else delete document.documentElement.dataset.navOverflow;
    };
    const requestUpdate = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    requestUpdate();
    window.addEventListener('resize', requestUpdate);
    const ro = 'ResizeObserver' in window ? new ResizeObserver(requestUpdate) : null;
    ro?.observe(el);
    return () => {
      window.removeEventListener('resize', requestUpdate);
      if (raf) window.cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [isExhibit, siteName, categories.length, currentCategory?.key, state.accessToken]);

  React.useEffect(() => {
    return subscribeSiteIdentity(() => setSiteIdentityState(getSiteIdentity()));
  }, []);

  React.useEffect(() => {
    const heroTitle = siteIdentity?.heroTitle?.trim() || site.site.heroTitle;
    const name = siteIdentity?.siteName?.trim() || site.site.name;
    document.title = heroTitle || name;
  }, [siteIdentity?.heroTitle, siteIdentity?.siteName, site.site.heroTitle, site.site.name]);

  React.useEffect(() => {
    setCatsOpen(false);
    setMobileOpen(false);
  }, [loc.pathname, loc.search]);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  React.useEffect(() => {
    if (mobileOpen) document.documentElement.dataset.sheet = 'open';
    else delete document.documentElement.dataset.sheet;
    return () => {
      delete document.documentElement.dataset.sheet;
    };
  }, [mobileOpen]);

  React.useEffect(() => {
    if (!catsOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target instanceof Node ? e.target : null;
      if (!t) return setCatsOpen(false);
      if (catsWrapRef.current?.contains(t)) return;
      if (catsMenuRef.current?.contains(t)) return;
      setCatsOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [catsOpen]);

  React.useEffect(() => {
    if (!catsOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setCatsOpen(false);
      catsBtnRef.current?.focus();
    };

    const onFocusIn = (e: FocusEvent) => {
      const t = e.target instanceof Node ? e.target : null;
      if (!t) return setCatsOpen(false);
      if (catsWrapRef.current?.contains(t)) return;
      if (catsMenuRef.current?.contains(t)) return;
      setCatsOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('focusin', onFocusIn);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('focusin', onFocusIn);
    };
  }, [catsOpen]);

  React.useEffect(() => {
    if (catsOpen) return;
    applyCategoryAccent(category === 'default' ? null : category);
  }, [catsOpen, category]);

  React.useLayoutEffect(() => {
    if (!catsOpen) return;

    const update = () => {
      const btn = catsBtnRef.current;
      if (!btn) return;
      const menu = catsMenuRef.current;
      const rect = btn.getBoundingClientRect();
      let placement: 'top' | 'bottom' = 'bottom';
      const menuH = menu?.getBoundingClientRect().height ?? null;
      setCatsPos(computeCatsPos(rect, menuH));
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    headerCatsRef.current?.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      headerCatsRef.current?.removeEventListener('scroll', update);
      setCatsPos(null);
    };
  }, [catsOpen]);

  function MenuIcon() {
    return <IconMenu size={18} />;
  }

  function ChevronDown() {
    return <IconChevronDown size={16} />;
  }

  return (
    <>
      <AppBackground />
      <div className="container">
        {!isExhibit ? (
          <header className="header">
            <div className="headerRow">
              <div className="headerLeft">
                <button
                  type="button"
                  className="btn iconBtn headerMenuBtn"
                  aria-label="Open menu"
                  onClick={() => setMobileOpen(true)}
                  title={navOverflow ? 'Open menu (more)' : 'Open menu'}
                >
                  <MenuIcon />
                </button>
                <Link to="/" className="brand" aria-label="Home">
                  {siteName}
                </Link>
                <div className="pill muted repoPill">{env.VITE_CONTENT_REPO_OWNER + '/' + env.VITE_CONTENT_REPO_NAME}</div>
              </div>

              <nav
                className="headerCats"
                aria-label="Primary Navigation"
                ref={headerCatsRef}
                onWheel={(e) => {
                  // On desktop Windows, horizontal scrolling is not discoverable.
                  // Translate vertical wheel to horizontal scroll when needed.
                  const el = headerCatsRef.current;
                  if (!el) return;
                  if (!navOverflow) return;
                  if (Math.abs(e.deltaY) < 1) return;
                  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
                  el.scrollLeft += e.deltaY;
                  e.preventDefault();
                }}
              >
              <NavLink to="/timeline" className={({ isActive }) => `catLink ${isActive ? 'catLinkActive' : ''}`}>
                Timeline
              </NavLink>

              <div id="cats-menu" className="menuWrap" ref={catsWrapRef}>
                <button
                  type="button"
                  className={currentCategory ? 'catLink catLinkActive' : 'catLink'}
                  aria-haspopup="menu"
                  aria-expanded={catsOpen}
                  aria-controls={catsOpen ? 'cats-popover' : undefined}
                  onClick={(e) => {
                    if (catsOpen) return setCatsOpen(false);
                    openCats(e.currentTarget);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== 'ArrowDown') return;
                    e.preventDefault();
                    if (!catsOpen) openCats(e.currentTarget);
                    window.requestAnimationFrame(() => {
                      const first = catsMenuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
                      first?.focus();
                    });
                  }}
                  onMouseEnter={() => applyCategoryAccent(currentCategory?.key ?? null)}
                  onMouseLeave={() => applyCategoryAccent(category === 'default' ? null : category)}
                  ref={catsBtnRef}
                >
                  <span>{currentCategory?.label ?? 'Categories'}</span>
                  <ChevronDown />
                </button>
              </div>

              <NavLink to="/albums" className={({ isActive }) => `catLink ${isActive ? 'catLinkActive' : ''}`}>
                Albums
              </NavLink>
              <NavLink to="/gallery" className={({ isActive }) => `catLink ${isActive ? 'catLinkActive' : ''}`}>
                Gallery
              </NavLink>
              <NavLink to="/resume" className={({ isActive }) => `catLink ${isActive ? 'catLinkActive' : ''}`}>
                Resume
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => `catLink ${isActive ? 'catLinkActive' : ''}`}>
                Profile
              </NavLink>
              <NavLink to="/editor" className={({ isActive }) => `catLink ${isActive ? 'catLinkActive' : ''}`}>
                Post
              </NavLink>
            </nav>

            {catsOpen && catsPos && typeof document !== 'undefined'
              ? createPortal(
                  <div
                    className="menuPopover"
                    id="cats-popover"
                    role="menu"
                    aria-label="Categories"
                    aria-orientation="vertical"
                    ref={catsMenuRef}
                    tabIndex={-1}
                    onKeyDown={(e) => {
                      const items = Array.from(catsMenuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
                      if (items.length === 0) return;
                      const active = document.activeElement as HTMLElement | null;
                      const idx = active ? items.indexOf(active) : -1;

                      const focusAt = (nextIndex: number) => {
                        const clamped = Math.max(0, Math.min(items.length - 1, nextIndex));
                        items[clamped]?.focus();
                      };

                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        focusAt(idx < 0 ? 0 : idx + 1);
                        return;
                      }
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        focusAt(idx < 0 ? items.length - 1 : idx - 1);
                        return;
                      }
                      if (e.key === 'Home') {
                        e.preventDefault();
                        focusAt(0);
                        return;
                      }
                      if (e.key === 'End') {
                        e.preventDefault();
                        focusAt(items.length - 1);
                        return;
                      }
                    }}
                    style={{
                      position: 'fixed',
                      left: catsPos.left,
                      top: catsPos.top,
                      width: catsPos.width,
                      maxHeight: catsPos.maxHeight,
                      transformOrigin: `${Math.round(catsPos.originX * 100)}% ${catsPos.placement === 'top' ? '100%' : '0%'}`
                    }}
                  >
                    {categories.map((c) => (
                      <Link
                        key={c.key}
                        to={`/category/${encodeURIComponent(c.key)}`}
                        className="menuItem"
                        role="menuitem"
                        onMouseEnter={() => applyCategoryAccent(c.key)}
                        onMouseLeave={() => applyCategoryAccent(category === 'default' ? null : category)}
                        onFocus={() => applyCategoryAccent(c.key)}
                        onBlur={() => applyCategoryAccent(category === 'default' ? null : category)}
                        onClick={() => setCatsOpen(false)}
                      >
                        <div className="menuItemTitle">{c.label}</div>
                        {c.description ? <div className="menuItemDesc">{c.description}</div> : null}
                      </Link>
                    ))}
                  </div>,
                  document.body
                )
              : null}

              <div className="headerRight">
              <SocialLinks className="headerSocial" />
              <ThemeToggle />
              {local ? (
                <>
                  <div className="pill">local</div>
                  {isDev ? (
                    <button
                      className="pill"
                      type="button"
                      onClick={() => {
                        setLocalModeOverride(false);
                        window.location.reload();
                      }}
                    >
                      Use GitHub
                    </button>
                  ) : null}
                </>
              ) : !state.accessToken ? (
                <>
                  {isDev ? (
                    <button
                      className="pill"
                      type="button"
                      onClick={() => {
                        setLocalModeOverride(true);
                        window.location.reload();
                      }}
                      title="Enable local mode for this browser session"
                    >
                      Work locally
                    </button>
                  ) : null}
                  <button className="btn primary" onClick={() => login(loc.pathname)}>
                    Login
                  </button>
                </>
              ) : (
                <>
                  <div className="pill">@{state.username ?? 'me'}</div>
                  <button className="btn" onClick={() => logout()}>
                    Logout
                  </button>
                </>
              )}
              </div>
            </div>
          </header>
        ) : null}

        {mobileOpen ? (
          <div
            className="sheetOverlay"
            role="dialog"
            aria-modal="true"
            onPointerDown={(e) => {
              // Prevent "click-through" to underlying UI when closing.
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.target === e.currentTarget) setMobileOpen(false);
            }}
          >
            <div
              className="sheet"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheetTop">
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="pill">Menu</div>
                  <button type="button" className="btn" onClick={() => setMobileOpen(false)}>
                    Close
                  </button>
                </div>
              </div>

              <div className="sheetBody">
                <div className="sheetSection">
                  <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                    Pages
                  </div>
                  <div className="sheetGrid">
                    <Link className="sheetLink" to="/timeline">
                      Timeline
                    </Link>
                    <Link className="sheetLink" to="/albums">
                      Albums
                    </Link>
                    <Link className="sheetLink" to="/gallery">
                      Gallery
                    </Link>
                    <Link className="sheetLink" to="/resume">
                      Resume
                    </Link>
                    <Link className="sheetLink" to="/profile">
                      Profile
                    </Link>
                    <Link className="sheetLink" to="/editor">
                      Post
                    </Link>
                  </div>
                </div>

                <div className="sheetSection">
                  <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                    Categories
                  </div>
                  <div className="sheetGrid">
                    {categories.map((c) => (
                      <Link key={c.key} className="sheetLink" to={`/category/${encodeURIComponent(c.key)}`}>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="sheetSection">
                  <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                    Social
                  </div>
                  <SocialLinks />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <main>
          <div key={loc.pathname} className="enter">
            {children}
          </div>
        </main>

        {!isExhibit ? (
          <footer className="footer">
            <div className="muted footerText">
              © {new Date().getFullYear()} · GitHub Pages · 2-Repo · PKCE
            </div>
          </footer>
        ) : null}
      </div>
    </>
  );
}
