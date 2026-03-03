import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './app/auth/AuthContext';
import App from './App';
import './styles/global.css.ts';

function normalizeInitialUrl() {
  if (typeof window === 'undefined') return;

  const baseUrl = import.meta.env.BASE_URL || '/';
  const baseNoSlash = baseUrl === '/' ? '' : baseUrl.replace(/\/$/, '');

  const url = new URL(window.location.href);
  const sp = url.searchParams;

  // GitHub Pages SPA fallback (dist/404.html) forwards the original URL here.
  const forwarded = sp.get('__p');
  if (forwarded) {
    try {
      const decoded = decodeURIComponent(forwarded);
      window.history.replaceState({}, document.title, `${baseNoSlash}${decoded}`);
      return;
    } catch {
      // ignore
    }
  }

  // Legacy HashRouter links: convert `/#/...` to path-based URLs.
  if (url.hash.startsWith('#/')) {
    const path = url.hash.slice(1); // keep leading "/"
    window.history.replaceState({}, document.title, `${baseNoSlash}${path}${url.search}`);
    return;
  }

  // OAuth: allow redirect URI to be "/" while still routing to the callback page.
  const hasOauthParams = Boolean(sp.get('code') || sp.get('error'));
  if (hasOauthParams && !url.pathname.endsWith('/auth/callback')) {
    window.history.replaceState({}, document.title, `${baseNoSlash}/auth/callback${url.search}${url.hash}`);
  }
}

normalizeInitialUrl();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
