import React from 'react';
import { useNavigate } from 'react-router-dom';
import { hydrateUser, useAuth } from '../app/auth/AuthContext';
import { assertState, clearPkceSession, exchangeCodeForToken, readReturnTo } from '../app/auth/githubOAuth';

function readOAuthParams(): { code: string | null; state: string | null; error: string | null } {
  const urlParams = new URLSearchParams(window.location.search);
  let code = urlParams.get('code');
  let state = urlParams.get('state');
  let error = urlParams.get('error');

  if (!code && !error) {
    // Fallback: support `#/auth/callback?code=...&state=...`
    const hash = window.location.hash || '';
    const qIndex = hash.indexOf('?');
    if (qIndex >= 0) {
      const hashParams = new URLSearchParams(hash.slice(qIndex + 1));
      code = hashParams.get('code');
      state = hashParams.get('state');
      error = hashParams.get('error');
    }
  }

  return { code, state, error };
}

function stripOAuthParamsFromUrl() {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  window.history.replaceState({}, document.title, url.pathname);
}

export default function AuthCallbackPage() {
  const nav = useNavigate();
  const { setAuth, logout } = useAuth();
  const didRun = React.useRef(false);
  const [status, setStatus] = React.useState('Processing OAuth callback…');

  React.useEffect(() => {
    if (didRun.current) return; // StrictMode double-invocation guard (dev)
    didRun.current = true;

    const { code, state, error } = readOAuthParams();
    const returnTo = readReturnTo();

    // Do this ASAP so the app isn't trapped behind `?code=...`.
    stripOAuthParamsFromUrl();

    (async () => {
      try {
        if (error) throw new Error(error);
        assertState(state);
        if (!code) throw new Error('Missing OAuth code.');

        const token = await exchangeCodeForToken(code);
        const username = await hydrateUser(token);

        setAuth({ accessToken: token, username });
        window.dispatchEvent(new CustomEvent('blog-auth', { detail: { token, username } }));

        setStatus(`Logged in as @${username}`);
        clearPkceSession();
        nav(returnTo, { replace: true });
      } catch (e) {
        setStatus(e instanceof Error ? e.message : String(e));
        logout();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>Auth</h1>
      <p className="muted">{status}</p>
      <p className="muted">You can close this tab if it doesn’t redirect automatically.</p>
    </div>
  );
}
