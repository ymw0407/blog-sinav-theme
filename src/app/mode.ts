import { getEnv } from './env';

const OVERRIDE_KEY = 'blog.localModeOverride';

function readOverride(): boolean | null {
  try {
    const v = sessionStorage.getItem(OVERRIDE_KEY);
    if (v === '1') return true;
    if (v === '0') return false;
    return null;
  } catch {
    return null;
  }
}

export function setLocalModeOverride(enabled: boolean) {
  try {
    sessionStorage.setItem(OVERRIDE_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
}

export function isLocalMode(): boolean {
  const override = readOverride();
  if (override !== null) return override;

  const env = getEnv();
  const explicit = (env.VITE_LOCAL_MODE || '').toLowerCase();
  if (explicit === '1' || explicit === 'true' || explicit === 'yes') return true;

  // 기본값: 개발 중이고 GitHub OAuth 설정이 없으면 로컬 모드로 동작
  if (import.meta.env.DEV) {
    const hasClient = Boolean(env.VITE_GITHUB_CLIENT_ID?.trim());
    const hasRedirect = Boolean(env.VITE_GITHUB_REDIRECT_URI?.trim());
    return !(hasClient && hasRedirect);
  }

  return false;
}

export function isGitHubWriteEnabled(): boolean {
  if (isLocalMode()) return false;
  const env = getEnv();
  return Boolean(env.VITE_GITHUB_CLIENT_ID?.trim() && env.VITE_GITHUB_REDIRECT_URI?.trim());
}
