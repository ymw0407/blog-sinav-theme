import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './shared/ui/AppShell';
import LandingPage from './pages/LandingPage';

const AlbumsPage = React.lazy(() => import('./pages/AlbumsPage'));
const AlbumEditorPage = React.lazy(() => import('./pages/AlbumEditorPage'));
const AlbumPage = React.lazy(() => import('./pages/AlbumPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const AuthCallbackPage = React.lazy(() => import('./pages/AuthCallbackPage'));
const CategoryPage = React.lazy(() => import('./pages/CategoryPage'));
const EditorPage = React.lazy(() => import('./pages/EditorPage'));
const GalleryPage = React.lazy(() => import('./pages/GalleryPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const ProfileEditorPage = React.lazy(() => import('./pages/ProfileEditorPage'));
const ResumePage = React.lazy(() => import('./pages/ResumePage'));
const ResumeEditorPage = React.lazy(() => import('./pages/ResumeEditorPage'));
const PostPage = React.lazy(() => import('./pages/PostPage'));
const StyleGuidePage = React.lazy(() => import('./pages/StyleGuidePage'));
const MotionPage = React.lazy(() => import('./pages/MotionPage'));
const TypographyPage = React.lazy(() => import('./pages/TypographyPage'));
const TimelinePage = React.lazy(() => import('./pages/TimelinePage'));

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
        <React.Suspense
          fallback={
            <div className="container">
              <div className="muted">Loading...</div>
            </div>
          }
        >
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
        </React.Suspense>
      </AppShell>
    </>
  );
}
