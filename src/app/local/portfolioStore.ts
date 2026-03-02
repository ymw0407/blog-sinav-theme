import type { Portfolio } from '../content/types';

const KEY = 'blog.local.portfolio.v1';

export function getLocalPortfolio(): Portfolio | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Portfolio;
  } catch {
    return null;
  }
}

export function setLocalPortfolio(p: Portfolio) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function clearLocalPortfolio() {
  localStorage.removeItem(KEY);
}

