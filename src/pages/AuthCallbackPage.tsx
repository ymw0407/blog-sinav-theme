import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/auth/AuthContext';
import { assertState, clearPkceSession, exchangeCodeForToken, readReturnTo } from '../app/auth/githubOAuth';
import { hydrateUser } from '../app/auth/AuthContext';

export default function AuthCallbackPage() {
  const nav = useNavigate();
  const { setAuth, logout } = useAuth();
  const [status, setStatus] = React.useState('처리 중…');

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let code = urlParams.get('code');
    let stateParam = urlParams.get('state');
    let err = urlParams.get('error');

    if (!code) {
      const hash = window.location.hash || '';
      const qIndex = hash.indexOf('?');
      if (qIndex >= 0) {
        const hashParams = new URLSearchParams(hash.slice(qIndex + 1));
        code = hashParams.get('code');
        stateParam = hashParams.get('state');
        err = hashParams.get('error');
      }
    }
    const returnTo = readReturnTo();

    (async () => {
      try {
        if (err) throw new Error(err);
        assertState(stateParam);
        if (!code) throw new Error('Missing code.');
        const token = await exchangeCodeForToken(code);
        const username = await hydrateUser(token);

        // Token은 메모리에만 보관한다. (새로고침 시 재로그인 필요)
        setAuth({ accessToken: token, username });
        window.dispatchEvent(new CustomEvent('blog-auth', { detail: { token, username } }));

        setStatus(`로그인 완료: @${username}`);
        clearPkceSession();
        nav(returnTo);
      } catch (e) {
        setStatus(e instanceof Error ? e.message : String(e));
        logout();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>Auth Callback</h1>
      <p className="muted">{status}</p>
      <p className="muted">이 페이지는 OAuth redirect 처리용입니다.</p>
    </div>
  );
}
