import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/auth/AuthContext';
import { getPortfolioIndex } from '../app/content/contentindex';
import { isGitHubWriteEnabled, isLocalMode } from '../app/mode';
import ProfileViewer from '../shared/ui/ProfileViewer';

export default function ProfilePage() {
  const local = isLocalMode();
  const ghEnabled = isGitHubWriteEnabled();
  const { state, isAllowedUser } = useAuth();
  const canGitHubWrite = ghEnabled && Boolean(state.accessToken) && isAllowedUser;
  const canWrite = local ? true : canGitHubWrite;

  const portfolio = getPortfolioIndex().portfolio as any;
  const profile = (portfolio?.profile ?? {}) as any;
  const title = typeof profile.title === 'string' && profile.title.trim() ? profile.title.trim() : 'Profile';
  const doc = profile.doc ?? { type: 'doc', content: [{ type: 'paragraph' }] };

  const isEmpty = !doc?.content?.length || (doc?.content?.length === 1 && doc.content?.[0]?.type === 'paragraph');

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 6 }}>{title}</h1>
          {profile.updatedAt ? <div className="muted">Updated: {String(profile.updatedAt).slice(0, 10)}</div> : null}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Link to="/resume" className="pill">
            Resume
          </Link>
          {canWrite ? (
            <Link to="/profile/edit" className="pill">
              Edit
            </Link>
          ) : null}
        </div>
      </div>

      {isEmpty ? (
        <div className="muted" style={{ marginTop: 12 }}>
          No profile content yet.
        </div>
      ) : (
        <div className="postProse" style={{ marginTop: 12 }}>
          <ProfileViewer doc={doc} />
        </div>
      )}
    </div>
  );
}


