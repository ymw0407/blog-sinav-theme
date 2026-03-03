import { globalStyle, keyframes } from '@vanilla-extract/css';
import { vars } from './tokens/theme.css';

globalStyle('html, body', { height: '100%' });

globalStyle('*, *::before, *::after', { boxSizing: 'border-box' });

globalStyle(
  'html',
  {
    background: vars.color.bg,
    color: vars.color.fg,
    scrollbarGutter: 'stable',
    // Theme-aware highlight colors used by the editor (TextHighlight mark).
    '--hl-sand': '#f6edc6',
    '--hl-mint': '#d9f3e1',
    '--hl-sky': '#d9ecff',
    '--hl-rose': '#fde1ea',
    '@supports': {
      // Fallback for browsers without `scrollbar-gutter` support (prevents layout "jump" on route changes)
      'not (scrollbar-gutter: stable)': { overflowY: 'scroll' }
    }
  } as any
);

globalStyle(
  'html[data-theme="dark"]',
  {
    // Dark mode needs darker highlight fills so light text stays readable.
    '--hl-sand': 'rgba(234, 179, 8, 0.22)',
    '--hl-mint': 'rgba(34, 197, 94, 0.18)',
    '--hl-sky': 'rgba(56, 189, 248, 0.18)',
    '--hl-rose': 'rgba(244, 63, 94, 0.18)'
  } as any
);

globalStyle('body', {
  margin: 0,
  background: vars.color.bg,
  color: vars.color.fg,
  fontFamily: vars.typography.fontBody,
  lineHeight: vars.typography.lineHeight,
  scrollbarGutter: 'stable',
  '@supports': {
    'not (scrollbar-gutter: stable)': { overflowY: 'scroll' }
  }
});

// Scrollbars (Y-axis): keep it subtle and on-theme.
globalStyle('*', {
  scrollbarWidth: 'thin',
  scrollbarColor: `color-mix(in srgb, ${vars.color.fg} 28%, transparent) transparent`
});

globalStyle('*::-webkit-scrollbar', { width: 12, height: 12 });
globalStyle('*::-webkit-scrollbar-track', { background: 'transparent' });
globalStyle('*::-webkit-scrollbar-thumb', {
  background: `color-mix(in srgb, ${vars.color.fg} 18%, transparent)`,
  borderRadius: 999,
  border: '3px solid transparent',
  backgroundClip: 'content-box'
});
globalStyle('*::-webkit-scrollbar-thumb:hover', {
  background: `color-mix(in srgb, ${vars.color.fg} 28%, transparent)`,
  border: '3px solid transparent',
  backgroundClip: 'content-box'
});

// Landing: allow scrolling but hide the vertical scrollbar for a cleaner "hero" feel.
// (Scoped via `html[data-page="landing"]` set in AppShell.)
globalStyle('html[data-page="landing"], html[data-page="landing"] body', {
  scrollbarWidth: 'none',
  msOverflowStyle: 'none'
});
globalStyle('html[data-page="landing"]::-webkit-scrollbar, html[data-page="landing"] body::-webkit-scrollbar', {
  width: 0
});

globalStyle('button, input, select, textarea', {
  fontFamily: 'inherit',
  fontSize: 'inherit',
  lineHeight: 'inherit'
});

globalStyle('a:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible', {
  outline: `2px solid color-mix(in srgb, ${vars.color.accent} 52%, transparent)`,
  outlineOffset: 2
});

globalStyle('html:not([data-theme="dark"]) a:focus-visible, html:not([data-theme="dark"]) button:focus-visible, html:not([data-theme="dark"]) input:focus-visible, html:not([data-theme="dark"]) textarea:focus-visible, html:not([data-theme="dark"]) select:focus-visible', {
  outline: `2px solid color-mix(in srgb, ${vars.color.accent} 72%, transparent)`,
  boxShadow: `0 0 0 4px color-mix(in srgb, ${vars.color.accent} 16%, transparent)`
});

globalStyle('a', {
  color: vars.color.fg,
  opacity: 0.92,
  textDecoration: 'none',
  transition: `color ${vars.motion.normal} ease, opacity ${vars.motion.normal} ease`
});

globalStyle('a:hover', {
  color: vars.color.accent,
  opacity: 1
});

globalStyle('code, pre', { fontFamily: vars.typography.fontMono });

globalStyle('.container', {
  maxWidth: '980px',
  margin: '0 auto',
  padding: '24px',
  position: 'relative',
  zIndex: 1
});

globalStyle('.grid', {
  display: 'grid',
  // `minmax(0, 1fr)` prevents grid items (notably datetime-local inputs) from overflowing/clipping.
  gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
  gap: '14px'
});

globalStyle('.col-3', { gridColumn: 'span 3' });
globalStyle('.col-4', { gridColumn: 'span 4' });
globalStyle('.col-6', { gridColumn: 'span 6' });
globalStyle('.col-8', { gridColumn: 'span 8' });
globalStyle('.col-12', { gridColumn: 'span 12' });
globalStyle('.col-3, .col-4, .col-6, .col-8', {
  '@media': {
    'screen and (max-width: 860px)': { gridColumn: 'span 12' }
  }
});

globalStyle('.row', {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap'
});

globalStyle('.filtersRow', {
  display: 'flex',
  gap: 10,
  flexWrap: 'nowrap',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
  paddingBottom: 6
});

globalStyle('.filtersRow::-webkit-scrollbar', { display: 'none' });

globalStyle('.card', {
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 62%, transparent)`,
  borderRadius: vars.radius.md,
  padding: '16px',
  boxShadow: 'none',
  transform: 'translateY(0)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  boxSizing: 'border-box',
  transition: `border-color ${vars.motion.normal} ease, box-shadow ${vars.motion.normal} ease, transform ${vars.motion.fast} ease`
});

globalStyle('html:not([data-theme="dark"]) .card', {
  background: `linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.fg} 2%, ${vars.color.card})`,
  boxShadow: `0 14px 44px rgba(2,6,23,.06), 0 1px 0 rgba(255,255,255,.40) inset`
});

globalStyle('.card:hover', {
  borderColor: `color-mix(in srgb, ${vars.color.fg} 16%, transparent)`,
  boxShadow: `0 18px 46px rgba(0,0,0,.10), 0 1px 0 rgba(255,255,255,.22) inset`,
  transform: 'translateY(-1px)'
});

globalStyle('html[data-theme="dark"] .card', {
  background: `linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 50%, transparent)`
});

globalStyle('.btn', {
  appearance: 'none',
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 12%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 46%, transparent)`,
  color: vars.color.fg,
  borderRadius: vars.radius.sm,
  padding: '8px 12px',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  cursor: 'pointer',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  transition: `background-color ${vars.motion.normal} ease, border-color ${vars.motion.normal} ease, color ${vars.motion.normal} ease, transform ${vars.motion.fast} ease`
});

globalStyle('html:not([data-theme="dark"]) .btn', {
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 16%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 86%, #ffffff)`,
  boxShadow: `0 1px 0 rgba(255,255,255,.55) inset`
});

globalStyle('html:not([data-theme="dark"]) .btn:not(.primary):not(.danger):hover', {
  borderColor: `color-mix(in srgb, ${vars.color.accent} 22%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.card} 94%, #ffffff)`,
  boxShadow: `0 12px 30px rgba(2,6,23,.10), 0 1px 0 rgba(255,255,255,.58) inset`
});

globalStyle('.btn:active', { transform: 'translateY(1px)' });

globalStyle('.iconBtn', {
  width: 36,
  height: 36,
  padding: 0,
  display: 'grid',
  placeItems: 'center'
});

globalStyle('.btn.primary', {
  background: vars.color.accent,
  borderColor: 'transparent',
  color: '#fff',
  boxShadow: `0 10px 26px color-mix(in srgb, ${vars.color.accent} 20%, transparent)`
});

globalStyle('.btn.primary:hover', {
  background: `color-mix(in srgb, ${vars.color.accent} 88%, black)`
});

// Header login button: light mode needs stronger contrast (some accents are bright/pastel).
globalStyle('html:not([data-theme="dark"]) .headerLoginBtn', {
  background: `color-mix(in srgb, ${vars.color.accent} 78%, #0b1220)`,
  borderColor: 'transparent',
  color: '#fff',
  boxShadow: `0 14px 30px rgba(2,6,23,.14)`
});

globalStyle('html:not([data-theme="dark"]) .headerLoginBtn:hover', {
  background: `color-mix(in srgb, ${vars.color.accent} 70%, #0b1220)`
});

globalStyle('.btn.danger', {
  borderColor: `color-mix(in srgb, ${vars.color.danger} 50%, ${vars.color.border})`,
  color: vars.color.danger
});

globalStyle('.input, .textarea, .select', {
  width: '100%',
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 34%, transparent)`,
  color: vars.color.fg,
  borderRadius: vars.radius.sm,
  padding: '10px 12px',
  boxSizing: 'border-box',
  minWidth: 0
});

// Write: category select (cleaner, more "designed" than the default native chrome)
globalStyle('.editorCategorySelect', {
  appearance: 'none',
  WebkitAppearance: 'none',
  paddingRight: 38,
  backgroundImage: `
    linear-gradient(45deg, transparent 50%, color-mix(in srgb, ${vars.color.fg} 64%, transparent) 50%),
    linear-gradient(135deg, color-mix(in srgb, ${vars.color.fg} 64%, transparent) 50%, transparent 50%),
    linear-gradient(to right, transparent, transparent)
  `,
  backgroundPosition: 'calc(100% - 18px) 50%, calc(100% - 13px) 50%, 100% 0',
  backgroundSize: '5px 5px, 5px 5px, 2.8em 2.8em',
  backgroundRepeat: 'no-repeat',
  transition: `border-color ${vars.motion.normal} ease, background-color ${vars.motion.normal} ease`
});

globalStyle('.editorCategorySelect:hover', {
  borderColor: `color-mix(in srgb, ${vars.color.accent} 22%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.card} 44%, transparent)`
});

// Datetime inputs can truncate seconds depending on browser UI chrome; give them a bit more usable width.
globalStyle('input[type="datetime-local"].input', {
  paddingRight: 8,
  fontVariantNumeric: 'tabular-nums'
});

globalStyle('.textarea', { minHeight: '220px', resize: 'vertical' });

globalStyle('.muted', { color: vars.color.muted });

globalStyle('.pill', {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 12%, transparent)`,
  borderRadius: '999px',
  padding: '4px 10px',
  fontSize: '12px',
  lineHeight: 1,
  fontFamily: 'inherit',
  color: vars.color.muted,
  background: `color-mix(in srgb, ${vars.color.card} 38%, transparent)`,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  transition: `border-color ${vars.motion.normal} ease, background-color ${vars.motion.normal} ease, color ${vars.motion.normal} ease`
});

globalStyle('button.pill', {
  appearance: 'none',
  WebkitAppearance: 'none',
  cursor: 'pointer'
});

globalStyle('button.pill:hover', {
  color: vars.color.fg,
  borderColor: `color-mix(in srgb, ${vars.color.accent} 26%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.card} 48%, transparent)`
});

globalStyle('button.pill:active', {
  borderColor: `color-mix(in srgb, ${vars.color.accent} 34%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.card} 54%, transparent)`
});

globalStyle('.pill.selected', {
  borderColor: `color-mix(in srgb, ${vars.color.accent} 40%, ${vars.color.border})`,
  background: vars.color.accentSoft,
  color: vars.color.fg
});

globalStyle('html:not([data-theme="dark"]) .pill.selected', {
  borderColor: `color-mix(in srgb, ${vars.color.accent} 56%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.accent} 16%, #ffffff)`,
  boxShadow: `0 1px 0 rgba(255,255,255,.55) inset`
});

globalStyle('html:not([data-theme="dark"]) a.pill:not(.tagChip):hover, html:not([data-theme="dark"]) button.pill:not(.tagChip):hover', {
  color: vars.color.fg,
  borderColor: `color-mix(in srgb, ${vars.color.accent} 24%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.card} 94%, #ffffff)`,
  boxShadow: `0 10px 22px rgba(2,6,23,.08), 0 1px 0 rgba(255,255,255,.55) inset`
});

globalStyle('.tagChip', {
  padding: '6px 10px',
  fontSize: 12,
  fontWeight: 660,
  letterSpacing: '-0.01em',
  color: `color-mix(in srgb, ${vars.color.fg} 92%, ${vars.color.muted})`,
  background: `color-mix(in srgb, ${vars.color.card} 54%, transparent)`,
  borderColor: `color-mix(in srgb, ${vars.color.fg} 12%, transparent)`,
  boxShadow: `0 1px 0 rgba(255,255,255,.22) inset`,
  transition: `border-color ${vars.motion.normal} ease, background-color ${vars.motion.normal} ease, color ${vars.motion.normal} ease, transform ${vars.motion.fast} ease, box-shadow ${vars.motion.normal} ease`
});

globalStyle('.tagChip:hover', {
  transform: 'translateY(-1px)',
  borderColor: `color-mix(in srgb, ${vars.color.accent} 26%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.card} 64%, transparent)`,
  boxShadow: `0 12px 26px rgba(0,0,0,.10), 0 1px 0 rgba(255,255,255,.26) inset`
});

globalStyle('html[data-theme="dark"] .tagChip', {
  boxShadow: 'none',
  background: `color-mix(in srgb, ${vars.color.card} 42%, transparent)`
});

globalStyle('html[data-theme="dark"] .tagChip:hover', {
  background: `color-mix(in srgb, ${vars.color.card} 52%, transparent)`,
  boxShadow: `0 18px 38px rgba(0,0,0,.32)`
});

globalStyle('.tagChip.selected', {
  borderColor: `color-mix(in srgb, ${vars.color.accent} 40%, ${vars.color.border})`,
  background: vars.color.accentSoft,
  color: vars.color.fg,
  boxShadow: `0 1px 0 rgba(255,255,255,.16) inset`
});

globalStyle('html:not([data-theme="dark"]) .tagChip.selected', {
  borderColor: `color-mix(in srgb, ${vars.color.accent} 58%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.accent} 16%, #ffffff)`,
  boxShadow: `0 10px 24px rgba(2,6,23,.08), 0 1px 0 rgba(255,255,255,.55) inset`
});

globalStyle('html[data-theme="dark"] .tagChip.selected', {
  borderColor: `color-mix(in srgb, ${vars.color.accent} 44%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.accent} 22%, transparent)`,
  boxShadow: `0 1px 0 rgba(255,255,255,.06) inset`
});

globalStyle('.sectionHeader', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: 14,
  flexWrap: 'wrap',
  marginBottom: 12
});

globalStyle('.carousel', {
  borderRadius: vars.radius.lg
});

globalStyle('.carousel.carouselMinimal', {
  borderRadius: vars.radius.md
});

globalStyle('.carousel.carouselMinimal .carouselScroller', {
  paddingBottom: 0
});

globalStyle('.carouselTop', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 10,
  flexWrap: 'wrap'
});

globalStyle('.carouselScroller', {
  display: 'flex',
  gap: 0,
  overflowX: 'auto',
  paddingBottom: 8,
  scrollSnapType: 'x mandatory',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none'
});

globalStyle('.carouselScroller::-webkit-scrollbar', { height: 0 });

globalStyle('.carouselSlide', {
  scrollSnapAlign: 'start',
  flex: '0 0 100%',
  maxWidth: '100%'
});

globalStyle('.carouselDots', { display: 'flex', gap: 8, alignItems: 'center' });

globalStyle('.carouselDot', {
  width: 8,
  height: 8,
  borderRadius: 999,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 18%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 30%, transparent)`,
  cursor: 'pointer',
  transition: `transform ${vars.motion.fast} ease, background-color ${vars.motion.normal} ease, border-color ${vars.motion.normal} ease`
});

globalStyle('.carouselDot.active', {
  background: vars.color.accent,
  borderColor: `color-mix(in srgb, ${vars.color.accent} 55%, transparent)`,
  transform: 'scale(1.12)'
});

globalStyle('.featuredCard', {
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 60%, transparent)`,
  borderRadius: vars.radius.lg,
  padding: 16,
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)'
});

globalStyle('.featuredTop', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' });

globalStyle('.featuredGrid', {
  marginTop: 12,
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12
});

globalStyle('.featuredGrid2', {
  marginTop: 12,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12
});

globalStyle('.featuredItem', {
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 40%, transparent)`,
  borderRadius: vars.radius.md,
  padding: 10,
  display: 'grid',
  alignContent: 'start',
  gap: 6,
  transition: `transform ${vars.motion.fast} ease, border-color ${vars.motion.normal} ease, background-color ${vars.motion.normal} ease`
});

globalStyle('.featuredPostThumb', {
  // Slightly taller so the thumbnail doesn't feel overly wide.
  height: 156,
  borderRadius: vars.radius.md,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: '#000',
  overflow: 'hidden',
  position: 'relative'
});

globalStyle('.featuredPostThumb .thumbBg', {
  position: 'absolute',
  inset: -16,
  width: 'calc(100% + 32px)',
  height: 'calc(100% + 32px)',
  objectFit: 'cover',
  filter: 'blur(18px) saturate(1.15) contrast(1.05)',
  opacity: 0.65,
  transform: 'scale(1.05)'
});

globalStyle('.featuredPostThumb .thumbFg', {
  position: 'absolute',
  inset: 2,
  width: 'calc(100% - 4px)',
  height: 'calc(100% - 4px)',
  objectFit: 'contain',
  objectPosition: 'center',
  display: 'block'
});

globalStyle('.featuredItem:hover', {
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      transform: 'translateY(-1px)',
      borderColor: `color-mix(in srgb, ${vars.color.fg} 14%, transparent)`,
      background: `color-mix(in srgb, ${vars.color.card} 52%, transparent)`
    }
  }
});

globalStyle('.featuredTitle', { fontWeight: 780, letterSpacing: '-0.015em' });
globalStyle('.featuredSummary', { marginTop: 4, fontSize: 13, lineHeight: 1.26 });

globalStyle('.featuredTags', { marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' });

globalStyle('.featuredAlbum', {
  display: 'block',
  borderRadius: vars.radius.md,
  padding: 10,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 40%, transparent)`,
  transition: `transform ${vars.motion.fast} ease, border-color ${vars.motion.normal} ease`
});

globalStyle('.featuredAlbum:hover', {
  '@media': {
    '(hover: hover) and (pointer: fine)': { transform: 'translateY(-1px)', borderColor: `color-mix(in srgb, ${vars.color.fg} 14%, transparent)` }
  }
});

globalStyle('.featuredThumb', {
  height: 150,
  borderRadius: vars.radius.md,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 46%, transparent)`,
  overflow: 'hidden',
  display: 'grid',
  placeItems: 'center'
});

globalStyle('.featuredThumb img', { width: '100%', height: '100%', objectFit: 'contain', display: 'block' });

globalStyle('.featuredWorks', {
  marginTop: 12,
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
  gap: 10
});

globalStyle('.featuredWorksWall', {
  marginTop: 12,
  // Prevent this slide from becoming taller than the "Featured Posts (4 items)" slide.
  // If there are more works, the teaser remains a stable size; clicking takes you to /gallery.
  maxHeight: 560,
  overflow: 'hidden',
  '@media': {
    'screen and (max-width: 620px)': { maxHeight: 440 }
  }
});

globalStyle('.workThumb', {
  height: 120,
  borderRadius: vars.radius.md,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 58%, transparent)`,
  overflow: 'hidden',
  display: 'grid',
  placeItems: 'stretch',
  position: 'relative',
  padding: 10
});

globalStyle('.workMat', {
  width: '100%',
  height: '100%',
  borderRadius: 12,
  overflow: 'hidden',
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 12%, transparent)`,
  background: 'rgba(0,0,0,.10)',
  display: 'grid',
  placeItems: 'center'
});

globalStyle('.workMat img', { width: '100%', height: '100%', objectFit: 'contain', display: 'block' });

globalStyle('.workLabel', {
  position: 'absolute',
  left: 8,
  bottom: 8,
  fontSize: 12,
  color: '#fff',
  padding: '4px 8px',
  borderRadius: 999,
  background: 'rgba(0,0,0,.45)',
  opacity: 0,
  transition: `opacity ${vars.motion.normal} ease`
});

globalStyle('.workThumb:hover .workLabel', { opacity: 1 });

globalStyle('.featuredGrid, .featuredGrid2, .featuredWorks', {
  '@media': {
    'screen and (max-width: 860px)': {
      gridTemplateColumns: 'repeat(1, minmax(0, 1fr))'
    }
  }
});

globalStyle('.featuredWorks', {
  '@media': {
    'screen and (max-width: 980px)': { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' },
    'screen and (max-width: 620px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }
  }
});

globalStyle('.header', {
  position: 'sticky',
  top: 'calc(12px + env(safe-area-inset-top, 0px))',
  zIndex: 20,
  marginBottom: 18,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  borderRadius: vars.radius.lg,
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.bg} 82%, transparent), color-mix(in srgb, ${vars.color.bg} 68%, transparent))`,
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  boxShadow: `0 16px 50px rgba(0,0,0,.08)`
});

globalStyle('.headerRow', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 14,
  padding: '14px 14px 10px',
  flexWrap: 'wrap'
});

globalStyle('.headerLeft, .headerRight', { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'nowrap', minWidth: 0 });
globalStyle('.headerRight', { justifyContent: 'flex-end' });

globalStyle('.brand', {
  fontWeight: 800,
  letterSpacing: '-0.02em',
  padding: '6px 10px',
  paddingLeft: 14,
  borderRadius: 12,
  transition: `background-color ${vars.motion.normal} ease, color ${vars.motion.normal} ease`
});

globalStyle('.brand:hover', { background: `color-mix(in srgb, ${vars.color.card} 42%, transparent)`, color: vars.color.fg });

globalStyle('.headerCats', {
  display: 'flex',
  gap: 10,
  padding: 0,
  flex: '1 1 420px',
  justifyContent: 'flex-start',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none'
});

globalStyle('.headerCats::-webkit-scrollbar', { display: 'none' });

// When nav overflows (typically due to zoom), expose a "more" affordance.
globalStyle('html[data-nav-overflow="1"] .headerMenuBtn', {
  display: 'grid',
  visibility: 'visible',
  pointerEvents: 'auto',
  opacity: 1
});

globalStyle('html[data-nav-overflow="1"] .headerCats', {
  // Add a subtle fade so users notice there's more to scroll.
  maskImage: 'linear-gradient(90deg, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%)',
  WebkitMaskImage: 'linear-gradient(90deg, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%)'
});

globalStyle('.catLink', {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  borderRadius: 999,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 34%, transparent)`,
  color: vars.color.fg,
  opacity: 0.88,
  whiteSpace: 'nowrap',
  transition: `border-color ${vars.motion.normal} ease, background-color ${vars.motion.normal} ease, opacity ${vars.motion.normal} ease`
});

globalStyle('.catLink:hover', {
  opacity: 1,
  borderColor: `color-mix(in srgb, ${vars.color.accent} 22%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.card} 44%, transparent)`
});

globalStyle('.catLinkActive', {
  opacity: 1,
  borderColor: `color-mix(in srgb, ${vars.color.accent} 32%, ${vars.color.border})`,
  background: vars.color.accentSoft
});

globalStyle('.headerSocial', {
  display: 'flex',
  gap: 6,
  alignItems: 'center'
});

globalStyle('.headerMenuBtn', {
  // Hidden by default (desktop). Enabled on mobile and when nav overflows.
  display: 'none',
  width: 40,
  height: 40,
  borderRadius: 999,
  visibility: 'hidden',
  pointerEvents: 'none',
  opacity: 0,
  transition: `opacity ${vars.motion.normal} ease`
});

globalStyle('.socialLinks', { display: 'flex', gap: 6, alignItems: 'center' });

globalStyle('.socialLink', {
  width: 34,
  height: 34,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 999,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 34%, transparent)`,
  color: vars.color.fg,
  opacity: 0.9,
  transition: `transform ${vars.motion.fast} ease, border-color ${vars.motion.normal} ease, background-color ${vars.motion.normal} ease, opacity ${vars.motion.normal} ease`
});

globalStyle('.socialLink:hover', {
  opacity: 1,
  transform: 'translateY(-1px)',
  borderColor: `color-mix(in srgb, ${vars.color.accent} 22%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.card} 44%, transparent)`
});

globalStyle('.repoPill', {
  '@media': {
    'screen and (max-width: 760px)': { display: 'none' }
  }
});

globalStyle('.container', {
  '@media': {
    'screen and (max-width: 620px)': { padding: '16px' }
  }
});

globalStyle('.headerRow', {
  '@media': {
    'screen and (max-width: 900px)': {
      gap: 10
    },
    'screen and (max-width: 760px)': {
      // Give the mobile header some internal horizontal padding so the hamburger
      // isn't flush against the rounded border.
      padding: '12px 12px 10px'
    }
  }
});

globalStyle('.headerLeft, .headerRight', {
  '@media': {
    'screen and (max-width: 760px)': {
      gap: 10
    },
    'screen and (max-width: 620px)': {
      gap: 8,
      flexWrap: 'wrap'
    }
  }
});

globalStyle('.headerCats', {
  '@media': {
    'screen and (max-width: 760px)': {
      display: 'none'
    }
  }
});

globalStyle('.headerSocial', {
  '@media': {
    'screen and (max-width: 620px)': { display: 'none' }
  }
});

globalStyle('.headerMenuBtn', {
  '@media': {
    'screen and (max-width: 760px)': {
      display: 'grid',
      visibility: 'visible',
      pointerEvents: 'auto',
      opacity: 1
    }
  }
});

globalStyle('html[data-sheet="open"] .headerMenuBtn', {
  '@media': {
    'screen and (max-width: 760px)': {
      visibility: 'hidden',
      pointerEvents: 'none',
      opacity: 0
    }
  }
});

globalStyle('.menuWrap', {
  position: 'relative',
  display: 'inline-flex'
});

globalStyle('.menuPopover', {
  position: 'absolute',
  top: 'calc(100% + 10px)',
  left: 0,
  minWidth: 0,
  maxWidth: 'calc(100vw - 16px)',
  padding: 10,
  boxSizing: 'border-box',
  borderRadius: vars.radius.lg,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 12%, transparent)`,
  background: `linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 68%, transparent)`,
  boxShadow: `0 22px 60px rgba(0,0,0,.16)`,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  display: 'grid',
  gap: 6,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  WebkitOverflowScrolling: 'touch',
  zIndex: 30
});

globalStyle('html[data-theme="dark"] .menuPopover', {
  background: `linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 58%, transparent)`
});

globalStyle('.menuItem', {
  display: 'grid',
  gap: 4,
  padding: '10px 10px',
  borderRadius: vars.radius.md,
  border: `1px solid transparent`,
  background: `color-mix(in srgb, ${vars.color.card} 36%, transparent)`,
  color: vars.color.fg,
  transition: `border-color ${vars.motion.normal} ease, background-color ${vars.motion.normal} ease, transform ${vars.motion.fast} ease`
});

globalStyle('.menuItem:hover', {
  transform: 'translateY(-1px)',
  borderColor: `color-mix(in srgb, ${vars.color.accent} 22%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.card} 50%, transparent)`
});

globalStyle('.menuItemTitle', { fontWeight: 720, letterSpacing: '-0.01em' });
globalStyle('.menuItemDesc', { fontSize: 12, color: vars.color.muted, lineHeight: 1.35 });

globalStyle('.sheetOverlay', {
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: 'color-mix(in srgb, rgba(0,0,0,.45) 72%, transparent)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  display: 'grid',
  justifyItems: 'center',
  alignItems: 'end',
  padding: 16
});

globalStyle('.sheet', {
  width: 'min(980px, 100%)',
  maxHeight: 'min(760px, 86vh)',
  borderRadius: vars.radius.lg,
  border: `1px solid rgba(255,255,255,.14)`,
  background: `linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 70%, transparent)`,
  boxShadow: `0 28px 90px rgba(0,0,0,.26)`,
  overflow: 'hidden'
});

globalStyle('html[data-theme="dark"] .sheet', {
  borderColor: 'rgba(255,255,255,.10)',
  background: `linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 60%, transparent)`
});

globalStyle('.sheetTop', { padding: 14 });
globalStyle('.sheetBody', { padding: 14, display: 'grid', gap: 16 });
globalStyle('.sheetSection', { display: 'grid' });

globalStyle('.sheetGrid', {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10
});

globalStyle('.sheetGrid', {
  '@media': {
    'screen and (max-width: 420px)': { gridTemplateColumns: 'repeat(1, minmax(0, 1fr))' }
  }
});

globalStyle('.sheetLink', {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 40,
  borderRadius: 999,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 40%, transparent)`,
  color: vars.color.fg,
  fontWeight: 650,
  letterSpacing: '-0.01em',
  transition: `border-color ${vars.motion.normal} ease, background-color ${vars.motion.normal} ease, transform ${vars.motion.fast} ease`
});

globalStyle('.sheetLink:hover', {
  transform: 'translateY(-1px)',
  borderColor: `color-mix(in srgb, ${vars.color.accent} 22%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.card} 52%, transparent)`
});

globalStyle('.footer', {
  marginTop: 16,
  padding: '28px 0',
  borderTop: `1px solid ${vars.color.border}`
});

globalStyle('.footerText', { fontSize: 12 });

globalStyle('.prose', {
  maxWidth: 'min(900px, 100%)',
  margin: '0 auto',
  padding: '18px 0 26px'
});

globalStyle('.postProse', {
  maxWidth: '100%',
  margin: 0
});

globalStyle('.postProse .tiptap', {
  maxWidth: '100%',
  margin: 0
});

globalStyle('.mdx h1, .mdx h2, .mdx h3', { scrollMarginTop: '90px' });

globalStyle('.mdx', {
  fontSize: 16,
  lineHeight: vars.typography.lineHeight,
  letterSpacing: '-0.01em'
});

globalStyle('.mdx p', { margin: '0 0 16px' });
globalStyle('.mdx ul, .mdx ol', { margin: '0 0 16px', paddingLeft: 20 });
globalStyle('.mdx li', { margin: '6px 0' });

globalStyle('.mdx h1', { margin: '6px 0 14px', fontSize: 34, letterSpacing: '-0.03em', fontWeight: 820, lineHeight: 1.18 });
globalStyle('.mdx h2', { margin: '28px 0 12px', fontSize: 24, letterSpacing: '-0.03em', fontWeight: 760, lineHeight: 1.25 });
globalStyle('.mdx h3', { margin: '22px 0 10px', fontSize: 18, letterSpacing: '-0.02em', fontWeight: 720, lineHeight: 1.32 });

globalStyle('.mdx a', {
  color: vars.color.fg,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  textDecorationColor: `color-mix(in srgb, ${vars.color.fg} 28%, transparent)`,
  transition: `color ${vars.motion.normal} ease, text-decoration-color ${vars.motion.normal} ease`
});

globalStyle('.mdx a:hover', {
  color: vars.color.accent,
  textDecorationColor: vars.color.accent
});

globalStyle('.mdx hr', {
  border: 0,
  height: 1,
  background: vars.color.border,
  margin: '24px 0'
});

globalStyle('.mdx :not(pre) > code', {
  border: `1px solid ${vars.color.border}`,
  background: `color-mix(in srgb, ${vars.color.card} 70%, ${vars.color.bg})`,
  padding: '0.16em 0.42em',
  borderRadius: 10,
  fontSize: '0.92em'
});

globalStyle('.mdx pre', {
  overflow: 'auto',
  border: `1px solid ${vars.color.border}`,
  background: `color-mix(in srgb, ${vars.color.card} 84%, ${vars.color.bg})`,
  padding: '12px',
  borderRadius: vars.radius.md
});

globalStyle('html[data-theme="dark"] .mdx pre', {
  background: `color-mix(in srgb, ${vars.color.card} 70%, black)`
});

globalStyle('.mdx pre code', { border: 0, background: 'transparent', padding: 0 });

globalStyle('.mdx blockquote', {
  borderLeft: `3px solid ${vars.color.border}`,
  margin: '0 0 16px',
  padding: '2px 0 2px 12px',
  color: vars.color.muted
});

globalStyle('.mdx img', {
  maxWidth: '100%',
  display: 'block',
  margin: '18px auto',
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`
});

globalStyle('.mdx table', {
  width: '100%',
  borderCollapse: 'collapse',
  margin: '0 0 18px'
});

globalStyle('.mdx th, .mdx td', {
  border: `1px solid ${vars.color.border}`,
  padding: '10px 12px',
  verticalAlign: 'top'
});

globalStyle('.mdx th', {
  textAlign: 'left',
  background: `color-mix(in srgb, ${vars.color.card} 80%, ${vars.color.bg})`
});

globalStyle('.thumbPreview', {
  width: 180,
  aspectRatio: '16 / 10',
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  background: `color-mix(in srgb, ${vars.color.card} 70%, ${vars.color.bg})`,
  overflow: 'hidden',
  display: 'grid',
  placeItems: 'center',
  '@media': {
    'screen and (max-width: 620px)': { width: 'min(180px, 46vw)' }
  }
});

// Write (Editor) toolbar
globalStyle('.editorToolbarBar', { position: 'relative' });

globalStyle('.editorToolbarRow', {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  flexWrap: 'wrap'
});

globalStyle('.editorToolbarSub', { marginTop: 8 });

globalStyle('.editorToolbarRow .btn', {
  padding: '0 10px',
  height: 32,
  minHeight: 32,
  fontSize: 12
});

globalStyle('.editorToolbarRow .select', { height: 32 });

globalStyle('.editorToolbarRow', {
  '@media': {
    'screen and (max-width: 620px)': {
      flexWrap: 'nowrap',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      paddingBottom: 6
    }
  }
});

globalStyle('.editorToolbarRow::-webkit-scrollbar', { display: 'none' });

// Bubble menu (selection toolbar)
globalStyle('.editorBubble', {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: 10,
  borderRadius: 14,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 14%, transparent)`,
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 84%, transparent), color-mix(in srgb, ${vars.color.card} 66%, transparent))`,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: `0 18px 60px rgba(2,6,23,.20)`
});

// Bubble buttons should feel like a small, dense command palette (not full-size buttons).
globalStyle('.editorBubble .btn', {
  height: 30,
  minWidth: 30,
  padding: '0 10px',
  borderRadius: 10,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 12%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 40%, transparent)`,
  color: vars.color.fg,
  boxShadow: `0 1px 0 rgba(255,255,255,.10) inset`,
  transition: `transform ${vars.motion.fast} ease, border-color ${vars.motion.normal} ease, background-color ${vars.motion.normal} ease, box-shadow ${vars.motion.normal} ease`
});

globalStyle('.editorBubble .btn:hover', {
  transform: 'translateY(-1px)',
  borderColor: `color-mix(in srgb, ${vars.color.accent} 22%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.card} 55%, transparent)`,
  boxShadow: `0 12px 26px rgba(2,6,23,.12), 0 1px 0 rgba(255,255,255,.12) inset`
});

globalStyle('.editorBubble .btn.primary', {
  // Override global primary button styling: keep it subtle inside the bubble.
  background: `color-mix(in srgb, ${vars.color.accent} 18%, ${vars.color.card})`,
  borderColor: `color-mix(in srgb, ${vars.color.accent} 32%, ${vars.color.border})`,
  color: vars.color.fg,
  boxShadow: `0 1px 0 rgba(255,255,255,.14) inset, 0 0 0 3px color-mix(in srgb, ${vars.color.accent} 12%, transparent)`
});

globalStyle('.editorBubbleSep', {
  width: 1,
  height: 22,
  background: `color-mix(in srgb, ${vars.color.fg} 14%, transparent)`,
  margin: '0 4px'
});

globalStyle('.editorColorDot', {
  width: 22,
  height: 22,
  borderRadius: 8,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 18%, transparent)`,
  cursor: 'pointer',
  boxShadow: `0 1px 0 rgba(255,255,255,.10) inset`,
  transition: `transform ${vars.motion.fast} ease, box-shadow ${vars.motion.normal} ease, border-color ${vars.motion.normal} ease`
});

globalStyle('.editorColorDot:hover', {
  transform: 'translateY(-1px)',
  borderColor: `color-mix(in srgb, ${vars.color.accent} 24%, ${vars.color.border})`,
  boxShadow: `0 10px 22px rgba(2,6,23,.12), 0 1px 0 rgba(255,255,255,.14) inset`
});

globalStyle('.editorColorDot[data-active="true"]', {
  borderColor: `color-mix(in srgb, ${vars.color.accent} 46%, ${vars.color.border})`,
  boxShadow: `0 0 0 3px color-mix(in srgb, ${vars.color.accent} 18%, transparent)`
});

globalStyle('.editorInsertRow', {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'center'
});

// (removed) editorCalloutIconSelect: callout icon is now changed by clicking the icon in the callout itself.

// TipTap (Notion-like WYSIWYG)
globalStyle('.tiptap', {
  maxWidth: vars.typography.contentWidth,
  margin: '0 auto',
  outline: 'none'
});

globalStyle('.tiptap.tiptapEdit', {
  maxWidth: '100%',
  margin: 0
});

globalStyle('.tiptap .ProseMirror', {
  minHeight: 240,
  padding: '8px 2px',
  cursor: 'text',
  outline: 'none'
});

// Notion-ish text highlight (marker)
globalStyle('.tiptap span[data-highlight="true"]', {
  borderRadius: 4,
  padding: '0 2px',
  boxDecorationBreak: 'clone',
  WebkitBoxDecorationBreak: 'clone'
});

// If a legacy document stored a light highlight color in dark mode, keep text readable.
globalStyle('html[data-theme="dark"] .tiptap span[data-highlight="true"]', {
  color: `color-mix(in srgb, ${vars.color.fg} 96%, white)`
});

globalStyle('.tiptap.tiptapEdit .ProseMirror', {
  padding: '10px 6px'
});

globalStyle('.tiptapRead .ProseMirror', {
  minHeight: 0,
  padding: 0,
  cursor: 'default'
});

globalStyle('.tiptap p', { margin: '0 0 16px' });
globalStyle('.tiptap ul, .tiptap ol', { margin: '0 0 16px', paddingLeft: 20 });
globalStyle('.tiptap li', { margin: '6px 0' });

globalStyle('.tiptapImageContainer', { width: '100%', position: 'relative' });

globalStyle('.tiptapImageFrame', {
  position: 'relative',
  borderRadius: vars.radius.md
});

globalStyle('.tiptapImage[data-selected="true"] .tiptapImageFrame', {
  cursor: 'grab'
});

globalStyle('.tiptapImage[data-dragging="true"] .tiptapImageFrame', {
  cursor: 'grabbing'
});

globalStyle('.tiptapImageEl', {
  width: '100%',
  height: 'auto',
  display: 'block',
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  background: `color-mix(in srgb, ${vars.color.card} 65%, ${vars.color.bg})`,
  userSelect: 'none'
});

globalStyle('.tiptapImage[data-selected="true"] .tiptapImageEl', {
  cursor: 'grab'
});

globalStyle('.tiptapImage[data-dragging="true"] .tiptapImageEl', {
  cursor: 'grabbing'
});

globalStyle('.tiptapImageOutline', {
  position: 'absolute',
  inset: -2,
  borderRadius: vars.radius.md,
  pointerEvents: 'none'
});

globalStyle('.tiptapImageHandle', {
  appearance: 'none',
  WebkitAppearance: 'none',
  position: 'absolute',
  top: '50%',
  width: 12,
  height: 44,
  padding: 0,
  borderRadius: 999,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 14%, transparent)`,
  background: `linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 70%, transparent)`,
  boxShadow: `0 10px 26px rgba(0,0,0,.14)`,
  cursor: 'ew-resize',
  transform: 'translateY(-50%)',
  opacity: 0.92,
  transition: `transform ${vars.motion.fast} ease, opacity ${vars.motion.normal} ease`
});

globalStyle('.tiptapImageHandle:hover', { opacity: 1, transform: 'translateY(-50%) scale(1.02)' });

globalStyle('.tiptapImageHandleLeft', { left: -6 });
globalStyle('.tiptapImageHandleRight', { right: -6 });

globalStyle('.tiptapImageMove', {
  appearance: 'none',
  WebkitAppearance: 'none',
  position: 'absolute',
  top: -10,
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '4px 10px',
  height: 24,
  borderRadius: 999,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 14%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 72%, transparent)`,
  color: vars.color.fg,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  cursor: 'grab',
  boxShadow: `0 10px 26px rgba(0,0,0,.14)`,
  opacity: 0.92
});

globalStyle('.tiptapImageMove:active', { cursor: 'grabbing' });

globalStyle('.tiptapImageSizeLabel', {
  position: 'absolute',
  left: '50%',
  bottom: 10,
  transform: 'translateX(-50%)',
  fontSize: 12,
  lineHeight: 1,
  padding: '6px 8px',
  borderRadius: 999,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 12%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 70%, transparent)`,
  color: vars.color.fg,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  opacity: 0.85,
  pointerEvents: 'none'
});

globalStyle('.tiptap h1', { margin: '6px 0 14px', fontSize: 34, letterSpacing: '-0.02em' });
globalStyle('.tiptap h2', { margin: '28px 0 12px', fontSize: 24, letterSpacing: '-0.02em' });
globalStyle('.tiptap h3', { margin: '22px 0 10px', fontSize: 18 });

globalStyle('.tiptap a', {
  color: vars.color.fg,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  textDecorationColor: `color-mix(in srgb, ${vars.color.fg} 28%, transparent)`,
  transition: `color ${vars.motion.normal} ease, text-decoration-color ${vars.motion.normal} ease`
});

globalStyle('.tiptap a:hover', {
  color: vars.color.accent,
  textDecorationColor: vars.color.accent
});

globalStyle('.tiptap hr', {
  border: 0,
  height: 1,
  background: vars.color.border,
  margin: '24px 0'
});

globalStyle('.tiptap :not(pre) > code', {
  border: `1px solid ${vars.color.border}`,
  background: `color-mix(in srgb, ${vars.color.card} 70%, ${vars.color.bg})`,
  padding: '0.16em 0.42em',
  borderRadius: 10,
  fontSize: '0.92em'
});

globalStyle('.tiptap pre', {
  overflow: 'auto',
  border: `1px solid ${vars.color.border}`,
  background: `color-mix(in srgb, ${vars.color.card} 70%, black)`,
  padding: '12px',
  position: 'relative',
  borderRadius: vars.radius.md,
  margin: '0 0 16px'
});

// Sanity-check class added by CodeBlockHighlight decoration. Also makes code blocks feel more "framed".
globalStyle('.tiptap pre.codehl', {
  boxShadow: `0 0 0 1px color-mix(in srgb, ${vars.color.accent} 18%, transparent) inset`
});

globalStyle('.tiptap .fancyCodeBlock.codehl', {
  boxShadow: `0 0 0 1px color-mix(in srgb, ${vars.color.accent} 18%, transparent) inset`
});

// Light mode: keep code blocks crisp and paper-like (closer to the screenshot aesthetic).
globalStyle('html:not([data-theme="dark"]) .tiptap pre', {
  background: `color-mix(in srgb, ${vars.color.card} 86%, white)`,
  borderColor: `color-mix(in srgb, ${vars.color.fg} 10%, transparent)`
});

globalStyle('.tiptap pre[data-language]', {
  paddingTop: 34
});

globalStyle('.tiptap pre[data-language="plain"]', {
  paddingTop: 12
});

globalStyle('.tiptap pre[data-language]::before', {
  content: 'attr(data-language)',
  position: 'absolute',
  top: 8,
  right: 10,
  fontSize: 11,
  lineHeight: 1,
  padding: '5px 8px',
  borderRadius: 999,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 12%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 60%, transparent)`,
  color: `color-mix(in srgb, ${vars.color.fg} 86%, ${vars.color.muted})`,
  opacity: 0.9
});

globalStyle('.tiptap pre code', { border: 0, background: 'transparent', padding: 0 });

// Fancy code block (nodeView): title + copy + line numbers.
globalStyle('.tiptap .fancyCodeBlock', {
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.md,
  overflow: 'hidden',
  margin: '0 0 16px',
  background: `color-mix(in srgb, ${vars.color.card} 70%, black)`
});

globalStyle('html:not([data-theme="dark"]) .tiptap .fancyCodeBlock', {
  background: `color-mix(in srgb, ${vars.color.card} 86%, white)`,
  borderColor: `color-mix(in srgb, ${vars.color.fg} 10%, transparent)`
});

globalStyle('.tiptap .fancyCodeHeader', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  padding: '10px 12px',
  borderBottom: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 28%, transparent), transparent)`
});

globalStyle('.tiptap .fancyCodeTitleWrap', { minWidth: 0, flex: 1 });

globalStyle('.tiptap .fancyCodeTitleInput', {
  width: '100%',
  border: 0,
  outline: 'none',
  background: 'transparent',
  color: vars.color.fg,
  fontWeight: 700,
  letterSpacing: '-0.01em',
  padding: 0,
  minWidth: 0
});

globalStyle('.tiptap .fancyCodeTitleInput::placeholder', {
  color: `color-mix(in srgb, ${vars.color.muted} 90%, transparent)`
});

globalStyle('.tiptap .fancyCodeTitleText', {
  fontWeight: 750,
  letterSpacing: '-0.01em',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
});

globalStyle('.tiptap .fancyCodeActions', { display: 'flex', alignItems: 'center', gap: 8 });

globalStyle('.tiptap .fancyCodeLangPill', {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 28,
  padding: '0 10px',
  borderRadius: 999,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 12%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 46%, transparent)`,
  fontSize: 12,
  color: vars.color.muted,
  userSelect: 'none'
});

globalStyle('.tiptap .fancyCodeLangSelect', {
  height: 28,
  padding: '0 10px',
  borderRadius: 999,
  fontSize: 12,
  background: `color-mix(in srgb, ${vars.color.card} 46%, transparent)`
});

globalStyle('.tiptap .fancyCodeCopyBtn', {
  height: 28,
  padding: '0 10px',
  borderRadius: 999,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 12%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 46%, transparent)`,
  color: vars.color.fg,
  fontSize: 12,
  cursor: 'pointer',
  transition: `transform ${vars.motion.fast} ease, border-color ${vars.motion.normal} ease, background-color ${vars.motion.normal} ease`
});

globalStyle('.tiptap .fancyCodeCopyBtn:hover', {
  transform: 'translateY(-1px)',
  borderColor: `color-mix(in srgb, ${vars.color.accent} 22%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.card} 58%, transparent)`
});

globalStyle('.tiptap .fancyCodeScroller', {
  display: 'grid',
  gridTemplateColumns: '52px minmax(0, 1fr)',
  overflow: 'auto'
});

globalStyle('.tiptap .fancyCodeGutter', {
  position: 'sticky',
  left: 0,
  padding: '12px 8px 12px 12px',
  textAlign: 'right',
  color: `color-mix(in srgb, ${vars.color.muted} 92%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 30%, transparent)`,
  borderRight: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  userSelect: 'none',
  fontFamily: vars.typography.fontMono,
  fontSize: 13,
  lineHeight: 1.65
});

globalStyle('.tiptap .fancyCodeLineNo', {
  fontFamily: 'inherit',
  fontSize: 'inherit',
  lineHeight: 'inherit'
});

globalStyle('.tiptap .fancyCodePre', {
  margin: 0,
  padding: 12,
  background: 'transparent',
  border: 0,
  borderRadius: 0,
  overflow: 'visible', // scroller owns overflow
  fontFamily: vars.typography.fontMono,
  fontSize: 13,
  lineHeight: 1.65
});

globalStyle('.tiptap .fancyCodePre code', {
  border: 0,
  background: 'transparent',
  padding: 0,
  display: 'block',
  minWidth: 'max-content',
  whiteSpace: 'pre',
  tabSize: 2
});

// Code syntax highlighting (no external deps): decoration spans with token classes.
globalStyle('.tiptap pre .tok-punct', {
  color: `color-mix(in srgb, ${vars.color.fg} 70%, ${vars.color.muted})`
});

globalStyle('.tiptap .fancyCodePre .tok-punct', {
  color: `color-mix(in srgb, ${vars.color.fg} 70%, ${vars.color.muted})`
});

globalStyle('html:not([data-theme="dark"]) .tiptap pre .tok-comment', {
  color: `color-mix(in srgb, ${vars.color.muted} 92%, transparent)`,
  fontStyle: 'italic'
});
globalStyle('html:not([data-theme="dark"]) .tiptap .fancyCodePre .tok-comment', {
  color: `color-mix(in srgb, ${vars.color.muted} 92%, transparent)`,
  fontStyle: 'italic'
});
globalStyle('html:not([data-theme="dark"]) .tiptap pre .tok-keyword', {
  color: `color-mix(in srgb, ${vars.color.accent} 88%, #0b1220)`,
  fontWeight: 650
});
globalStyle('html:not([data-theme="dark"]) .tiptap .fancyCodePre .tok-keyword', {
  color: `color-mix(in srgb, ${vars.color.accent} 88%, #0b1220)`,
  fontWeight: 650
});
globalStyle('html:not([data-theme="dark"]) .tiptap pre .tok-string', {
  color: '#1a7f37'
});
globalStyle('html:not([data-theme="dark"]) .tiptap .fancyCodePre .tok-string', {
  color: '#1a7f37'
});
globalStyle('html:not([data-theme="dark"]) .tiptap pre .tok-number', {
  color: '#b42318'
});
globalStyle('html:not([data-theme="dark"]) .tiptap .fancyCodePre .tok-number', {
  color: '#b42318'
});
globalStyle('html:not([data-theme="dark"]) .tiptap pre .tok-const', {
  color: '#0550ae',
  fontWeight: 600
});
globalStyle('html:not([data-theme="dark"]) .tiptap .fancyCodePre .tok-const', {
  color: '#0550ae',
  fontWeight: 600
});
globalStyle('html:not([data-theme="dark"]) .tiptap pre .tok-builtin', {
  color: '#0f766e'
});
globalStyle('html:not([data-theme="dark"]) .tiptap .fancyCodePre .tok-builtin', {
  color: '#0f766e'
});
globalStyle('html:not([data-theme="dark"]) .tiptap pre .tok-type', {
  color: '#0f766e',
  fontWeight: 600
});
globalStyle('html:not([data-theme="dark"]) .tiptap .fancyCodePre .tok-type', {
  color: '#0f766e',
  fontWeight: 600
});
globalStyle('html:not([data-theme="dark"]) .tiptap pre .tok-tag', {
  color: '#9a6700',
  fontWeight: 650
});
globalStyle('html:not([data-theme="dark"]) .tiptap .fancyCodePre .tok-tag', {
  color: '#9a6700',
  fontWeight: 650
});
globalStyle('html:not([data-theme="dark"]) .tiptap pre .tok-attr', {
  color: '#1f6feb'
});
globalStyle('html:not([data-theme="dark"]) .tiptap .fancyCodePre .tok-attr', {
  color: '#1f6feb'
});

globalStyle('html[data-theme="dark"] .tiptap pre .tok-comment', {
  color: `color-mix(in srgb, ${vars.color.muted} 88%, transparent)`,
  fontStyle: 'italic'
});
globalStyle('html[data-theme="dark"] .tiptap .fancyCodePre .tok-comment', {
  color: `color-mix(in srgb, ${vars.color.muted} 88%, transparent)`,
  fontStyle: 'italic'
});
globalStyle('html[data-theme="dark"] .tiptap pre .tok-keyword', {
  color: `color-mix(in srgb, ${vars.color.accent} 82%, #ffffff)`,
  fontWeight: 650
});
globalStyle('html[data-theme="dark"] .tiptap .fancyCodePre .tok-keyword', {
  color: `color-mix(in srgb, ${vars.color.accent} 82%, #ffffff)`,
  fontWeight: 650
});
globalStyle('html[data-theme="dark"] .tiptap pre .tok-string', {
  color: '#7ee787'
});
globalStyle('html[data-theme="dark"] .tiptap .fancyCodePre .tok-string', {
  color: '#7ee787'
});
globalStyle('html[data-theme="dark"] .tiptap pre .tok-number', {
  color: '#ffa657'
});
globalStyle('html[data-theme="dark"] .tiptap .fancyCodePre .tok-number', {
  color: '#ffa657'
});
globalStyle('html[data-theme="dark"] .tiptap pre .tok-const', {
  color: '#79c0ff',
  fontWeight: 600
});
globalStyle('html[data-theme="dark"] .tiptap .fancyCodePre .tok-const', {
  color: '#79c0ff',
  fontWeight: 600
});
globalStyle('html[data-theme="dark"] .tiptap pre .tok-builtin', {
  color: '#56d4dd'
});
globalStyle('html[data-theme="dark"] .tiptap .fancyCodePre .tok-builtin', {
  color: '#56d4dd'
});
globalStyle('html[data-theme="dark"] .tiptap pre .tok-type', {
  color: '#56d4dd',
  fontWeight: 600
});
globalStyle('html[data-theme="dark"] .tiptap .fancyCodePre .tok-type', {
  color: '#56d4dd',
  fontWeight: 600
});
globalStyle('html[data-theme="dark"] .tiptap pre .tok-tag', {
  color: '#f2cc60',
  fontWeight: 650
});
globalStyle('html[data-theme="dark"] .tiptap .fancyCodePre .tok-tag', {
  color: '#f2cc60',
  fontWeight: 650
});
globalStyle('html[data-theme="dark"] .tiptap pre .tok-attr', {
  color: '#79c0ff'
});
globalStyle('html[data-theme="dark"] .tiptap .fancyCodePre .tok-attr', {
  color: '#79c0ff'
});

globalStyle('.tiptap blockquote', {
  position: 'relative',
  margin: '0 0 16px',
  padding: 0,
  borderRadius: vars.radius.md,
  border: `1px solid color-mix(in srgb, ${vars.color.accent} 16%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.accent} 5%, ${vars.color.card})`,
  color: vars.color.fg,
  boxShadow: `0 10px 26px rgba(2,6,23,.10)`
});

globalStyle('html[data-theme="dark"] .tiptap blockquote', {
  background: `color-mix(in srgb, ${vars.color.accent} 8%, ${vars.color.card})`,
  boxShadow: `0 18px 44px rgba(0,0,0,.32)`
});

globalStyle('.tiptap blockquote.calloutBlockquote', {
  display: 'grid',
  gridTemplateColumns: '34px minmax(0, 1fr)',
  gap: 10,
  alignItems: 'start',
  padding: '10px 14px'
});

// Align the emoji to the first line's center (Notion-like).
globalStyle('.calloutIconWrap', {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  height: '1.55em'
});

globalStyle('.calloutIconBtn', {
  appearance: 'none',
  WebkitAppearance: 'none',
  border: 0,
  padding: 0,
  background: 'transparent',
  color: vars.color.fg,
  cursor: 'pointer',
  width: 28,
  height: 28,
  display: 'grid',
  placeItems: 'center'
});

globalStyle('.calloutIconBtn:disabled', { cursor: 'default', opacity: 0.9 });

globalStyle('.calloutIconGlyph', {
  width: 18,
  height: 18,
  display: 'grid',
  placeItems: 'center',
  lineHeight: 1
});

globalStyle('.calloutIconGlyph svg', {
  width: 18,
  height: 18,
  display: 'block'
});

globalStyle('.calloutBody', { minWidth: 0 });

globalStyle('.calloutIconMenu', {
  position: 'absolute',
  left: 0,
  top: 32,
  zIndex: 5,
  minWidth: 170,
  padding: 8,
  borderRadius: 14,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 14%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 92%, transparent)`,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: `0 18px 60px rgba(2,6,23,.18)`
});

globalStyle('html[data-theme=\"dark\"] .calloutIconMenu', {
  background: 'rgba(0,0,0,.55)',
  border: '1px solid rgba(255,255,255,.14)',
  boxShadow: `0 22px 70px rgba(0,0,0,.45)`
});

globalStyle('.calloutIconItem', {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: '26px minmax(0, 1fr)',
  alignItems: 'center',
  gap: 10,
  borderRadius: 12,
  border: 0,
  padding: '8px 10px',
  background: 'transparent',
  color: vars.color.fg,
  cursor: 'pointer',
  textAlign: 'left'
});

globalStyle('.calloutIconItem:hover', {
  background: `color-mix(in srgb, ${vars.color.fg} 8%, transparent)`
});

globalStyle('.calloutIconItem.active', {
  background: `color-mix(in srgb, ${vars.color.accent} 12%, transparent)`
});

globalStyle('.calloutIconItemGlyph', { width: 16, height: 16, display: 'grid', placeItems: 'center', lineHeight: 1 });
globalStyle('.calloutIconItemGlyph svg', { width: 16, height: 16, display: 'block' });
globalStyle('.calloutIconItemLabel', { fontSize: 12, color: vars.color.muted, fontWeight: 650 });

// Reduce the "extra bottom whitespace" caused by default paragraph/list margins inside blockquotes.
globalStyle('.tiptap blockquote p', { margin: '0 0 10px' });
globalStyle('.tiptap blockquote p:last-child', { marginBottom: 0 });
globalStyle('.tiptap blockquote ul, .tiptap blockquote ol', { margin: '0 0 10px' });
globalStyle('.tiptap blockquote ul:last-child, .tiptap blockquote ol:last-child', { marginBottom: 0 });

globalStyle('.timeline', { display: 'grid', gap: 10 });

globalStyle('.timelineItem', {
  position: 'relative',
  paddingLeft: 14
});

globalStyle('.timelineItem::before', {
  content: '""',
  position: 'absolute',
  left: 0,
  top: 20,
  width: 8,
  height: 8,
  borderRadius: 999,
  background: vars.color.accent,
  transition: `background-color ${vars.motion.slow} ease`
});

const fadeUp = keyframes({
  '0%': { opacity: 0, transform: 'translateY(10px) scale(.985)', filter: 'blur(10px)' },
  '60%': { opacity: 1, transform: 'translateY(-2px) scale(1.005)', filter: 'blur(0px)' },
  '100%': { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' }
});

const shimmer = keyframes({
  '0%': { transform: 'translateX(-40%)', opacity: 0 },
  '15%': { opacity: 0.35 },
  '55%': { opacity: 0.18 },
  '100%': { transform: 'translateX(40%)', opacity: 0 }
});

globalStyle('.enter', {
  animation: `${fadeUp} ${vars.motion.slow} cubic-bezier(0.16, 1, 0.3, 1) both`,
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none'
    }
  }
});

// Smooth image reveal to avoid "pop-in" during route changes / async media resolving.
globalStyle('.imgSmooth', {
  opacity: 0,
  transform: 'translateY(4px) scale(.992)',
  // Avoid animating blur on large images (it is expensive and causes jank on big photos).
  transition: `opacity ${vars.motion.normal} ease, transform ${vars.motion.slow} cubic-bezier(0.16, 1, 0.3, 1)`,
  willChange: 'opacity, transform'
});

globalStyle('.imgSmooth[data-loaded="true"]', {
  opacity: 1,
  transform: 'translateY(0) scale(1)'
});

// Thumbs: keep bg blurred even after load (it's a glow layer).
globalStyle('.thumbBg.imgSmooth', {
  filter: 'blur(18px)',
  transform: 'scale(1.02)'
});

globalStyle('.thumbBg.imgSmooth[data-loaded="true"]', {
  filter: 'blur(18px)',
  transform: 'scale(1.05)',
  opacity: 1
});

globalStyle('.thumbFg.imgSmooth', {});
globalStyle('.thumbFg.imgSmooth[data-loaded="true"]', {});

globalStyle('.imgSmooth, .imgSmooth[data-loaded="true"]', {
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transform: 'none',
      transition: `opacity ${vars.motion.fast} ease`
    }
  }
});

globalStyle('.galleryGrid', {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: 14
});

globalStyle('.galleryCol', { gridColumn: 'span 4' });

globalStyle('.galleryCol', {
  '@media': {
    'screen and (max-width: 980px)': { gridColumn: 'span 6' },
    'screen and (max-width: 620px)': { gridColumn: 'span 12' }
  }
});

globalStyle('.galleryThumb', {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: vars.radius.md,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.fg} 6%, ${vars.color.card})`,
  height: 220,
  padding: 0,
  cursor: 'pointer',
  textAlign: 'left',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  display: 'grid',
  placeItems: 'center'
});

globalStyle('.galleryThumb img', {
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  filter: 'contrast(1.02) saturate(0.98)',
  transition: `transform ${vars.motion.normal} ease, filter ${vars.motion.normal} ease`
});

globalStyle('.galleryThumb:hover img', {
  transform: 'translateY(-1px)',
  filter: 'contrast(1.06) saturate(1.02)'
});

globalStyle('.galleryOverlay', {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  alignContent: 'end',
  padding: 12,
  background: 'linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,0))',
  opacity: 0,
  transition: `opacity ${vars.motion.normal} ease`
});

globalStyle('html[data-theme="dark"] .galleryOverlay', {
  background: 'linear-gradient(to top, rgba(0,0,0,.72), rgba(0,0,0,0))'
});

globalStyle('html:not([data-theme="dark"]) .galleryOverlay', {
  // Keep thumb text readable in light mode too (white text on a dark scrim).
  background: 'linear-gradient(to top, rgba(0,0,0,.62), rgba(0,0,0,0))'
});

globalStyle('.galleryThumb:hover .galleryOverlay', { opacity: 1 });

globalStyle('.galleryTitle', { color: '#fff', fontWeight: 600 });

globalStyle('html[data-page="gallery"] .container', { maxWidth: '100%', padding: 0 });

globalStyle('html[data-page="gallery"] main', {
  // `vh` can be larger than the visible viewport on some browsers (address bar / zoom / UI),
  // which can make bottom content feel "clipped". Prefer dynamic viewport units when supported.
  minHeight: '100vh',
  '@supports': {
    '(height: 100dvh)': { minHeight: '100dvh' }
  }
});

globalStyle('.galleryExhibit', {
  position: 'relative',
  minHeight: '100vh',
  '@supports': {
    '(height: 100dvh)': { minHeight: '100dvh' }
  },
  padding: '0 22px 36px',
  color: '#e7edf7',
  background: [
    'radial-gradient(1200px circle at 20% 10%, rgba(99,102,241,.18), transparent 60%)',
    'radial-gradient(900px circle at 78% 18%, rgba(34,197,94,.10), transparent 60%)',
    'radial-gradient(1000px circle at 50% 92%, rgba(56,189,248,.10), transparent 65%)',
    'linear-gradient(180deg, rgba(3,6,12,.92), rgba(3,6,12,.92))'
  ].join(', '),
  overflowX: 'hidden',
  overflowY: 'clip',
  '@media': {
    'screen and (max-width: 620px)': { padding: '0 14px 28px' }
  }
});

globalStyle('html:not([data-theme="dark"]) .galleryExhibit', {
  color: vars.color.fg,
  background: [
    'radial-gradient(1200px circle at 20% 10%, rgba(47,111,235,.10), transparent 62%)',
    'radial-gradient(900px circle at 78% 18%, rgba(34,197,94,.06), transparent 64%)',
    'radial-gradient(1000px circle at 50% 92%, rgba(56,189,248,.06), transparent 66%)',
    `linear-gradient(180deg, color-mix(in srgb, ${vars.color.bg} 92%, #ffffff), ${vars.color.bg})`
  ].join(', ')
});

globalStyle('html[data-page="gallery"], html[data-page="gallery"] body', {
  overflowX: 'hidden'
});

globalStyle('.galleryExhibit::before', {
  content: '""',
  position: 'fixed',
  inset: -1,
  pointerEvents: 'none',
  background: `radial-gradient(900px circle at calc(var(--bg-mx, 0.5) * 100%) calc(var(--bg-my, 0.5) * 100%), rgba(255,255,255,.10), transparent 62%)`,
  opacity: 0.85,
  mixBlendMode: 'screen',
  transform: 'translateZ(0)'
});

globalStyle('html:not([data-theme="dark"]) .galleryExhibit::before', {
  background: `radial-gradient(900px circle at calc(var(--bg-mx, 0.5) * 100%) calc(var(--bg-my, 0.5) * 100%), rgba(15,23,42,.10), transparent 62%)`,
  opacity: 0.35,
  mixBlendMode: 'multiply'
});

globalStyle('.exhibitTopbar', {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  gap: 12,
  position: 'sticky',
  top: 0,
  zIndex: 2,
  margin: '0 -22px 0',
  paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
  paddingLeft: 'calc(22px + env(safe-area-inset-left, 0px))',
  paddingRight: 'calc(22px + env(safe-area-inset-right, 0px))',
  paddingBottom: 12,
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  background: 'linear-gradient(180deg, rgba(3,6,12,.88), rgba(3,6,12,.52), rgba(3,6,12,0))'
  ,
  '@media': {
    'screen and (max-width: 620px)': {
      margin: '0 -14px 0',
      paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
      paddingLeft: 'calc(14px + env(safe-area-inset-left, 0px))',
      paddingRight: 'calc(14px + env(safe-area-inset-right, 0px))',
      paddingBottom: 12
    }
  }
});

globalStyle('html:not([data-theme="dark"]) .exhibitTopbar', {
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.bg} 92%, #ffffff), color-mix(in srgb, ${vars.color.bg} 70%, transparent), rgba(255,255,255,0))`
});

globalStyle('.exhibitTopActions', {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
  flexWrap: 'nowrap',
  '@media': {
    'screen and (max-width: 620px)': {
      justifyContent: 'flex-start',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      paddingBottom: 4
    }
  }
});

globalStyle('.exhibitTopActions::-webkit-scrollbar', { display: 'none' });

globalStyle('.exhibitTopTitle', {
  '@media': {
    'screen and (max-width: 520px)': { display: 'none' }
  }
});

globalStyle('.exhibitBack', {
  appearance: 'none',
  WebkitAppearance: 'none',
  display: 'inline-flex',
  justifySelf: 'start',
  alignItems: 'center',
  justifyContent: 'center',
  height: 34,
  padding: '0 12px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,.14)',
  background: 'rgba(255,255,255,.06)',
  color: '#e7edf7',
  textDecoration: 'none',
  cursor: 'pointer',
  fontSize: 12,
  letterSpacing: '0.02em',
  transition: `transform ${vars.motion.fast} ease, background-color ${vars.motion.normal} ease, border-color ${vars.motion.normal} ease`
});

globalStyle('html:not([data-theme="dark"]) .exhibitBack', {
  borderColor: `color-mix(in srgb, ${vars.color.border} 70%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 82%, transparent)`,
  color: vars.color.fg
});

globalStyle('.exhibitExit', {
  borderColor: 'rgba(255,255,255,.22)',
  background: 'rgba(255,255,255,.10)'
});

globalStyle('html:not([data-theme="dark"]) .exhibitExit', {
  borderColor: `color-mix(in srgb, ${vars.color.border} 86%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 92%, transparent)`
});

globalStyle('.exhibitBack:hover', {
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      transform: 'translateY(-1px)',
      background: 'rgba(255,255,255,.10)',
      borderColor: 'rgba(255,255,255,.18)',
      color: '#fff'
    }
  }
});

globalStyle('html:not([data-theme="dark"]) .exhibitBack:hover', {
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      background: `color-mix(in srgb, ${vars.color.card} 96%, transparent)`,
      borderColor: vars.color.border,
      color: vars.color.fg
    }
  }
});

globalStyle('.exhibitAddOverlay', {
  position: 'fixed',
  inset: 0,
  zIndex: 80,
  background: 'rgba(0,0,0,.62)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  display: 'grid',
  placeItems: 'start center',
  paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
  paddingLeft: 'calc(16px + env(safe-area-inset-left, 0px))',
  paddingRight: 'calc(16px + env(safe-area-inset-right, 0px))',
  paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))',
  overflowY: 'auto',
  overscrollBehaviorY: 'contain'
});

globalStyle('.exhibitAddPanel', {
  width: 'min(760px, 96vw)',
  maxHeight: 'none',
  overflow: 'visible',
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,.14)',
  background: 'linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.04))',
  boxShadow: '0 38px 120px rgba(0,0,0,.55)',
  padding: 14
});

globalStyle('.exhibitAddPanel', {
  scrollbarWidth: 'none'
});

globalStyle('.exhibitAddPanel::-webkit-scrollbar', {
  display: 'none'
});

globalStyle('.exhibitAddPanel input[type="file"]', {
  maxWidth: '100%',
  width: '100%',
  boxSizing: 'border-box'
});

globalStyle('.galleryExhibit .exhibitAddPanel', {
  borderColor: 'rgba(255,255,255,.18)',
  background: 'linear-gradient(180deg, rgba(15,23,42,.86), rgba(2,6,23,.72))',
  color: '#e7edf7'
});

globalStyle('html:not([data-theme="dark"]) .galleryExhibit .exhibitAddPanel', {
  borderColor: vars.color.border,
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 86%, #ffffff), ${vars.color.card})`,
  color: vars.color.fg
});

globalStyle('.galleryExhibit .muted', { color: 'rgba(231,237,247,.72)' });

globalStyle('html:not([data-theme="dark"]) .galleryExhibit .muted', { color: vars.color.muted });

globalStyle('.galleryExhibit .pill', {
  color: 'rgba(255,255,255,.92)',
  borderColor: 'rgba(255,255,255,.22)',
  background: 'rgba(255,255,255,.08)'
});

globalStyle('html:not([data-theme="dark"]) .galleryExhibit .pill', {
  color: vars.color.fg,
  borderColor: vars.color.border,
  background: `color-mix(in srgb, ${vars.color.card} 84%, transparent)`
});

globalStyle('.galleryExhibit .input, .galleryExhibit .textarea, .galleryExhibit .select', {
  borderColor: 'rgba(255,255,255,.16)',
  background: 'rgba(0,0,0,.24)',
  color: '#e7edf7'
});

globalStyle('html:not([data-theme="dark"]) .galleryExhibit .input, html:not([data-theme="dark"]) .galleryExhibit .textarea, html:not([data-theme="dark"]) .galleryExhibit .select', {
  borderColor: vars.color.border,
  background: vars.color.bg,
  color: vars.color.fg
});

globalStyle('.galleryExhibit .input::placeholder, .galleryExhibit .textarea::placeholder', {
  color: 'rgba(231,237,247,.52)'
});

globalStyle('html:not([data-theme="dark"]) .galleryExhibit .input::placeholder, html:not([data-theme="dark"]) .galleryExhibit .textarea::placeholder', {
  color: `color-mix(in srgb, ${vars.color.muted} 78%, transparent)`
});

globalStyle('.galleryExhibit .btn', {
  borderColor: 'rgba(255,255,255,.18)',
  background: 'rgba(255,255,255,.08)',
  color: '#fff'
});

globalStyle('html:not([data-theme="dark"]) .galleryExhibit .btn', {
  borderColor: vars.color.border,
  background: vars.color.card,
  color: vars.color.fg
});

globalStyle('.galleryExhibit .btn:hover', {
  borderColor: 'rgba(255,255,255,.24)',
  background: 'rgba(255,255,255,.11)'
});

globalStyle('html:not([data-theme="dark"]) .galleryExhibit .btn:hover', {
  borderColor: `color-mix(in srgb, ${vars.color.border} 100%, #000000)`,
  background: `color-mix(in srgb, ${vars.color.card} 92%, #ffffff)`
});

globalStyle('.galleryExhibit .btn.danger', {
  borderColor: 'rgba(248,113,113,.55)',
  color: '#fff',
  background: 'rgba(248,113,113,.14)'
});

globalStyle('html:not([data-theme="dark"]) .galleryExhibit .btn.danger', {
  borderColor: `color-mix(in srgb, ${vars.color.danger} 55%, ${vars.color.border})`,
  color: vars.color.danger,
  background: `color-mix(in srgb, ${vars.color.danger} 12%, transparent)`
});

globalStyle('.galleryExhibit .btn.danger:hover', {
  borderColor: 'rgba(248,113,113,.70)',
  background: 'rgba(248,113,113,.18)'
});

globalStyle('html:not([data-theme="dark"]) .galleryExhibit .btn.danger:hover', {
  borderColor: `color-mix(in srgb, ${vars.color.danger} 70%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.danger} 16%, transparent)`
});

globalStyle('.galleryExhibit .btn.primary', {
  background: 'rgba(56,189,248,.88)',
  borderColor: 'transparent',
  color: '#02121d'
});

globalStyle('html:not([data-theme="dark"]) .galleryExhibit .btn.primary', {
  background: vars.color.accent,
  borderColor: 'transparent',
  color: '#ffffff'
});

globalStyle('.galleryExhibit .btn.primary:hover', {
  background: 'rgba(56,189,248,.98)'
});

globalStyle('html:not([data-theme="dark"]) .galleryExhibit .btn.primary:hover', {
  background: `color-mix(in srgb, ${vars.color.accent} 92%, #000000)`
});

// Reusable dropzone (gallery overrides exist, but other pages can reuse the same markup).
globalStyle('.dropZone', {
  borderRadius: 14,
  border: '1px dashed rgba(255,255,255,.22)',
  background: 'rgba(0,0,0,.18)',
  padding: 14,
  display: 'grid',
  gap: 8,
  minHeight: 118,
  cursor: 'pointer',
  userSelect: 'none',
  transition: `border-color ${vars.motion.normal} ease, background-color ${vars.motion.normal} ease, transform ${vars.motion.fast} ease`
});

// Resume editor dropzones: more explicit affordance than the default dropzone.
globalStyle('.resumeDropzone.dropZone', {
  padding: 12,
  minHeight: 92,
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 80%, transparent), color-mix(in srgb, ${vars.color.card} 96%, transparent))`,
  borderColor: `color-mix(in srgb, ${vars.color.accent} 28%, rgba(255,255,255,.22))`,
  boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${vars.color.accent} 14%, transparent)`
});

globalStyle('html:not([data-theme="dark"]) .resumeDropzone.dropZone', {
  borderColor: `color-mix(in srgb, ${vars.color.accent} 26%, ${vars.color.border})`,
  background: `linear-gradient(180deg, #ffffff, color-mix(in srgb, ${vars.color.card} 92%, #ffffff))`,
  boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${vars.color.accent} 10%, transparent)`
});

globalStyle('.resumeDropzone.dropZone .dropZoneLabel', { fontSize: 12 });

globalStyle('.resumeDropzone.dropZone .dropZoneBody', {
  flexDirection: 'column',
  alignItems: 'stretch'
});

globalStyle('.resumeDropzone.dropZone .dropZonePreview', {
  width: '100%',
  display: 'flex',
  justifyContent: 'center'
});

globalStyle('.resumeDropzone.dropZone .dropZoneText', {
  textAlign: 'center',
  justifyItems: 'center'
});

globalStyle('.dropZoneBody', { display: 'flex', gap: 10, alignItems: 'center' });
globalStyle('.dropZonePreview', { flex: '0 0 auto' });
globalStyle('.dropZonePreviewInner', { maxWidth: '100%', minWidth: 0 });
globalStyle('.dropZoneText', { minWidth: 0, display: 'grid', gap: 2 });
globalStyle('.dropZoneLabel', { fontSize: 13, fontWeight: 750, letterSpacing: '-0.01em' });
globalStyle('.dropZoneHint', { fontSize: 12 });

globalStyle('.dropZoneBadge', {
  fontSize: 11,
  padding: '4px 8px',
  borderRadius: 999,
  border: `1px solid color-mix(in srgb, ${vars.color.accent} 22%, rgba(255,255,255,.18))`,
  background: `color-mix(in srgb, ${vars.color.accent} 12%, transparent)`,
  color: `color-mix(in srgb, ${vars.color.accent} 88%, #ffffff)`,
  letterSpacing: '0.02em'
});

globalStyle('html:not([data-theme="dark"]) .dropZoneBadge', {
  borderColor: `color-mix(in srgb, ${vars.color.accent} 24%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.accent} 10%, #ffffff)`,
  color: `color-mix(in srgb, ${vars.color.accent} 88%, #0b1220)`
});

globalStyle('html:not([data-theme="dark"]) .dropZone', {
  border: `1px dashed ${vars.color.border}`,
  background: `color-mix(in srgb, ${vars.color.card} 70%, transparent)`
});

globalStyle('.dropZone:hover', {
  transform: 'translateY(-1px)',
  borderColor: 'rgba(255,255,255,.30)',
  background: 'rgba(0,0,0,.22)'
});

globalStyle('html:not([data-theme="dark"]) .dropZone:hover', {
  borderColor: `color-mix(in srgb, ${vars.color.border} 100%, #000000)`,
  background: `color-mix(in srgb, ${vars.color.card} 84%, transparent)`
});

globalStyle('.dropZone.active', {
  borderColor: 'rgba(56,189,248,.70)',
  background: 'rgba(56,189,248,.12)'
});

globalStyle('html:not([data-theme="dark"]) .dropZone.active', {
  borderColor: `color-mix(in srgb, ${vars.color.accent} 70%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.accent} 12%, transparent)`
});

globalStyle('.dropZone.disabled', { cursor: 'not-allowed', opacity: 0.6 });

globalStyle('.galleryExhibit .dropZone', {
  borderRadius: 14,
  border: '1px dashed rgba(255,255,255,.22)',
  background: 'rgba(0,0,0,.18)',
  padding: 14,
  display: 'grid',
  gap: 8,
  minHeight: 118,
  cursor: 'pointer',
  userSelect: 'none',
  transition: `border-color ${vars.motion.normal} ease, background-color ${vars.motion.normal} ease, transform ${vars.motion.fast} ease`
});

globalStyle('html:not([data-theme="dark"]) .galleryExhibit .dropZone', {
  border: `1px dashed ${vars.color.border}`,
  background: `color-mix(in srgb, ${vars.color.card} 70%, transparent)`
});

globalStyle('.galleryExhibit .dropZone:hover', {
  transform: 'translateY(-1px)',
  borderColor: 'rgba(255,255,255,.30)',
  background: 'rgba(0,0,0,.22)'
});

globalStyle('html:not([data-theme="dark"]) .galleryExhibit .dropZone:hover', {
  borderColor: `color-mix(in srgb, ${vars.color.border} 100%, #000000)`,
  background: `color-mix(in srgb, ${vars.color.card} 84%, transparent)`
});

globalStyle('.galleryExhibit .dropZone.active', {
  borderColor: 'rgba(56,189,248,.70)',
  background: 'rgba(56,189,248,.12)'
});

globalStyle('html:not([data-theme="dark"]) .galleryExhibit .dropZone.active', {
  borderColor: `color-mix(in srgb, ${vars.color.accent} 70%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.accent} 12%, transparent)`
});

globalStyle('.exhibitTopTitle', {
  fontSize: 12,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  opacity: 0.7,
  justifySelf: 'center',
  textAlign: 'center',
  pointerEvents: 'none',
  userSelect: 'none'
});

globalStyle('.exhibitHero', { padding: '18px 0 18px' });

globalStyle('.exhibitTitle', {
  margin: 0,
  fontSize: 54,
  lineHeight: 1.03,
  letterSpacing: '-0.03em'
});

globalStyle('.exhibitSubtitle', {
  margin: '10px 0 0',
  color: 'rgba(231,237,247,.74)',
  maxWidth: 760
});

globalStyle('html:not([data-theme="dark"]) .exhibitSubtitle', {
  color: `color-mix(in srgb, ${vars.color.fg} 70%, ${vars.color.muted})`
});

globalStyle('.exhibitLayout', {
  display: 'grid',
  gridTemplateColumns: '340px minmax(0, 1fr)',
  gap: 18,
  '@media': {
    'screen and (max-width: 980px)': { gridTemplateColumns: 'minmax(0, 1fr)' }
  }
});

globalStyle('.exhibitAside', {
  gridColumn: 1,
  position: 'sticky',
  top: 60,
  alignSelf: 'start',
  display: 'grid',
  gap: 10,
  padding: 16,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,.12)',
  background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))',
  boxShadow: '0 28px 80px rgba(0,0,0,.44)',
  '@media': {
    'screen and (max-width: 980px)': {
      gridColumn: 'auto',
      position: 'relative',
      top: 'auto'
    }
  }
});

globalStyle('html:not([data-theme="dark"]) .exhibitAside', {
  border: `1px solid ${vars.color.border}`,
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 96%, #ffffff), ${vars.color.card})`,
  boxShadow: '0 28px 80px rgba(2,6,23,.10)'
});

globalStyle('.exhibitAside .pill', {
  borderColor: 'rgba(255,255,255,.16)',
  background: 'rgba(255,255,255,.06)',
  color: 'rgba(231,237,247,.72)'
});

globalStyle('html:not([data-theme="dark"]) .exhibitAside .pill', {
  borderColor: vars.color.border,
  background: '#ffffff',
  color: vars.color.muted
});

globalStyle('.exhibitAside .btn', {
  borderColor: 'rgba(255,255,255,.18)'
});

globalStyle('html:not([data-theme="dark"]) .exhibitAside .btn', {
  borderColor: vars.color.border
});

globalStyle('.exhibitAside .btn.primary', {
  color: '#ffffff',
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.accent} 30%, rgba(255,255,255,.08)), rgba(255,255,255,.10))`,
  borderColor: `color-mix(in srgb, ${vars.color.accent} 35%, rgba(255,255,255,.18))`,
  boxShadow: `0 18px 44px rgba(0,0,0,.36), 0 1px 0 rgba(255,255,255,.10) inset`,
  transition: `transform ${vars.motion.fast} ease, background-color ${vars.motion.normal} ease, border-color ${vars.motion.normal} ease, box-shadow ${vars.motion.normal} ease`
});

globalStyle('.exhibitAside .btn.primary:hover', {
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      transform: 'translateY(-1px)',
      background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.accent} 42%, rgba(255,255,255,.08)), rgba(255,255,255,.12))`,
      borderColor: `color-mix(in srgb, ${vars.color.accent} 48%, rgba(255,255,255,.20))`,
      boxShadow: `0 22px 56px rgba(0,0,0,.42), 0 1px 0 rgba(255,255,255,.10) inset`
    }
  }
});

globalStyle('html:not([data-theme="dark"]) .exhibitAside .btn.primary', {
  background: vars.color.accent,
  borderColor: 'transparent',
  color: '#ffffff'
});

globalStyle('.exhibitWorkTitle', { margin: '2px 0 0', fontSize: 22, letterSpacing: '-0.02em' });

globalStyle('.exhibitIntent', { margin: 0, color: 'rgba(231,237,247,.78)', lineHeight: 1.7 });

globalStyle('html:not([data-theme="dark"]) .exhibitIntent', {
  color: `color-mix(in srgb, ${vars.color.fg} 72%, ${vars.color.muted})`
});

globalStyle('.exhibitMetaGrid', {
  marginTop: 6,
  display: 'grid',
  gridTemplateColumns: '72px minmax(0, 1fr)',
  gap: '4px 10px',
  fontSize: 12,
  color: 'rgba(231,237,247,.72)'
});

globalStyle('html:not([data-theme="dark"]) .exhibitMetaGrid', {
  color: vars.color.muted
});

globalStyle('.exhibitMetaKey', {
  opacity: 0.85
});

globalStyle('.exhibitMetaVal', {
  minWidth: 0,
  color: 'rgba(231,237,247,.92)'
});

globalStyle('html:not([data-theme="dark"]) .exhibitMetaVal', {
  color: vars.color.fg
});

globalStyle('.exhibitMetaNote', {
  whiteSpace: 'pre-wrap',
  lineHeight: 1.55
});

globalStyle('.exhibitWall', {
  gridColumn: 2,
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: 14,
  alignItems: 'start',
  paddingBottom: 22
});

globalStyle('.justifiedGrid', { gridColumn: 'span 12', display: 'grid', gap: 10 });

globalStyle('.justifiedRow', {
  display: 'flex',
  alignItems: 'stretch',
  width: '100%',
  minWidth: 0,
  overflowX: 'hidden'
});

globalStyle('.justifiedItem', {
  appearance: 'none',
  WebkitAppearance: 'none',
  border: 0,
  padding: 0,
  margin: 0,
  background: 'transparent',
  color: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  position: 'relative',
  borderRadius: 14,
  overflow: 'hidden',
  transform: 'translateZ(0)',
  // Performance: reduce work for off-screen items in big photo grids.
  contentVisibility: 'auto',
  containIntrinsicSize: '320px 240px',
  contain: 'layout paint',
  transition: `transform ${vars.motion.normal} ease, filter ${vars.motion.normal} ease`
});

globalStyle('.justifiedItem:hover', {
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      transform: 'translateY(-2px)',
      filter: 'drop-shadow(0 28px 70px rgba(0,0,0,.52))'
    }
  }
});

globalStyle('html:not([data-theme="dark"]) .justifiedItem:hover', {
  // Light mode: softer shadow so the hover feels intentional (not muddy).
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      filter: 'drop-shadow(0 18px 44px rgba(2,6,23,.16))'
    }
  }
});

globalStyle('.justifiedMat', {
  width: '100%',
  height: '100%',
  borderRadius: 14,
  overflow: 'hidden',
  // Use an inset shadow instead of `border` so we don't shrink the content box
  // (borders can create unwanted extra letterbox space for `object-fit: contain` images).
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.14)',
  background: 'rgba(0,0,0,.32)',
  display: 'grid',
  placeItems: 'center'
});

globalStyle('html:not([data-theme="dark"]) .justifiedMat', {
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 92%, #ffffff), ${vars.color.card})`,
  // Add a subtle highlight without affecting layout.
  boxShadow: `inset 0 0 0 1px ${vars.color.border}, 0 1px 0 rgba(255,255,255,.55) inset`
});

globalStyle('html:not([data-theme="dark"]) .justifiedItem:hover .justifiedMat, html:not([data-theme="dark"]) .justifiedItem:focus-visible .justifiedMat', {
  boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${vars.color.accent} 22%, ${vars.color.border}), 0 18px 40px rgba(2,6,23,.10)`
});

globalStyle('.justifiedMat img', {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block',
  filter: 'contrast(1.02) saturate(0.98)',
  transition: `transform ${vars.motion.normal} ease, filter ${vars.motion.normal} ease`
});

globalStyle('html:not([data-theme="dark"]) .justifiedMat img', {
  // Light mode: avoid the image looking "dimmer" because the mat is light.
  filter: 'contrast(1.02) saturate(1.02)'
});

globalStyle('.justifiedItem:hover .justifiedMat img', {
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      transform: 'scale(1.01)',
      filter: 'contrast(1.05) saturate(1.02)'
    }
  }
});

globalStyle('.justifiedCaption', {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  padding: '10px 10px 9px',
  fontSize: 12,
  color: 'rgba(231,237,247,.92)',
  background: 'linear-gradient(to top, rgba(0,0,0,.72), rgba(0,0,0,0))',
  opacity: 0,
  transform: 'translateY(2px)',
  transition: `opacity ${vars.motion.normal} ease, transform ${vars.motion.normal} ease`
});

globalStyle('html:not([data-theme="dark"]) .justifiedCaption', {
  color: vars.color.fg,
  background: 'linear-gradient(to top, rgba(255,255,255,.92), rgba(255,255,255,0))',
  borderTop: `1px solid color-mix(in srgb, ${vars.color.border} 75%, transparent)`,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)'
});

// Profile / Portfolio
globalStyle('.profilePage', {
  display: 'grid',
  gap: 14
});

globalStyle('.profileCoverFrame', {
  width: '100%',
  borderRadius: 18,
  overflow: 'hidden',
  border: `1px solid ${vars.color.border}`,
  background: 'rgba(0,0,0,.18)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.10)',
  display: 'grid',
  placeItems: 'center'
});

globalStyle('html:not([data-theme="dark"]) .profileCoverFrame', {
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 92%, #ffffff), ${vars.color.card})`,
  boxShadow: `inset 0 0 0 1px ${vars.color.border}, 0 1px 0 rgba(255,255,255,.55) inset`
});

globalStyle('.profileCoverImg', {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block'
});

globalStyle('.profileCv', {
  display: 'grid',
  gridTemplateColumns: '300px minmax(0, 1fr)',
  gap: 14,
  alignItems: 'start',
  '@media': {
    'screen and (max-width: 980px)': { gridTemplateColumns: 'minmax(0, 1fr)' }
  }
});

globalStyle('.profileSidebar', {
  position: 'sticky',
  // Keep it clearly below the fixed/sticky app header (nav), with some breathing room.
  top: 'calc(88px + env(safe-area-inset-top, 0px) + 12px)',
  alignSelf: 'start',
  '@media': {
    'screen and (max-width: 980px)': { position: 'static', top: 'auto' }
  }
});

globalStyle('.profileSidebarCard', {
  padding: 14,
  borderRadius: 18,
  border: `1px solid ${vars.color.border}`,
  background: vars.color.card
});

globalStyle('.profileSidebarName', {
  fontSize: 18,
  fontWeight: 850,
  letterSpacing: '-0.02em'
});

globalStyle('.profileSidebarHeadline', {
  marginTop: 10,
  color: vars.color.muted,
  lineHeight: 1.55
});

globalStyle('.profileSidebarTitle', {
  fontSize: 12,
  color: vars.color.muted,
  letterSpacing: '0.10em',
  textTransform: 'uppercase'
});

globalStyle('.profileSidebarList', {
  marginTop: 8,
  display: 'grid',
  gap: 8
});

globalStyle('.profileSidebarItem', {
  display: 'grid',
  gridTemplateColumns: '72px minmax(0, 1fr)',
  gap: 10,
  fontSize: 13
});

globalStyle('.profileSidebarKey', { color: vars.color.muted, fontSize: 12 });
globalStyle('.profileSidebarVal', { color: vars.color.fg, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' });

globalStyle('.profileMain', { minWidth: 0, display: 'grid', gap: 12 });

globalStyle('.profileCallout', {
  padding: 14,
  borderRadius: 18,
  border: `1px solid ${vars.color.border}`,
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 88%, transparent), color-mix(in srgb, ${vars.color.card} 70%, transparent))`,
  boxShadow: '0 18px 60px rgba(0,0,0,.10)'
});

globalStyle('html:not([data-theme="dark"]) .profileCallout', {
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 92%, #ffffff), ${vars.color.card})`,
  boxShadow: '0 18px 60px rgba(2,6,23,.06)'
});

globalStyle('.profileCalloutTitle', { fontWeight: 850, letterSpacing: '-0.01em' });
globalStyle('.profileCalloutBody', { marginTop: 10, color: vars.color.muted, lineHeight: 1.65, whiteSpace: 'pre-wrap' });

globalStyle('.profileWorkList', { display: 'grid', gap: 12, marginTop: 12 });

globalStyle('.profileWorkItem', {
  display: 'grid',
  gridTemplateColumns: '80px minmax(0, 1fr)',
  gap: 12,
  padding: 14,
  borderRadius: 18,
  border: `1px solid ${vars.color.border}`,
  background: `color-mix(in srgb, ${vars.color.card} 82%, transparent)`,
  '@media': {
    'screen and (max-width: 620px)': { gridTemplateColumns: 'minmax(0, 1fr)' }
  }
});

globalStyle('.profileWorkLeft', {
  display: 'grid',
  alignContent: 'start',
  gap: 10,
  '@media': { 'screen and (max-width: 620px)': { gridTemplateColumns: 'auto 1fr', alignItems: 'center' } }
});

globalStyle('.profileWorkLogoFrame', {
  borderRadius: 16,
  overflow: 'hidden',
  background: 'rgba(0,0,0,.22)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.10)',
  display: 'grid',
  placeItems: 'center',
  width: 72
});

globalStyle('html:not([data-theme="dark"]) .profileWorkLogoFrame', {
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 92%, #ffffff), ${vars.color.card})`,
  boxShadow: `inset 0 0 0 1px ${vars.color.border}, 0 1px 0 rgba(255,255,255,.55) inset`
});

globalStyle('.profileWorkLogoImg', { width: '100%', height: '100%', objectFit: 'contain', display: 'block' });

globalStyle('.profileWorkLogoFallback', {
  width: 72,
  height: 72,
  borderRadius: 16,
  display: 'grid',
  placeItems: 'center',
  background: `color-mix(in srgb, ${vars.color.accent} 16%, transparent)`,
  border: `1px solid color-mix(in srgb, ${vars.color.accent} 28%, ${vars.color.border})`,
  color: vars.color.fg,
  fontWeight: 900,
  letterSpacing: '-0.02em'
});

globalStyle('.profileWorkRight', { minWidth: 0 });
globalStyle('.profileWorkOrg', { fontWeight: 880, letterSpacing: '-0.01em' });
globalStyle('.profileWorkTitle', { marginTop: 4, color: vars.color.muted, fontSize: 13 });

// Editor-only: logo preview inside /profile/edit
globalStyle('.profileWorkLogoPreviewFrame', {
  borderRadius: 14,
  overflow: 'hidden',
  border: `1px solid ${vars.color.border}`,
  background: 'rgba(0,0,0,.18)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.10)',
  display: 'grid',
  placeItems: 'center'
});

globalStyle('html:not([data-theme="dark"]) .profileWorkLogoPreviewFrame', {
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 92%, #ffffff), ${vars.color.card})`,
  boxShadow: `inset 0 0 0 1px ${vars.color.border}, 0 1px 0 rgba(255,255,255,.55) inset`
});

globalStyle('.profileWorkLogoPreviewImg', { width: '100%', height: '100%', objectFit: 'contain', display: 'block' });

globalStyle('.profileHero', {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 260px',
  gap: 14,
  alignItems: 'start',
  padding: 16,
  borderRadius: 18,
  border: `1px solid ${vars.color.border}`,
  background: vars.color.card,
  '@media': {
    'screen and (max-width: 820px)': {
      gridTemplateColumns: 'minmax(0, 1fr)'
    }
  }
});

globalStyle('.profileHeroMain', {
  minWidth: 0
});

globalStyle('.profileName', {
  margin: 0,
  fontSize: 44,
  lineHeight: 1.05,
  letterSpacing: '-0.03em',
  '@media': { 'screen and (max-width: 520px)': { fontSize: 34 } }
});

globalStyle('.profileHeadline', {
  marginTop: 8,
  fontSize: 16,
  color: vars.color.muted,
  maxWidth: 920
});

globalStyle('.profileSkills', {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap'
});

globalStyle('.profileFacts', {
  borderRadius: 14,
  border: `1px solid ${vars.color.border}`,
  background: `color-mix(in srgb, ${vars.color.card} 78%, transparent)`,
  overflow: 'hidden'
});

globalStyle('.profileFactRow', {
  display: 'grid',
  gridTemplateColumns: '140px minmax(0, 1fr)',
  gap: 10,
  padding: '10px 12px',
  borderTop: `1px solid ${vars.color.border}`,
  '@media': {
    'screen and (max-width: 520px)': { gridTemplateColumns: 'minmax(0, 1fr)' }
  }
});

globalStyle('.profileFactRow:first-child', { borderTop: 'none' });

globalStyle('.profileFactLabel', { fontSize: 12, color: vars.color.muted, letterSpacing: '-0.01em' });

globalStyle('.profileFactValue', { fontSize: 13, color: vars.color.fg, whiteSpace: 'pre-wrap' });

globalStyle('.profileHeroPhoto', {
  justifySelf: 'end',
  '@media': {
    'screen and (max-width: 820px)': {
      justifySelf: 'start'
    }
  }
});

globalStyle('.profilePhotoFrame', {
  width: 'min(260px, 72vw)',
  borderRadius: 18,
  overflow: 'hidden',
  background: 'rgba(0,0,0,.22)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.12)',
  display: 'grid',
  placeItems: 'center'
});

globalStyle('html:not([data-theme="dark"]) .profilePhotoFrame', {
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 92%, #ffffff), ${vars.color.card})`,
  boxShadow: `inset 0 0 0 1px ${vars.color.border}, 0 1px 0 rgba(255,255,255,.55) inset`
});

globalStyle('.profilePhotoImg', {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block'
});

globalStyle('.profileGrid', {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: 12
});

globalStyle('.profileSection', {
  padding: 14
});

globalStyle('.profileSectionTitle', {
  fontWeight: 780,
  letterSpacing: '-0.01em'
});

globalStyle('.profileSectionBody', {
  marginTop: 10,
  color: vars.color.muted,
  lineHeight: 1.65,
  whiteSpace: 'pre-wrap'
});

globalStyle('.profileList', {
  margin: '10px 0 0',
  paddingLeft: 18,
  color: vars.color.muted,
  lineHeight: 1.65
});

// Resume (LinkedIn-ish) entries: awards / education with optional logos.
globalStyle('.resumeEntryList', {
  marginTop: 12,
  display: 'grid',
  gap: 12
});

globalStyle('.resumeEntry', {
  display: 'grid',
  gridTemplateColumns: '64px minmax(0, 1fr)',
  gap: 12,
  padding: 14,
  borderRadius: 18,
  border: `1px solid ${vars.color.border}`,
  background: `color-mix(in srgb, ${vars.color.card} 82%, transparent)`,
  '@media': {
    'screen and (max-width: 620px)': { gridTemplateColumns: 'minmax(0, 1fr)' }
  }
});

globalStyle('.resumeMediaEntry', {
  gridTemplateColumns: '152px minmax(0, 1fr)',
  '@media': {
    'screen and (max-width: 620px)': { gridTemplateColumns: 'minmax(0, 1fr)' }
  }
});

globalStyle('.resumeEntryLogo', {
  width: 56,
  height: 56,
  borderRadius: 14,
  overflow: 'hidden',
  background: 'rgba(0,0,0,.22)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.10)',
  display: 'grid',
  placeItems: 'center'
});

globalStyle('html:not([data-theme="dark"]) .resumeEntryLogo', {
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 92%, #ffffff), ${vars.color.card})`,
  boxShadow: `inset 0 0 0 1px ${vars.color.border}, 0 1px 0 rgba(255,255,255,.55) inset`
});

globalStyle('.resumeEntryLogo img', { width: '100%', height: '100%', objectFit: 'contain', display: 'block' });

globalStyle('.resumeMediaBtn', { border: 0, padding: 0, margin: 0, background: 'transparent', cursor: 'zoom-in' });
globalStyle('.resumeMediaBtn:disabled', { cursor: 'not-allowed' });

globalStyle('.resumeMediaFrame', {
  width: 136,
  height: 104,
  borderRadius: 16,
  overflow: 'hidden',
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 12%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.fg} 6%, ${vars.color.card})`,
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)',
  display: 'grid',
  placeItems: 'center'
});

globalStyle('html:not([data-theme="dark"]) .resumeMediaFrame', {
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 92%, #ffffff), ${vars.color.card})`,
  boxShadow: `inset 0 0 0 1px ${vars.color.border}, 0 1px 0 rgba(255,255,255,.55) inset`
});

globalStyle('.resumeMediaImg', { width: '100%', height: '100%', objectFit: 'contain', display: 'block' });

globalStyle('.resumeEntryLogoFallback', {
  width: '100%',
  height: '100%',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 850,
  color: vars.color.muted,
  letterSpacing: '-0.02em'
});

globalStyle('.resumeEntryBody', { minWidth: 0 });

globalStyle('.resumeEntryTop', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 10,
  flexWrap: 'wrap'
});

globalStyle('.resumeEntryTitle', {
  fontWeight: 860,
  letterSpacing: '-0.01em'
});

globalStyle('.profileProjects', {
  padding: 14
});

globalStyle('.projectEntry', {
  gridTemplateColumns: '152px minmax(0, 1fr)',
  cursor: 'pointer',
  transition: `transform ${vars.motion.fast} ease, border-color ${vars.motion.normal} ease, background-color ${vars.motion.normal} ease`,
  '@media': {
    'screen and (max-width: 620px)': { gridTemplateColumns: 'minmax(0, 1fr)' }
  }
});

globalStyle('.projectEntry:hover', {
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      transform: 'translateY(-1px)',
      borderColor: `color-mix(in srgb, ${vars.color.accent} 20%, ${vars.color.border})`,
      background: `color-mix(in srgb, ${vars.color.card} 88%, transparent)`
    }
  }
});

globalStyle('.projectMediaBtn', { border: 0, padding: 0, margin: 0, background: 'transparent', cursor: 'zoom-in' });
globalStyle('.projectMediaBtn:disabled', { cursor: 'not-allowed' });

globalStyle('.projectMediaFrame', {
  width: 136,
  height: 104,
  borderRadius: 16,
  overflow: 'hidden',
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 12%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.fg} 6%, ${vars.color.card})`,
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)',
  display: 'grid',
  placeItems: 'center'
});

globalStyle('html:not([data-theme="dark"]) .projectMediaFrame', {
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 92%, #ffffff), ${vars.color.card})`,
  boxShadow: `inset 0 0 0 1px ${vars.color.border}, 0 1px 0 rgba(255,255,255,.55) inset`
});

globalStyle('.projectMediaImg', { width: '100%', height: '100%', objectFit: 'cover', display: 'block' });

globalStyle('.projectCard', {
  padding: 14,
  borderRadius: 18,
  border: `1px solid ${vars.color.border}`,
  background: `color-mix(in srgb, ${vars.color.card} 82%, transparent)`
});

globalStyle('.projectTitle', {
  fontSize: 18,
  fontWeight: 820,
  letterSpacing: '-0.015em'
});

globalStyle('.projectExcerpt', {
  marginTop: 10,
  whiteSpace: 'pre-wrap',
  lineHeight: 1.7,
  display: '-webkit-box',
  WebkitLineClamp: 3 as any,
  WebkitBoxOrient: 'vertical' as any,
  overflow: 'hidden'
});

globalStyle('.projectModalOverlay', {
  position: 'fixed',
  inset: 0,
  zIndex: 70,
  background: 'color-mix(in srgb, rgba(0,0,0,.48) 72%, transparent)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  display: 'grid',
  placeItems: 'center',
  padding: 16
});

globalStyle('.projectModal', {
  width: 'min(980px, 100%)',
  maxHeight: 'min(860px, calc(var(--vvh, 100vh) - 28px))',
  borderRadius: vars.radius.lg,
  border: `1px solid rgba(255,255,255,.14)`,
  background: `linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 70%, transparent)`,
  boxShadow: `0 34px 120px rgba(0,0,0,.36)`,
  overflow: 'hidden',
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)'
});

globalStyle('html[data-theme=\"dark\"] .projectModal', {
  borderColor: 'rgba(255,255,255,.10)',
  background: `linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 60%, transparent)`
});

globalStyle('.projectModalTop', {
  padding: 14,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  borderBottom: `1px solid color-mix(in srgb, ${vars.color.border} 70%, transparent)`
});

globalStyle('.projectModalTitle', { fontSize: 20, fontWeight: 860, letterSpacing: '-0.02em' });

globalStyle('.projectModalBody', { padding: 14, overflow: 'auto' });

globalStyle('.projectModalHero', {
  borderRadius: 18,
  overflow: 'hidden',
  border: `1px solid ${vars.color.border}`,
  background: 'rgba(0,0,0,.18)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.10)'
});

globalStyle('html:not([data-theme=\"dark\"]) .projectModalHero', {
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 92%, #ffffff), ${vars.color.card})`,
  boxShadow: `inset 0 0 0 1px ${vars.color.border}, 0 1px 0 rgba(255,255,255,.55) inset`
});

globalStyle('.projectModalHeroBtn', { border: 0, padding: 0, margin: 0, width: '100%', background: 'transparent', cursor: 'zoom-in' });
globalStyle('.projectModalHeroImg', { width: '100%', height: 320, objectFit: 'cover', display: 'block' });
globalStyle('.projectModalHeroImg', { '@media': { 'screen and (max-width: 620px)': { height: 220 } } });

// Profile editor helpers
globalStyle('.profileEditGrid', {
  display: 'grid',
  gridTemplateColumns: '360px minmax(0, 1fr)',
  gap: 12,
  '@media': {
    'screen and (max-width: 980px)': { gridTemplateColumns: 'minmax(0, 1fr)' }
  }
});

globalStyle('.profileEditLeft, .profileEditRight', { display: 'grid', gap: 12 });

// (removed) resumeQuickNav: was a "Jump" section in the resume editor.

// Resume editor: accordion entries for better scanability.
globalStyle('.resumeEditEntry', {
  borderRadius: 18,
  border: `1px solid ${vars.color.border}`,
  background: `color-mix(in srgb, ${vars.color.card} 82%, transparent)`,
  overflow: 'hidden'
});

globalStyle('.resumeEditSummary', {
  listStyle: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: 12,
  cursor: 'pointer',
  userSelect: 'none'
});

globalStyle('.resumeEditSummary::-webkit-details-marker', { display: 'none' });

globalStyle('.resumeEditSummaryMain', { minWidth: 0, flex: 1 });
globalStyle('.resumeEditSummaryTitle', { fontWeight: 820, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
globalStyle('.resumeEditSummaryMeta', { fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });

globalStyle('.resumeEditEntry[open] .resumeEditSummary', {
  borderBottom: `1px solid color-mix(in srgb, ${vars.color.border} 70%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 92%, transparent)`
});

globalStyle('.resumeEditDetails', { padding: 12 });

globalStyle('.resumeSaveBar', {
  position: 'sticky',
  bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
  zIndex: 15,
  marginTop: 16
});

globalStyle('.resumeSaveBarInner', {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  flexWrap: 'wrap',
  padding: 10,
  borderRadius: 18,
  border: `1px solid ${vars.color.border}`,
  background: `color-mix(in srgb, ${vars.color.card} 88%, transparent)`,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: '0 18px 50px rgba(0,0,0,.18)'
});

globalStyle('html:not([data-theme="dark"]) .resumeSaveBarInner', {
  background: `color-mix(in srgb, ${vars.color.card} 92%, #ffffff)`,
  boxShadow: `0 10px 30px rgba(2,6,23,.06)`
});

globalStyle('html:not([data-theme="dark"]) .resumeSaveBarInner .btn.primary', {
  background: `color-mix(in srgb, ${vars.color.accent} 92%, #0b1220)`,
  borderColor: `color-mix(in srgb, ${vars.color.accent} 64%, #0b1220)`,
  boxShadow: `0 12px 26px color-mix(in srgb, ${vars.color.accent} 32%, transparent), 0 1px 0 rgba(255,255,255,.35) inset`
});

globalStyle('html:not([data-theme="dark"]) .resumeSaveBarInner .btn.primary:hover', {
  background: `color-mix(in srgb, ${vars.color.accent} 96%, #0b1220)`
});

globalStyle('.resumeEditor', {
  // Make room for the sticky/floating save bar so the last fields don't get covered.
  paddingBottom: 96
});

globalStyle('.profileMediaGrid', {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  '@media': {
    'screen and (max-width: 640px)': { gridTemplateColumns: 'minmax(0, 1fr)' }
  }
});

globalStyle('.profileMediaFrame', {
  borderRadius: 14,
  overflow: 'hidden',
  background: 'rgba(0,0,0,.18)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.10)',
  display: 'grid',
  placeItems: 'center'
});

globalStyle('html:not([data-theme="dark"]) .profileMediaFrame', {
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.color.card} 92%, #ffffff), ${vars.color.card})`,
  boxShadow: `inset 0 0 0 1px ${vars.color.border}, 0 1px 0 rgba(255,255,255,.55) inset`
});

globalStyle('.profileMediaImg', { width: '100%', height: '100%', objectFit: 'contain', display: 'block' });

globalStyle('.profileWorkLogoFrame', {
  '@media': {
    'screen and (max-width: 620px)': { width: 64, height: 64 }
  }
});

globalStyle('.profileWorkLogoFallback', {
  '@media': {
    'screen and (max-width: 620px)': { width: 64, height: 64 }
  }
});

globalStyle('.profileWorkLogoBtn', {
  border: 0,
  padding: 0,
  margin: 0,
  background: 'transparent',
  cursor: 'zoom-in'
});

globalStyle('.justifiedPin', {
  position: 'absolute',
  top: 10,
  left: 10,
  zIndex: 1,
  display: 'grid',
  placeItems: 'center',
  width: 30,
  height: 30,
  borderRadius: 999,
  color: '#fff',
  background: 'rgba(0,0,0,.46)',
  border: '1px solid rgba(255,255,255,.18)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: '0 14px 30px rgba(0,0,0,.38)'
});

globalStyle('html:not([data-theme="dark"]) .justifiedPin', {
  color: vars.color.fg,
  background: `color-mix(in srgb, ${vars.color.card} 82%, #ffffff)`,
  border: `1px solid ${vars.color.border}`,
  boxShadow: '0 14px 30px rgba(2,6,23,.12)'
});

globalStyle('.justifiedPin svg', { width: 14, height: 14, display: 'block' });

globalStyle('.justifiedItem:focus-visible .justifiedCaption', {
  opacity: 1,
  transform: 'translateY(0)'
});

globalStyle('.justifiedItem:hover .justifiedCaption', {
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      opacity: 1,
      transform: 'translateY(0)'
    }
  }
});

globalStyle('.exhibitFrame', {
  gridColumn: 'span 4',
  appearance: 'none',
  WebkitAppearance: 'none',
  border: '0',
  padding: 0,
  background: 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  color: 'inherit',
  transform:
    'perspective(1000px) rotateY(calc((var(--bg-mx, 0.5) - 0.5) * 2.4deg)) rotateX(calc((var(--bg-my, 0.5) - 0.5) * -1.6deg)) translateZ(0)',
  transition: `transform ${vars.motion.normal} ease, filter ${vars.motion.normal} ease`,
  filter: 'drop-shadow(0 28px 70px rgba(0,0,0,.46))',
  '@media': {
    'screen and (max-width: 980px)': { gridColumn: 'span 6' },
    'screen and (max-width: 620px)': { gridColumn: 'span 12' }
  }
});

globalStyle('.exhibitFrame:hover', {
  transform:
    'perspective(1000px) rotateY(calc((var(--bg-mx, 0.5) - 0.5) * 3.2deg)) rotateX(calc((var(--bg-my, 0.5) - 0.5) * -2.2deg)) translateY(-4px) translateZ(0)',
  filter: 'drop-shadow(0 40px 96px rgba(0,0,0,.52))'
});

globalStyle('.exhibitFrame[data-active="true"] .exhibitFrameInner', {
  outline: `2px solid color-mix(in srgb, ${vars.color.accent} 44%, transparent)`
});

globalStyle('.exhibitFrameInner', {
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,.14)',
  background: 'linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.03))',
  padding: 12,
  outlineOffset: 2
});

globalStyle('.exhibitMat', {
  borderRadius: 14,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,.10)',
  background: 'rgba(0,0,0,.32)',
  aspectRatio: '4 / 3',
  display: 'grid',
  placeItems: 'center'
});

globalStyle('.exhibitMat img', {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block',
  filter: 'contrast(1.02) saturate(0.98)'
});

globalStyle('.exhibitEmpty', { color: 'rgba(231,237,247,.60)', fontSize: 12 });

globalStyle('.exhibitLabel', { marginTop: 10, display: 'grid', gap: 2 });

globalStyle('.exhibitLabelTitle', { fontWeight: 680, letterSpacing: '-0.01em' });

globalStyle('.exhibitLabelMeta', { fontSize: 12, color: 'rgba(231,237,247,.62)' });

globalStyle('.heroCard', {
  gridColumn: 'span 12',
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 58%, transparent)`,
  borderRadius: vars.radius.lg,
  padding: '22px',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: `0 22px 60px rgba(0,0,0,.10), 0 1px 0 rgba(255,255,255,.22) inset`
});

globalStyle('.heroCard', { position: 'relative', overflow: 'hidden' });

globalStyle('.heroCard::before', {
  content: '""',
  position: 'absolute',
  inset: -2,
  background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${vars.color.accent} 30%, transparent), transparent)`,
  filter: 'blur(12px)',
  opacity: 0.16,
  animation: `${shimmer} 12s ease-in-out infinite`,
  pointerEvents: 'none',
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none'
    }
  }
});

globalStyle('.heroTop', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  flexWrap: 'wrap'
});

globalStyle('.heroKicker', { fontSize: 12, color: vars.color.muted });

globalStyle('.heroActions', { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' });
globalStyle('.heroActions .btn', { whiteSpace: 'nowrap' });
globalStyle('.heroActions', {
  '@media': {
    'screen and (max-width: 980px)': { justifyContent: 'flex-start' },
    'screen and (max-width: 620px)': {
      width: '100%',
      flexWrap: 'nowrap',
      overflowX: 'auto',
      paddingBottom: 4,
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none'
    }
  }
});
globalStyle('.heroActions::-webkit-scrollbar', { display: 'none' });

globalStyle('.heroTitle', { margin: '12px 0 0', letterSpacing: '-0.04em', fontSize: 44, lineHeight: 1.12 });

globalStyle('.heroSubtitle', { margin: '12px 0 0', color: vars.color.muted, maxWidth: 760 });

globalStyle('.heroMedia', {
  marginTop: 16,
  height: 190,
  borderRadius: vars.radius.md,
  overflow: 'hidden',
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 12%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.fg} 6%, ${vars.color.card})`
});

globalStyle('.heroMedia', {
  '@media': {
    'screen and (max-width: 620px)': { height: 160 }
  }
});

globalStyle('.heroMedia .carousel, .heroMedia .carouselScroller, .heroMedia .carouselSlide, .heroMediaSlide', {
  height: '100%'
});

globalStyle('.heroDropZone', {
  borderRadius: vars.radius.md,
  border: `1px dashed color-mix(in srgb, ${vars.color.fg} 18%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 70%, transparent)`,
  padding: 10,
  cursor: 'pointer',
  transition: 'background 140ms ease, border-color 140ms ease, transform 140ms ease'
});

globalStyle('.heroDropZone.disabled', {
  cursor: 'not-allowed',
  opacity: 0.7
});

globalStyle('.heroDropZone.dragging', {
  borderColor: `color-mix(in srgb, ${vars.color.accent} 45%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.accent} 10%, ${vars.color.card})`,
  transform: 'scale(1.01)'
});

globalStyle('.heroDropZone:focus-visible', {
  outline: `2px solid color-mix(in srgb, ${vars.color.accent} 55%, transparent)`,
  outlineOffset: 2
});

globalStyle('.heroDropHeader', {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  padding: '2px 2px 10px'
});

globalStyle('.heroDropTitle', { fontSize: 13, fontWeight: 650, letterSpacing: '-0.01em' });

globalStyle('.heroDropHint', { fontSize: 12, marginTop: 4, lineHeight: 1.35 });

globalStyle('.heroDropMeta', { fontSize: 12, whiteSpace: 'nowrap', paddingTop: 2, opacity: 0.9 });

globalStyle('.heroCropGrid', {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 10
});

globalStyle('.heroCropGrid', {
  '@media': {
    'screen and (max-width: 620px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }
  }
});

globalStyle('.heroCropItem', { position: 'relative', minWidth: 0 });

globalStyle('.heroCropFrame', {
  height: 90,
  borderRadius: 12,
  overflow: 'hidden',
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 12%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.fg} 6%, ${vars.color.card})`
});

globalStyle('.heroCropRemove', {
  position: 'absolute',
  top: 6,
  right: 6,
  width: 26,
  height: 26
});

globalStyle('.heroCropBadge', {
  position: 'absolute',
  left: 8,
  bottom: 8,
  fontSize: 11,
  padding: '4px 8px',
  borderRadius: 999,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 14%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 78%, transparent)`,
  color: vars.color.fg,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)'
});

globalStyle('.heroEditor .input', { width: '100%' });

globalStyle('.heroStats', {
  marginTop: 18,
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 12,
  borderTop: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  paddingTop: 14
});

globalStyle('.stat', {
  padding: '10px 12px',
  borderRadius: vars.radius.md,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 40%, transparent)`,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)'
});
globalStyle('.statValue', { fontWeight: 700, letterSpacing: '-0.02em' });
globalStyle('.statLabel', { marginTop: 6, fontSize: 12, color: vars.color.muted });

globalStyle('.categoryCard', {
  gridColumn: 'span 6',
  appearance: 'none',
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 54%, transparent)`,
  borderRadius: vars.radius.lg,
  padding: '18px',
  cursor: 'pointer',
  textAlign: 'left',
  color: vars.color.fg,
  fontFamily: 'inherit',
  fontSize: 'inherit',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  transition: `border-color ${vars.motion.normal} ease, box-shadow ${vars.motion.normal} ease, transform ${vars.motion.fast} ease`
});

globalStyle('.categoryCard', { position: 'relative', overflow: 'hidden' });

globalStyle('.categoryCard::before', {
  content: '""',
  position: 'absolute',
  inset: -1,
  background: `radial-gradient(900px circle at 20% 10%, color-mix(in srgb, ${vars.color.accent} 16%, transparent) 0%, transparent 55%)`,
  opacity: 0,
  transition: `opacity ${vars.motion.normal} ease`,
  pointerEvents: 'none'
});

globalStyle('.categoryCard:hover::before', {
  '@media': { '(hover: hover) and (pointer: fine)': { opacity: 1 } }
});

globalStyle('.categoryCard:hover', {
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      borderColor: `color-mix(in srgb, ${vars.color.accent} 28%, ${vars.color.border})`,
      boxShadow: `0 18px 46px rgba(0,0,0,.10), 0 1px 0 rgba(255,255,255,.22) inset`,
      transform: 'translateY(-1px)'
    }
  }
});

globalStyle('.categoryCard:focus-visible', {
  borderColor: `color-mix(in srgb, ${vars.color.accent} 28%, ${vars.color.border})`,
  boxShadow: `0 18px 46px rgba(0,0,0,.10), 0 1px 0 rgba(255,255,255,.22) inset`
});

globalStyle('.categoryCard:active', { transform: 'translateY(0)' });

globalStyle('.albumMasonry', {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 14,
  alignItems: 'start'
});

globalStyle('.albumListItem', {
  display: 'grid',
  gridTemplateColumns: '170px minmax(0, 1fr)',
  gap: 14,
  padding: 12,
  borderRadius: vars.radius.lg,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 56%, transparent)`,
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  transition: `border-color ${vars.motion.normal} ease, transform ${vars.motion.fast} ease, background-color ${vars.motion.normal} ease`,
  textDecoration: 'none',
  color: 'inherit',
  '@media': {
    'screen and (max-width: 720px)': { gridTemplateColumns: '1fr' }
  }
});

globalStyle('html:not([data-theme="dark"]) .albumListItem', {
  background: `linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 84%, #ffffff)`
});

globalStyle('.albumListItem:hover', {
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      transform: 'translateY(-1px)',
      borderColor: `color-mix(in srgb, ${vars.color.fg} 14%, transparent)`,
      background: `color-mix(in srgb, ${vars.color.card} 64%, transparent)`
    }
  }
});

globalStyle('.albumListThumb', {
  height: 118,
  borderRadius: vars.radius.md,
  overflow: 'hidden',
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.card} 46%, transparent)`,
  display: 'grid',
  placeItems: 'center'
});

globalStyle('.albumListThumb img', { width: '100%', height: '100%', objectFit: 'contain', display: 'block' });

globalStyle('.albumListBody', { minWidth: 0, display: 'grid', alignContent: 'start', gap: 8 });
globalStyle('.albumListTitleRow', { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' });
globalStyle('.albumListTitle', { fontWeight: 800, letterSpacing: '-0.015em' });
globalStyle('.albumListDesc', { marginTop: 0, fontSize: 13, lineHeight: 1.32 });

globalStyle('.albumItem', {
  width: '100%',
  display: 'block',
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  textAlign: 'left'
});

globalStyle('.albumThumb', {
  position: 'relative',
  height: 220,
  borderRadius: vars.radius.md,
  overflow: 'hidden',
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.fg} 6%, ${vars.color.card})`,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  display: 'grid',
  placeItems: 'center'
});

globalStyle('.albumItem img', {
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  transition: `transform ${vars.motion.normal} ease, filter ${vars.motion.normal} ease`
});

globalStyle('.albumItem:hover img', { transform: 'translateY(-1px)', filter: 'contrast(1.04) saturate(1.01)' });

globalStyle('.albumOverlay', {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  alignContent: 'end',
  padding: 12,
  background: 'linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,0))',
  opacity: 0,
  transition: `opacity ${vars.motion.normal} ease`
});

globalStyle('html[data-theme="dark"] .albumOverlay', {
  background: 'linear-gradient(to top, rgba(0,0,0,.72), rgba(0,0,0,0))'
});

globalStyle('.albumItem:hover .albumOverlay', { opacity: 1 });

globalStyle('.albumTitle', { color: '#fff', fontWeight: 600, fontSize: 12 });

// Album editor: manage photos inside the editor page (not on the viewer page).
globalStyle('.albumEditGrid', {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: 14,
  alignItems: 'start'
});

globalStyle('.albumEditCard', {
  borderRadius: vars.radius.lg,
  border: `1px solid color-mix(in srgb, ${vars.color.fg} 10%, transparent)`,
  background: `linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 54%, transparent)`,
  padding: 12,
  boxSizing: 'border-box'
});

globalStyle('html:not([data-theme="dark"]) .albumEditCard', {
  background: `linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,0)), color-mix(in srgb, ${vars.color.card} 84%, #ffffff)`
});

globalStyle('.albumEditCard.isRemoved', {
  opacity: 0.7,
  borderColor: `color-mix(in srgb, ${vars.color.danger} 38%, ${vars.color.border})`
});

globalStyle('.lightbox', {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  background: 'rgba(0,0,0,.62)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  display: 'grid',
  placeItems: 'center',
  paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
  paddingLeft: 'calc(16px + env(safe-area-inset-left, 0px))',
  paddingRight: 'calc(16px + env(safe-area-inset-right, 0px))',
  paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))'
});

globalStyle('.lightboxPanel', {
  // Keep a platform-stable panel size (desktop stays consistent) and only shrink when space is insufficient.
  // This makes the letterbox behavior consistent across image aspect ratios and browser zoom levels.
  width: 'min(1400px, calc(100vw - 32px))',
  height: 'min(920px, calc(var(--vvh, 100vh) - 32px))',
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)',
  gap: 10,
  borderRadius: vars.radius.lg,
  border: '1px solid rgba(255,255,255,.12)',
  background: 'rgba(0,0,0,.28)',
  boxShadow: `0 30px 100px rgba(0,0,0,.40)`,
  overflow: 'hidden'
});

globalStyle('html:not([data-theme="dark"]) .lightboxPanel', {
  borderColor: `color-mix(in srgb, ${vars.color.fg} 12%, transparent)`,
  background: `color-mix(in srgb, ${vars.color.bg} 92%, #ffffff)`,
  boxShadow: `0 30px 100px rgba(2,6,23,.22)`
});

globalStyle('.lightboxTop', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  color: '#fff',
  padding: 12
});

globalStyle('html:not([data-theme="dark"]) .lightboxTop', {
  color: vars.color.fg
});

globalStyle('.lightboxIndex', { fontSize: 12, opacity: 0.85 });

globalStyle('html:not([data-theme="dark"]) .lightboxIndex', {
  opacity: 1,
  color: vars.color.muted
});

globalStyle('.lightboxBody', {
  display: 'grid',
  gridTemplateRows: 'minmax(0, 1fr) auto',
  alignContent: 'stretch',
  justifyItems: 'stretch',
  gap: 10,
  padding: 12,
  minHeight: 0,
  minWidth: 0
});

globalStyle('.lightboxContent', {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 320px',
  gap: 12,
  minHeight: 0,
  minWidth: 0,
  height: '100%',
  '@media': {
    'screen and (max-width: 860px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gridTemplateRows: 'minmax(0, 1fr) auto'
    }
  }
});

globalStyle('.lightboxStage', {
  display: 'grid',
  placeItems: 'center',
  width: '100%',
  height: '100%',
  // Prevent padding from causing the stage to overflow its grid cell (common cause of bottom clipping).
  boxSizing: 'border-box',
  minWidth: 0,
  minHeight: 0,
  // No extra padding: let the image use the full available height; letterbox is handled by the frame background.
  padding: 0,
  cursor: 'zoom-out',
  borderRadius: vars.radius.lg
});

globalStyle('.lightboxFrame', {
  width: '100%',
  height: '100%',
  minWidth: 0,
  minHeight: 0,
  boxSizing: 'border-box',
  borderRadius: vars.radius.lg,
  border: '1px solid rgba(255,255,255,.14)',
  // Solid black so portrait images read as letterboxed (side bars).
  background: '#000',
  position: 'relative',
  // Avoid percent/padding rounding issues at certain zoom levels by using a fixed inset on the image instead.
  padding: 0,
  overflow: 'hidden'
});

globalStyle('html:not([data-theme="dark"]) .lightboxFrame', {
  borderColor: `color-mix(in srgb, ${vars.color.fg} 14%, transparent)`,
  // White letterbox for light mode.
  background: '#fff'
});

globalStyle('.lightboxImg', {
  // Hard guarantee: the image element itself is always inside the frame (no overflow -> nothing to clip).
  position: 'absolute',
  // Keep the safety inset minimal so "perfect fit" images don't look like they have extra padding.
  inset: 1,
  width: 'calc(100% - 2px)',
  height: 'calc(100% - 2px)',
  objectFit: 'contain',
  objectPosition: 'center',
  display: 'block',
  borderRadius: vars.radius.md,
  border: '0',
  background: 'transparent'
});

globalStyle('.mediaPreviewFrame', {
  borderRadius: 14,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,.14)',
  background: '#000',
  position: 'relative'
});

globalStyle('html:not([data-theme="dark"]) .mediaPreviewFrame', {
  borderColor: `color-mix(in srgb, ${vars.color.fg} 14%, transparent)`,
  background: '#fff'
});

globalStyle('.mediaPreviewImg', {
  position: 'absolute',
  inset: 1,
  width: 'calc(100% - 2px)',
  height: 'calc(100% - 2px)',
  objectFit: 'contain',
  objectPosition: 'center',
  display: 'block',
  borderRadius: 12,
  border: 0,
  background: 'transparent'
});

globalStyle('.lightboxCaption', { color: '#fff', fontSize: 12, opacity: 0.9, maxWidth: 'min(980px, 92vw)' });

globalStyle('html:not([data-theme="dark"]) .lightboxCaption', {
  color: vars.color.fg,
  opacity: 0.9
});

globalStyle('.lightboxMeta', {
  minWidth: 0,
  minHeight: 0,
  borderRadius: vars.radius.lg,
  border: '1px solid rgba(255,255,255,.14)',
  background: 'rgba(0,0,0,.10)',
  padding: 12,
  color: '#fff',
  display: 'grid',
  gap: 10,
  alignContent: 'start',
  boxSizing: 'border-box',
  '@media': {
    'screen and (max-width: 860px)': {
      order: 2
    }
  }
});

globalStyle('html:not([data-theme="dark"]) .lightboxMeta', {
  borderColor: vars.color.border,
  background: `color-mix(in srgb, ${vars.color.card} 88%, #ffffff)`,
  color: vars.color.fg
});

globalStyle('.lightboxMetaGrid', {
  marginTop: 2,
  display: 'grid',
  gridTemplateColumns: '72px minmax(0, 1fr)',
  gap: '6px 10px',
  fontSize: 12,
  color: 'rgba(255,255,255,.74)'
});

globalStyle('html:not([data-theme="dark"]) .lightboxMetaGrid', {
  color: vars.color.muted
});

globalStyle('.lightboxMetaKey', {
  opacity: 0.9
});

globalStyle('.lightboxMetaVal', {
  minWidth: 0,
  color: 'rgba(255,255,255,.92)'
});

globalStyle('html:not([data-theme="dark"]) .lightboxMetaVal', {
  color: vars.color.fg
});

globalStyle('.lightboxMetaNote', {
  whiteSpace: 'pre-wrap',
  lineHeight: 1.55
});

globalStyle('.lightboxMeta .pill', {
  color: 'rgba(255,255,255,.92)',
  borderColor: 'rgba(255,255,255,.22)',
  background: 'rgba(255,255,255,.08)'
});

globalStyle('html:not([data-theme="dark"]) .lightboxMeta .pill', {
  color: vars.color.muted,
  borderColor: vars.color.border,
  background: '#fff'
});

globalStyle('.lightboxMeta .muted', { color: 'rgba(255,255,255,.74)' });

globalStyle('html:not([data-theme="dark"]) .lightboxMeta .muted', { color: vars.color.muted });

globalStyle('.lightboxMetaTitle', {
  fontSize: 22,
  fontWeight: 780,
  letterSpacing: '-0.02em',
  lineHeight: 1.25
});

globalStyle('.lightboxMetaIntent', {
  fontSize: 15,
  lineHeight: 1.7,
  color: 'rgba(255,255,255,.82)'
});

globalStyle('html:not([data-theme="dark"]) .lightboxMetaIntent', {
  color: `color-mix(in srgb, ${vars.color.fg} 74%, ${vars.color.muted})`
});

globalStyle('.lightboxTop .btn', {
  borderRadius: 999,
  padding: '8px 10px',
  background: 'rgba(255,255,255,.08)',
  borderColor: 'rgba(255,255,255,.18)'
});

globalStyle('html:not([data-theme="dark"]) .lightboxTop .btn', {
  background: `color-mix(in srgb, ${vars.color.card} 86%, #ffffff)`,
  borderColor: `color-mix(in srgb, ${vars.color.fg} 14%, transparent)`,
  color: vars.color.fg
});

globalStyle('.lightboxTop .btn:hover', {
  background: 'rgba(255,255,255,.12)',
  borderColor: 'rgba(255,255,255,.24)'
});

globalStyle('html:not([data-theme="dark"]) .lightboxTop .btn:hover', {
  background: `color-mix(in srgb, ${vars.color.card} 94%, #ffffff)`,
  borderColor: `color-mix(in srgb, ${vars.color.accent} 18%, ${vars.color.border})`
});

globalStyle('.lightboxTop .btn.iconBtn', {
  width: 38,
  height: 38,
  padding: 0
});

globalStyle('.postListHead', {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: 12,
  alignItems: 'start',
  '@media': {
    'screen and (max-width: 620px)': { gridTemplateColumns: 'minmax(0, 1fr)' }
  }
});

globalStyle('.postListMetaRight', {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  alignItems: 'flex-start',
  alignContent: 'flex-start',
  minWidth: 0,
  '@media': {
    'screen and (max-width: 620px)': { justifyContent: 'flex-start' }
  }
});

globalStyle('.lightbox .btn', {
  borderColor: 'rgba(255,255,255,.22)',
  color: '#fff'
});

globalStyle('html:not([data-theme="dark"]) .lightbox .btn', {
  borderColor: `color-mix(in srgb, ${vars.color.fg} 14%, transparent)`,
  color: vars.color.fg
});

globalStyle('.lightbox .btn.primary', {
  background: 'rgba(255,255,255,.14)',
  borderColor: 'rgba(255,255,255,.18)'
});

globalStyle('html:not([data-theme="dark"]) .lightbox .btn.primary', {
  background: vars.color.accent,
  borderColor: 'transparent',
  color: '#ffffff'
});

globalStyle('.lightboxActions', {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  alignItems: 'center'
});

globalStyle('.lightboxActionBtn', {
  height: 38,
  borderRadius: 999,
  padding: '0 12px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'rgba(0,0,0,.24)',
  borderColor: 'rgba(255,255,255,.18)'
});

globalStyle('html:not([data-theme="dark"]) .lightboxActionBtn', {
  background: `color-mix(in srgb, ${vars.color.card} 86%, #ffffff)`,
  borderColor: vars.color.border,
  color: vars.color.fg
});

globalStyle('.lightboxActionBtn:hover', {
  background: 'rgba(255,255,255,.10)',
  borderColor: 'rgba(255,255,255,.24)'
});

globalStyle('html:not([data-theme="dark"]) .lightboxActionBtn:hover', {
  background: `color-mix(in srgb, ${vars.color.card} 94%, #ffffff)`,
  borderColor: `color-mix(in srgb, ${vars.color.accent} 18%, ${vars.color.border})`
});

globalStyle('.lightboxActionBtn:disabled', {
  opacity: 0.55,
  cursor: 'not-allowed'
});

globalStyle('.lightboxActionIcon', {
  display: 'block',
  flex: '0 0 auto',
  opacity: 0.92
});

globalStyle('.lightbox .btn.danger.lightboxActionBtn', {
  borderColor: 'rgba(239,68,68,.48)',
  color: 'rgba(255,255,255,.92)',
  background: 'rgba(239,68,68,.12)'
});

globalStyle('html:not([data-theme="dark"]) .lightbox .btn.danger.lightboxActionBtn', {
  borderColor: `color-mix(in srgb, ${vars.color.danger} 55%, ${vars.color.border})`,
  color: vars.color.danger,
  background: `color-mix(in srgb, ${vars.color.danger} 10%, #ffffff)`,
  boxShadow: `0 10px 26px rgba(2,6,23,.08)`
});

globalStyle('.lightbox .btn.danger.lightboxActionBtn:hover', {
  borderColor: 'rgba(239,68,68,.62)',
  background: 'rgba(239,68,68,.16)'
});

globalStyle('html:not([data-theme="dark"]) .lightbox .btn.danger.lightboxActionBtn:hover', {
  borderColor: `color-mix(in srgb, ${vars.color.danger} 70%, ${vars.color.border})`,
  background: `color-mix(in srgb, ${vars.color.danger} 14%, #ffffff)`
});

globalStyle('.postListRow', {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 180px',
  gap: 14,
  alignItems: 'start',
  '@media': {
    'screen and (max-width: 980px)': { gridTemplateColumns: 'minmax(0, 1fr) 160px' },
    'screen and (max-width: 620px)': { gridTemplateColumns: 'minmax(0, 1fr)' }
  }
});

globalStyle('.postListBody', { minWidth: 0 });

globalStyle('.postThumb', {
  width: 180,
  aspectRatio: '16 / 10',
  borderRadius: vars.radius.md,
  overflow: 'hidden',
  border: `1px solid ${vars.color.border}`,
  background: '#000',
  position: 'relative',
  alignSelf: 'start',
  '@media': {
    'screen and (max-width: 980px)': { width: 160 },
    'screen and (max-width: 620px)': { width: '100%' }
  }
});

globalStyle('.postThumb .thumbBg', {
  position: 'absolute',
  inset: -18,
  width: 'calc(100% + 36px)',
  height: 'calc(100% + 36px)',
  objectFit: 'cover',
  filter: 'blur(18px) saturate(1.15) contrast(1.05)',
  opacity: 0.65,
  transform: 'scale(1.05)'
});

globalStyle('.postThumb .thumbFg', {
  position: 'absolute',
  inset: 2,
  width: 'calc(100% - 4px)',
  height: 'calc(100% - 4px)',
  objectFit: 'contain',
  objectPosition: 'center',
  display: 'block'
});

globalStyle('.postHeroThumb', {
  width: '100%',
  aspectRatio: '16 / 9',
  borderRadius: vars.radius.lg,
  overflow: 'hidden',
  border: `1px solid ${vars.color.border}`,
  background: '#000',
  position: 'relative',
  marginTop: 12,
  marginBottom: 16
});

globalStyle('.postHeroThumb .thumbBg', {
  position: 'absolute',
  inset: -24,
  width: 'calc(100% + 48px)',
  height: 'calc(100% + 48px)',
  objectFit: 'cover',
  filter: 'blur(22px) saturate(1.2) contrast(1.06)',
  opacity: 0.62,
  transform: 'scale(1.06)'
});

globalStyle('.postHeroThumb .thumbFg', {
  position: 'absolute',
  inset: 2,
  width: 'calc(100% - 4px)',
  height: 'calc(100% - 4px)',
  objectFit: 'contain',
  objectPosition: 'center',
  display: 'block'
});

globalStyle('.timelineList', {
  display: 'grid',
  gap: 0,
  position: 'relative'
});

globalStyle('.timelineRow', {
  display: 'grid',
  gap: 14,
  alignItems: 'stretch',
  padding: 0
});

globalStyle('.timelineGraphCell', {
  display: 'grid',
  placeItems: 'stretch',
  overflow: 'visible',
  alignSelf: 'stretch',
  position: 'relative'
});

globalStyle('.timelineGraph', {
  width: 'var(--timeline-w, 64px)',
  height: '100%',
  display: 'block',
  overflow: 'visible'
});

globalStyle('.timelineGraphWrap', {
  width: '100%',
  height: '100%',
  minWidth: 0,
  minHeight: 0,
  position: 'relative'
});

globalStyle('.timelineDotOuter', {
  position: 'absolute',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  width: 18,
  height: 18,
  borderRadius: 999,
  border: '2px solid rgba(255,255,255,.28)',
  background: 'transparent',
  pointerEvents: 'none'
});

globalStyle('.timelineDotInner', {
  position: 'absolute',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  width: 10,
  height: 10,
  borderRadius: 999,
  pointerEvents: 'none'
});

globalStyle('.timelineGuides', {
  position: 'absolute',
  inset: 0,
  left: 0,
  width: 'var(--timeline-w, 64px)',
  pointerEvents: 'none'
});

globalStyle('.timelineGuidesSvg', {
  width: '100%',
  height: '100%',
  display: 'block'
});

globalStyle('.timelineCard', {
  padding: 14,
  margin: 'calc(var(--timeline-gap, 12px) / 2) 0'
});

globalStyle('.timelineRow', {
  '@media': {
    'screen and (max-width: 620px)': { gap: 10 }
  }
});

globalStyle('.albumMasonry', {
  '@media': {
    'screen and (max-width: 980px)': { gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' },
    'screen and (max-width: 620px)': { gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }
  }
});

globalStyle('.albumThumb', {
  '@media': {
    'screen and (max-width: 980px)': { height: 200 },
    'screen and (max-width: 620px)': { height: 190 }
  }
});

globalStyle('.heroStats', {
  '@media': {
    'screen and (max-width: 980px)': { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
    'screen and (max-width: 620px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }
  }
});

globalStyle('.categoryCard', {
  '@media': {
    'screen and (max-width: 860px)': { gridColumn: 'span 12' }
  }
});

globalStyle('.heroTitle', {
  '@media': {
    'screen and (max-width: 620px)': { fontSize: 34 }
  }
});
