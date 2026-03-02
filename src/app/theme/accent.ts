import { resolveCategory } from '../config/siteConfig';
import { vars } from '../../styles/tokens/theme.css';
import { getSiteConfig } from '../config/siteConfig';

function cssVarName(token: string) {
  const m = token.match(/^var\((--[^)]+)\)$/);
  if (m?.[1]) return m[1];
  return token;
}

export function applyCategoryAccent(categoryKey: string | null | undefined) {
  const root = document.documentElement;
  const meta = resolveCategory(categoryKey ?? null);
  const fallback = getSiteConfig().categories[0]?.accent ?? '#2f6feb';
  const accent = meta?.accent ?? fallback;
  root.style.setProperty(cssVarName(vars.color.accent), accent);
}
