import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './shared/ui/AppShell';
import AppErrorBoundary from './shared/ui/AppErrorBoundary';
import LandingPage from './pages/LandingPage';
import { lazyWithRetry } from './shared/lib/lazyWithRetry';

const AlbumsPage = lazyWithRetry(() => import('./pages/AlbumsPage'));
const AlbumEditorPage = lazyWithRetry(() => import('./pages/AlbumEditorPage'));
const AlbumPage = lazyWithRetry(() => import('./pages/AlbumPage'));
const AboutPage = lazyWithRetry(() => import('./pages/AboutPage'));
const AuthCallbackPage = lazyWithRetry(() => import('./pages/AuthCallbackPage'));
const CategoryPage = lazyWithRetry(() => import('./pages/CategoryPage'));
const EditorPage = lazyWithRetry(() => import('./pages/EditorPage'));
const GalleryPage = lazyWithRetry(() => import('./pages/GalleryPage'));
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage'));
const ProfilePage = lazyWithRetry(() => import('./pages/ProfilePage'));
const ProfileEditorPage = lazyWithRetry(() => import('./pages/ProfileEditorPage'));
const ResumePage = lazyWithRetry(() => import('./pages/ResumePage'));
const ResumeEditorPage = lazyWithRetry(() => import('./pages/ResumeEditorPage'));
const PostPage = lazyWithRetry(() => import('./pages/PostPage'));
const StyleGuidePage = lazyWithRetry(() => import('./pages/StyleGuidePage'));
const MotionPage = lazyWithRetry(() => import('./pages/MotionPage'));
const TypographyPage = lazyWithRetry(() => import('./pages/TypographyPage'));
const TimelinePage = lazyWithRetry(() => import('./pages/TimelinePage'));

export default function App() {
  return (
    <>
      <AppShell>
        <AppErrorBoundary>
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
        </AppErrorBoundary>
      </AppShell>
    </>
  );
}
