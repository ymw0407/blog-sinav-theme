import { createThemeContract, globalStyle } from '@vanilla-extract/css';
import { baseColorDark, baseColorLight } from './baseColor.css';

export const vars = createThemeContract({
  color: {
    bg: null,
    fg: null,
    muted: null,
    card: null,
    border: null,
    accent: null,
    accentSoft: null,
    danger: null
  },
  typography: {
    fontBody: null,
    fontMono: null,
    lineHeight: null,
    contentWidth: null
  },
  motion: {
    fast: null,
    normal: null,
    slow: null
  },
  radius: {
    sm: null,
    md: null,
    lg: null
  },
  shadow: {
    sm: null
  }
});

globalStyle(':root', {
  vars: {
    [vars.color.bg]: baseColorLight.bg,
    [vars.color.fg]: baseColorLight.fg,
    [vars.color.muted]: baseColorLight.muted,
    [vars.color.card]: baseColorLight.card,
    [vars.color.border]: baseColorLight.border,
    [vars.color.danger]: baseColorLight.danger,
    [vars.color.accent]: '#2f6feb',
    [vars.color.accentSoft]: `color-mix(in srgb, ${vars.color.accent} 18%, transparent)`,

    [vars.typography.fontBody]:
      "'Pretendard Variable', Pretendard, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
    [vars.typography.fontMono]:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    [vars.typography.lineHeight]: '1.75',
    [vars.typography.contentWidth]: '760px',

    [vars.motion.fast]: '150ms',
    [vars.motion.normal]: '250ms',
    [vars.motion.slow]: '400ms',

    [vars.radius.sm]: '10px',
    [vars.radius.md]: '14px',
    [vars.radius.lg]: '18px',

    [vars.shadow.sm]: '0 10px 30px rgba(0,0,0,.10)'
  }
});

globalStyle('html[data-theme="dark"]', {
  vars: {
    [vars.color.bg]: baseColorDark.bg,
    [vars.color.fg]: baseColorDark.fg,
    [vars.color.muted]: baseColorDark.muted,
    [vars.color.card]: baseColorDark.card,
    [vars.color.border]: baseColorDark.border,
    [vars.color.danger]: baseColorDark.danger
  }
});
