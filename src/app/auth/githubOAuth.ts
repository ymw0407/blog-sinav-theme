import { getEnv } from '../env';
import { pkceChallengeFromVerifier, randomString } from './pkce';

const SESSION_VERIFIER = 'blog.pkce.verifier';
const SESSION_STATE = 'blog.pkce.state';
const SESSION_RETURN_TO = 'blog.pkce.returnTo';

export function getSessionVerifier() {
  return sessionStorage.getItem(SESSION_VERIFIER);
}

export function clearPkceSession() {
  sessionStorage.removeItem(SESSION_VERIFIER);
  sessionStorage.removeItem(SESSION_STATE);
  sessionStorage.removeItem(SESSION_RETURN_TO);
}

export async function startGitHubLogin(returnTo: string) {
  const env = getEnv();
  const state = randomString(24);
  const verifier = randomString(64);
  const challenge = await pkceChallengeFromVerifier(verifier);

  sessionStorage.setItem(SESSION_STATE, state);
  sessionStorage.setItem(SESSION_VERIFIER, verifier);
  sessionStorage.setItem(SESSION_RETURN_TO, returnTo);

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', env.VITE_GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', env.VITE_GITHUB_REDIRECT_URI);
  url.searchParams.set('scope', 'repo read:user user:email');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');

  window.location.assign(url.toString());
}

export function readReturnTo(): string {
  return sessionStorage.getItem(SESSION_RETURN_TO) || '/';
}

export function assertState(state: string | null) {
  const expected = sessionStorage.getItem(SESSION_STATE);
  if (!state || !expected || state !== expected) {
    throw new Error('Invalid OAuth state.');
  }
}

function parseTokenResponse(text: string): {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
} {
  const trimmed = text.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith('{')) return JSON.parse(trimmed);
  const params = new URLSearchParams(trimmed);
  return {
    access_token: params.get('access_token') ?? undefined,
    token_type: params.get('token_type') ?? undefined,
    scope: params.get('scope') ?? undefined,
    error: params.get('error') ?? undefined,
    error_description: params.get('error_description') ?? undefined
  };
}

export async function exchangeCodeForToken(code: string) {
  const env = getEnv();
  const verifier = getSessionVerifier();
  if (!verifier) throw new Error('Missing code_verifier (session expired).');

  const proxyBase = (env.VITE_OAUTH_PROXY_URL || '').trim().replace(/\/+$/, '');
  if (!proxyBase) {
    throw new Error(
      'GitHub OAuth token exchange is blocked by browser CORS. Set VITE_OAUTH_PROXY_URL to a server-side token exchange proxy.'
    );
  }

  // NOTE: GitHub OAuth token endpoint historically had limitations with CORS preflight.
  // We intentionally use application/x-www-form-urlencoded and no custom headers to avoid OPTIONS.
  const body = new URLSearchParams();
  body.set('client_id', env.VITE_GITHUB_CLIENT_ID);
  body.set('code', code);
  body.set('redirect_uri', env.VITE_GITHUB_REDIRECT_URI);
  body.set('code_verifier', verifier);

  // Token exchange must be server-side. The proxy will call GitHub and return the raw token response.
  const res = await fetch(`${proxyBase}/github/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const text = await res.text();
  const parsed = parseTokenResponse(text);
  if (!res.ok) {
    throw new Error(
      `Token exchange failed (${res.status}): ${parsed.error_description || parsed.error || text}`
    );
  }
  if (!parsed.access_token) {
    throw new Error(`Token exchange failed: ${parsed.error_description || parsed.error || text}`);
  }
  return parsed.access_token;
}
