export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'blog.themeMode';

export function readThemeMode(): ThemeMode {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === 'light' || raw === 'dark') return raw;
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
}

export function writeThemeMode(mode: ThemeMode) {
  localStorage.setItem(STORAGE_KEY, mode);
}

export function resolveTheme(mode: ThemeMode) {
  return mode;
}

export function applyResolvedTheme(resolved: 'light' | 'dark') {
  document.documentElement.dataset.theme = resolved;
}
