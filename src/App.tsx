import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './shared/ui/AppShell';
import AlbumsPage from './pages/AlbumsPage';
import AlbumEditorPage from './pages/AlbumEditorPage';
import AlbumPage from './pages/AlbumPage';
import AboutPage from './pages/AboutPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import CategoryPage from './pages/CategoryPage';
import EditorPage from './pages/EditorPage';
import GalleryPage from './pages/GalleryPage';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import ProfileEditorPage from './pages/ProfileEditorPage';
import ResumePage from './pages/ResumePage';
import ResumeEditorPage from './pages/ResumeEditorPage';
import PostPage from './pages/PostPage';
import StyleGuidePage from './pages/StyleGuidePage';
import MotionPage from './pages/MotionPage';
import TypographyPage from './pages/TypographyPage';
import TimelinePage from './pages/TimelinePage';

function OAuthBootstrap() {
  // HashRouter를 쓰되, OAuth redirect URI는 fragment 없이도 동작하도록 지원한다.
  // 예: https://<pages>/?code=...&state=...
  // → 해시 라우트만 callback으로 이동시키고, query는 그대로 두어 AuthCallbackPage에서 처리한다.
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasOauthParams = Boolean(params.get('code') || params.get('error'));
    if (!hasOauthParams) return;
    try {
      sessionStorage.setItem('blog.oauth.query', window.location.search.replace(/^\\?/, ''));
    } catch {
      // ignore
    }
    // Move OAuth params into the hash (so the callback page can read them),
    // then strip them from the querystring to avoid trapping navigation.
    const query = window.location.search.replace(/^\\?/, '');
    const nextHash = query ? `#/auth/callback?${query}` : '#/auth/callback';
    if (!window.location.hash.startsWith('#/auth/callback')) {
      window.location.hash = nextHash;
    } else if (query && !window.location.hash.includes('?')) {
      window.location.hash = nextHash;
    }

    const cleanUrl = `${window.location.pathname}${window.location.hash || ''}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }, []);
  return null;
}

export default function App() {
  return (
    <>
      <OAuthBootstrap />
      <AppShell>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/styleguide" element={<StyleGuidePage />} />
          <Route path="/typography" element={<TypographyPage />} />
          <Route path="/motion" element={<MotionPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/post/:category/:slug" element={<PostPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/albums" element={<AlbumsPage />} />
          <Route path="/albums/new" element={<AlbumEditorPage />} />
          <Route path="/albums/:albumId/edit" element={<AlbumEditorPage />} />
          <Route path="/albums/:albumId" element={<AlbumPage />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/resume/edit" element={<ResumeEditorPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<ProfileEditorPage />} />
          <Route path="/portfolio" element={<Navigate to="/resume" replace />} />
          <Route path="/portfolio/edit" element={<Navigate to="/resume/edit" replace />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/editor/:category/:slug" element={<EditorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    </>
  );
}
