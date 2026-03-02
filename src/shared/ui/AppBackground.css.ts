import { keyframes, style } from '@vanilla-extract/css';
import { vars } from '../../styles/tokens/theme.css';

const drift1 = keyframes({
  '0%': { transform: 'translate(-10%, -10%) scale(calc(1 + var(--bg-scroll, 0) * 0.28 * var(--bg-scroll-amt, 1)))' },
  '50%': { transform: 'translate(10%, 6%) scale(calc(1.05 + var(--bg-scroll, 0) * 0.28 * var(--bg-scroll-amt, 1)))' },
  '100%': { transform: 'translate(-10%, -10%) scale(calc(1 + var(--bg-scroll, 0) * 0.28 * var(--bg-scroll-amt, 1)))' }
});

const drift2 = keyframes({
  '0%': { transform: 'translate(8%, -4%) scale(calc(1 + var(--bg-scroll, 0) * 0.30 * var(--bg-scroll-amt, 1)))' },
  '50%': { transform: 'translate(-6%, 10%) scale(calc(1.08 + var(--bg-scroll, 0) * 0.30 * var(--bg-scroll-amt, 1)))' },
  '100%': { transform: 'translate(8%, -4%) scale(calc(1 + var(--bg-scroll, 0) * 0.30 * var(--bg-scroll-amt, 1)))' }
});

const drift3 = keyframes({
  '0%': { transform: 'translate(0%, 8%) scale(calc(1 + var(--bg-scroll, 0) * 0.24 * var(--bg-scroll-amt, 1)))' },
  '50%': { transform: 'translate(4%, -6%) scale(calc(1.06 + var(--bg-scroll, 0) * 0.24 * var(--bg-scroll-amt, 1)))' },
  '100%': { transform: 'translate(0%, 8%) scale(calc(1 + var(--bg-scroll, 0) * 0.24 * var(--bg-scroll-amt, 1)))' }
});

export const root = style({
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  pointerEvents: 'none',
  overflow: 'hidden',
  background: vars.color.bg,
  transform: 'translateZ(0)',
  selectors: {
    'html:not([data-theme="dark"]) &': {
      background: `linear-gradient(180deg, ${vars.color.bg} 0%, color-mix(in srgb, ${vars.color.accent} 4%, ${vars.color.bg}) 46%, ${vars.color.bg} 100%)`
    }
  }
});

export const layer = style({
  position: 'absolute',
  inset: 0,
  opacity: 0.55,
  transform:
    'translate(calc((var(--bg-mx, 0.5) - 0.5) * -18px * var(--bg-mouse-amt, 1)), calc((var(--bg-my, 0.5) - 0.5) * -12px * var(--bg-mouse-amt, 1))) scale(calc(1 + var(--bg-scroll, 0) * 0.06 * var(--bg-scroll-amt, 1)))',
  transformOrigin: '50% 50%',
  willChange: 'transform',
  background: [
    `radial-gradient(1200px circle at 18% 10%, color-mix(in srgb, ${vars.color.accent} 10%, transparent) 0%, transparent 55%)`,
    `radial-gradient(900px circle at 82% 16%, color-mix(in srgb, ${vars.color.fg} 6%, transparent) 0%, transparent 60%)`,
    `radial-gradient(1000px circle at 50% 92%, color-mix(in srgb, ${vars.color.fg} 5%, transparent) 0%, transparent 62%)`,
    `radial-gradient(900px circle at 10% 78%, color-mix(in srgb, ${vars.color.accent} 7%, transparent) 0%, transparent 62%)`
  ].join(', '),
  transition: `background-color ${vars.motion.normal} ease`,
  selectors: {
    'html:not([data-theme="dark"]) &': { opacity: 0.78 },
    'html[data-theme="dark"] &': { opacity: 0.50 }
  }
});

export const spotlight = style({
  position: 'absolute',
  inset: -1,
  pointerEvents: 'none',
  willChange: 'transform',
  background:
    `radial-gradient(900px circle at calc(var(--bg-mx, 0.5) * 100%) calc(var(--bg-my, 0.5) * 100%), ` +
    `color-mix(in srgb, ${vars.color.accent} 16%, transparent), transparent 62%)`,
  opacity: 0,
  mixBlendMode: 'screen',
  transform: 'translateZ(0)',
  transition: `opacity ${vars.motion.normal} ease`,
  selectors: {
    'html[data-page="landing"] &': { opacity: 0.30 },
    'html[data-page="gallery"] &': { opacity: 0.0 }
  }
});

export const vignette = style({
  position: 'absolute',
  inset: 0,
  transform: 'translate(calc((var(--bg-mx, 0.5) - 0.5) * 10px * var(--bg-mouse-amt, 1)), calc((var(--bg-my, 0.5) - 0.5) * 8px * var(--bg-mouse-amt, 1)))',
  willChange: 'transform',
  background: [
    'radial-gradient(1200px circle at 50% 30%, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.16) 72%, rgba(0,0,0,0.30) 100%)',
    'radial-gradient(900px circle at 20% 80%, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.18) 70%, rgba(0,0,0,0.28) 100%)'
  ].join(', '),
  opacity: 0.16,
  selectors: {
    'html:not([data-theme="dark"]) &': { opacity: 0.11 },
    'html[data-theme="dark"] &': { opacity: 0.18 }
  }
});

const noiseSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="240" height="240" filter="url(#n)" opacity=".35"/></svg>`
);

export const noise = style({
  position: 'absolute',
  inset: 0,
  transform: 'translate(calc((var(--bg-mx, 0.5) - 0.5) * -6px * var(--bg-mouse-amt, 1)), calc((var(--bg-my, 0.5) - 0.5) * -6px * var(--bg-mouse-amt, 1)))',
  willChange: 'transform',
  backgroundImage: `url("data:image/svg+xml,${noiseSvg}")`,
  backgroundRepeat: 'repeat',
  opacity: 0.06,
  mixBlendMode: 'overlay',
  selectors: {
    'html:not([data-theme="dark"]) &': { opacity: 0.075 },
    'html[data-theme="dark"] &': { opacity: 0.055 }
  }
});

const blobWrapBase = style({
  position: 'absolute',
  width: 520,
  height: 520,
  willChange: 'transform',
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none'
    }
  }
});

const blobInnerBase = style({
  width: '100%',
  height: '100%',
  borderRadius: 9999,
  background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${vars.color.accent} 12%, transparent) 0%, transparent 68%)`,
  opacity: 0.95,
  filter: 'blur(46px)',
  transform: 'translate(0, 0)',
  willChange: 'transform',
  transition: `transform ${vars.motion.normal} ease, background-color ${vars.motion.normal} ease`,
  selectors: {
    'html:not([data-theme="dark"]) &': {
      background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${vars.color.accent} 18%, transparent) 0%, transparent 70%)`,
      opacity: 0.98,
      filter: 'blur(54px)'
    }
  }
});

export const blob1 = style([
  blobWrapBase,
  {
    top: -180,
    left: -220,
    animation: `${drift1} 26s ease-in-out infinite`
  }
]);

export const blob2 = style([
  blobWrapBase,
  {
    bottom: -220,
    right: -240,
    animation: `${drift2} 30s ease-in-out infinite`
  }
]);

export const blob3 = style([
  blobWrapBase,
  {
    top: '22%',
    right: '18%',
    width: 420,
    height: 420,
    opacity: 0.55,
    animation: `${drift3} 34s ease-in-out infinite`
  }
]);

export const blobInner1 = style([
  blobInnerBase,
  {
    transform:
      'translate(calc((var(--bg-mx, 0.5) - 0.5) * -34px * var(--bg-mouse-amt, 1)), calc((var(--bg-my, 0.5) - 0.5) * -22px * var(--bg-mouse-amt, 1)))'
  }
]);

export const blobInner2 = style([
  blobInnerBase,
  {
    transform:
      'translate(calc((var(--bg-mx, 0.5) - 0.5) * 30px * var(--bg-mouse-amt, 1)), calc((var(--bg-my, 0.5) - 0.5) * 20px * var(--bg-mouse-amt, 1)))'
  }
]);

export const blobInner3 = style([
  blobInnerBase,
  {
    transform:
      'translate(calc((var(--bg-mx, 0.5) - 0.5) * -20px * var(--bg-mouse-amt, 1)), calc((var(--bg-my, 0.5) - 0.5) * 16px * var(--bg-mouse-amt, 1)))'
  }
]);
