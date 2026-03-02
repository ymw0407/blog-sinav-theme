import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/auth/AuthContext';
import { getPortfolioIndex } from '../app/content/contentIndex';
import { getEnv } from '../app/env';
import { uploadPortfolioAsset, upsertPortfolioJsonInRepo } from '../app/content/portfolioRepo';
import { clearProfileDraft, getProfileDraft, setProfileDraft, type ProfileDraftData } from '../app/local/profileDraftStore';
import { setLocalPortfolio } from '../app/local/portfolioStore';
import { isGitHubWriteEnabled, isLocalMode } from '../app/mode';
import RichEditor from '../app/editor/RichEditor';

function normalizeDoc(raw: any) {
  if (raw && typeof raw === 'object' && raw.type === 'doc' && Array.isArray(raw.content)) return raw;
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

function isDocEmpty(doc: any) {
  const d = normalizeDoc(doc);
  const c = d?.content ?? [];
  return !c?.length || (c.length === 1 && c[0]?.type === 'paragraph' && !c[0]?.content?.length);
}

export default function ProfileEditorPage() {
  const env = getEnv();
  const nav = useNavigate();
  const local = isLocalMode();
  const ghEnabled = isGitHubWriteEnabled();
  const { state, isAllowedUser, getOctokit, login } = useAuth();
  const canGitHubWrite = ghEnabled && Boolean(state.accessToken) && isAllowedUser;
  const canWrite = local ? true : canGitHubWrite;

  const autosaveKey = 'profile';

  const [title, setTitle] = React.useState('Profile');
  const [doc, setDoc] = React.useState<any>({ type: 'doc', content: [{ type: 'paragraph' }] });
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [editorReady, setEditorReady] = React.useState(false);

  const hydratedRef = React.useRef(false);
  const draftTimerRef = React.useRef<number | null>(null);
  const latestAutosaveRef = React.useRef<ProfileDraftData | null>(null);
  const autosaveBlockedRef = React.useRef(false);

  React.useEffect(() => {
    hydratedRef.current = false;
    autosaveBlockedRef.current = false;
    setLoading(true);
    setEditorReady(false);

    const d = getProfileDraft(autosaveKey);
    const portfolio = getPortfolioIndex().portfolio as any;
    const profile = (portfolio?.profile ?? {}) as any;
    const baseTitle = typeof profile.title === 'string' && profile.title.trim() ? profile.title.trim() : 'Profile';
    const baseDoc = normalizeDoc(profile.doc);
    const baseUpdatedAt = typeof profile.updatedAt === 'string' ? profile.updatedAt : '';

    // Prefer draft only if it's meaningful (non-empty) OR it's newer than the saved profile.
    if (d) {
      const draftDoc = normalizeDoc(d.doc);
      const draftSavedAt = typeof (d as any).savedAt === 'string' ? String((d as any).savedAt) : '';
      const draftIsEmpty = isDocEmpty(draftDoc);
      const baseIsEmpty = isDocEmpty(baseDoc);
      const draftIsNewer = draftSavedAt && baseUpdatedAt ? draftSavedAt >= baseUpdatedAt : Boolean(draftSavedAt);

      if (!draftIsEmpty || baseIsEmpty || draftIsNewer) {
        setTitle(d.title || baseTitle);
        setDoc(draftDoc);
        hydratedRef.current = true;
        setLoading(false);
        setEditorReady(true);
        return;
      }
    }

    setTitle(baseTitle);
    setDoc(baseDoc);
    hydratedRef.current = true;
    setLoading(false);
    setEditorReady(true);
  }, []);

  React.useLayoutEffect(() => {
    if (!canWrite) return;
    if (loading) return;
    if (!hydratedRef.current) return;
    if (autosaveBlockedRef.current) return;
    latestAutosaveRef.current = { title, doc };
  }, [canWrite, loading, title, doc]);

  React.useEffect(() => {
    if (!canWrite) return;
    if (loading) return;
    if (!hydratedRef.current) return;
    if (autosaveBlockedRef.current) return;

    const data: ProfileDraftData = { title, doc };
    if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
    draftTimerRef.current = window.setTimeout(() => {
      try {
        setProfileDraft(autosaveKey, data);
      } catch {
        // ignore
      }
    }, 500);
    return () => {
      if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
    };
  }, [canWrite, loading, title, doc]);

  React.useEffect(() => {
    if (!canWrite) return;
    if (loading) return;
    if (!hydratedRef.current) return;
    if (autosaveBlockedRef.current) return;

    const flush = () => {
      if (autosaveBlockedRef.current) return;
      const data = latestAutosaveRef.current;
      if (!data) return;
      try {
        setProfileDraft(autosaveKey, data);
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      flush();
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [canWrite, loading]);

  async function uploadImage(file: File) {
    if (!canGitHubWrite) {
      await login('/profile/edit');
      throw new Error('Not authenticated.');
    }
    const octokit = getOctokit();
    return await uploadPortfolioAsset({
      octokit,
      owner: env.VITE_CONTENT_REPO_OWNER,
      repo: env.VITE_CONTENT_REPO_NAME,
      scope: 'profile',
      file,
      username: state.username ?? 'unknown'
    });
  }

  async function save() {
    setSaving(true);
    try {
      const portfolio = getPortfolioIndex().portfolio as any;
      const next = {
        ...portfolio,
        profile: {
          ...(portfolio?.profile ?? {}),
          title: title.trim() || 'Profile',
          doc,
          updatedAt: new Date().toISOString()
        }
      };

      if (local) {
        setLocalPortfolio(next);
      } else {
        if (!canGitHubWrite) throw new Error('GitHub write is not enabled.');
        const octokit = getOctokit();
        await upsertPortfolioJsonInRepo({
          owner: env.VITE_CONTENT_REPO_OWNER,
          repo: env.VITE_CONTENT_REPO_NAME,
          octokit,
          portfolio: next,
          username: state.username ?? 'unknown'
        });
        alert('Saved. A rebuild will deploy soon.');
        // Keep the newest state visible immediately in this browser.
        setLocalPortfolio(next);
      }

      autosaveBlockedRef.current = true;
      latestAutosaveRef.current = null;
      if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
      clearProfileDraft(autosaveKey);

      nav('/profile');
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ marginTop: 0 }}>Edit Profile</h1>
        {!state.accessToken && !local ? (
          <button className="btn primary" onClick={() => login('/profile/edit')}>
            Login with GitHub
          </button>
        ) : (
          <div className="pill">{local ? 'local mode' : `@${state.username ?? 'unknown'}`}</div>
        )}
      </div>

      <div className="grid" style={{ marginTop: 12 }}>
        <div className="col-12">
          <label className="muted">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canWrite || saving || loading} />
        </div>
        <div className="col-12">
          <label className="muted">Content</label>
          {editorReady && !loading ? (
            <RichEditor initialDoc={doc} onChange={(next) => setDoc(next)} onUploadImage={local ? undefined : uploadImage} />
          ) : (
            <div className="card" style={{ padding: 12 }}>
              <div className="muted">Loading editor…</div>
            </div>
          )}
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', marginTop: 12, gap: 10 }}>
        <Link to="/profile" className="pill">
          Cancel
        </Link>
        <button className="btn primary" disabled={!canWrite || saving || loading} type="button" onClick={() => save()}>
          {saving ? 'Saving…' : local ? 'Save (Local)' : 'Save (GitHub)'}
        </button>
      </div>
    </div>
  );
}
