import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../app/auth/AuthContext';
import { createComment, ensureCommentIssue } from '../app/comments/commentsApi';
import { fetchCommentThread } from '../app/comments/commentsPublicRead';
import { getCommentsIndex, getPostById } from '../app/content/contentIndex';
import { loadDocByImportPath } from '../app/content/docLoader';
import { loadMdxByImportPath, Mdx } from '../app/content/mdxLoader';
import { getEnv } from '../app/env';
import { addLocalComment, listLocalComments } from '../app/local/commentsStore';
import { deleteLocalPost } from '../app/local/postsStore';
import { isGitHubWriteEnabled, isLocalMode } from '../app/mode';
import { resolveCategory } from '../app/config/siteConfig';
import { formatDateTime } from '../shared/lib/datetime';
import { vars } from '../styles/tokens/theme.css';
import PostDocView from './PostDocView';
import Lightbox, { type LightboxItem } from '../shared/ui/Lightbox';
import ResolvedThumb from '../shared/ui/ResolvedThumb';
import type { CommentThread } from '../app/content/types';

export default function PostPage() {
  const { category, slug } = useParams();
  const post = category && slug ? getPostById(`${category}/${slug}`) : null;
  const { state, isAllowedUser, getOctokit, login } = useAuth();
  const local = isLocalMode();
  const nav = useNavigate();
  const env = getEnv();
  const ghEnabled = isGitHubWriteEnabled();
  const canGitHubWrite = ghEnabled && Boolean(state.accessToken) && isAllowedUser;
  const canEdit = local ? true : canGitHubWrite;

  const [mod, setMod] = React.useState<{ Component: React.ComponentType; frontmatter: any } | null>(
    null
  );
  const [doc, setDoc] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [comment, setComment] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [localName, setLocalName] = React.useState('local');
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [lightbox, setLightbox] = React.useState<{ items: LightboxItem[]; index: number } | null>(null);
  const [thread, setThread] = React.useState<CommentThread | null>(null);
  const [threadLoading, setThreadLoading] = React.useState(false);
  const [threadError, setThreadError] = React.useState<string | null>(null);

  const postId = post?.id ?? null;
  const initialThread = React.useMemo(() => {
    if (!postId) return null;
    return getCommentsIndex().threads.find((t) => t.postId === postId) ?? null;
  }, [postId]);

  React.useEffect(() => {
    setThread(initialThread);
  }, [initialThread, postId]);

  React.useEffect(() => {
    let cancelled = false;
    setError(null);
    setMod(null);
    setDoc(null);
    if (!post) return;
    const kind = post.kind ?? (post.mdxImportPath ? 'mdx' : 'doc');

    if (kind === 'doc') {
      if (post.source === 'local' && post.doc) {
        setDoc(post.doc);
      } else if (post.docImportPath) {
        loadDocByImportPath(post.docImportPath)
          .then((d) => {
            if (!cancelled) setDoc(d.content ?? d.doc ?? d);
          })
          .catch((e) => {
            if (!cancelled) setError(e instanceof Error ? e.message : String(e));
          });
      } else {
        setError('Missing doc source.');
      }
    } else {
      if (!post.mdxImportPath) return setError('Missing mdxImportPath.');
      loadMdxByImportPath(post.mdxImportPath)
        .then((m) => {
          if (!cancelled) setMod(m);
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof Error ? e.message : String(e));
        });
    }
    return () => {
      cancelled = true;
    };
  }, [post?.docImportPath, post?.mdxImportPath, post?.source]);

  React.useEffect(() => {
    if (local) return;
    const owner = (env.VITE_CONTENT_REPO_OWNER || '').trim();
    const repo = (env.VITE_CONTENT_REPO_NAME || '').trim();
    if (!owner || !repo) return;
    if (!postId) return;

    let cancelled = false;
    setThreadLoading(true);
    setThreadError(null);
    fetchCommentThread({ owner, repo, postId, issueNumberHint: initialThread?.issueNumber })
      .then((t) => {
        if (cancelled) return;
        setThread(t);
      })
      .catch((e) => {
        if (cancelled) return;
        setThreadError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (cancelled) return;
        setThreadLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [local, postId, env.VITE_CONTENT_REPO_OWNER, env.VITE_CONTENT_REPO_NAME, initialThread?.issueNumber]);

  if (!post) return <div className="card">Post not found.</div>;

  const localThread = local ? listLocalComments(post.id) : [];

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <h1 style={{ marginTop: 0 }}>{post.title}</h1>
          <div className="muted">
            {formatDateTime((post as any).datetime ?? (post as any).date)} ·{' '}
            <Link to={`/category/${post.category}`}>{resolveCategory(post.category)?.label ?? post.category}</Link>
          </div>
        </div>
        <div className="row">
          {canEdit ? (
            <>
              <Link className="pill" to={`/editor/${encodeURIComponent(post.category)}/${encodeURIComponent(post.slug)}`}>
                Edit
              </Link>
              <button
                type="button"
                className="pill"
                onClick={async () => {
                  if (!confirm('Delete this post?')) return;
                  try {
                    if (local) {
                      deleteLocalPost(post.id);
                      alert('Deleted locally.');
                      nav('/timeline');
                      return;
                    }
                    if (!canGitHubWrite) throw new Error('GitHub write is not enabled.');
                    if (post.kind !== 'doc' || !post.docImportPath) throw new Error('Only JSON(doc) posts can be deleted here.');
                    const owner = env.VITE_CONTENT_REPO_OWNER;
                    const repo = env.VITE_CONTENT_REPO_NAME;
                    const path = post.docImportPath.replace(/^\/content\//, '');
                    const octokit = getOctokit();
                    const res = await octokit.repos.getContent({ owner, repo, path });
                    if (Array.isArray(res.data) || res.data.type !== 'file') throw new Error('Not a file.');
                    await octokit.repos.deleteFile({
                      owner,
                      repo,
                      path,
                      sha: res.data.sha,
                      message: `chore(post): delete ${post.id}\n\nGenerated-By: blog-web\nSource-User: ${state.username ?? 'unknown'}`
                    });
                    alert('Deleted. A rebuild will deploy soon.');
                    nav('/timeline');
                  } catch (e) {
                    alert(e instanceof Error ? e.message : String(e));
                  }
                }}
              >
                Delete
              </button>
            </>
          ) : null}
          {post.tags.map((t) => (
            <Link key={t} to={`/timeline?tag=${encodeURIComponent(t)}`} className="pill">
              #{t}
            </Link>
          ))}
        </div>
      </div>

      {error ? (
        <div className="card" style={{ borderColor: vars.color.danger }}>
          {error}
        </div>
      ) : null}

      {post.thumbnail?.src ? (
        <div className="postHeroThumb" aria-label="Post thumbnail">
          <ResolvedThumb src={post.thumbnail.src} alt={post.thumbnail.alt ?? post.title} loading="eager" />
        </div>
      ) : null}

      <div
        className="mdx prose postProse"
        ref={contentRef}
        onClick={(e) => {
          const container = contentRef.current;
          if (!container) return;
          const target = e.target;
          if (!(target instanceof HTMLImageElement)) return;

          const images = Array.from(container.querySelectorAll('img'))
            .map((img) => img as HTMLImageElement)
            .map((img) => ({
              el: img,
              src: img.currentSrc || img.src,
              alt: img.alt || ''
            }))
            .filter((x) => Boolean(x.src));

          const idx = images.findIndex((x) => x.el === target);
          if (idx < 0) return;
          e.preventDefault();
          e.stopPropagation();
          setLightbox({ items: images.map(({ src, alt }) => ({ src, alt })), index: idx });
        }}
      >
        {post.kind === 'doc' || doc ? (
          <PostDocView doc={doc ?? post.doc} />
        ) : (
          <Mdx>{mod ? <mod.Component /> : <div className="muted">Loading...</div>}</Mdx>
        )}
      </div>

      <Lightbox
        items={lightbox?.items ?? []}
        index={lightbox?.index ?? null}
        onClose={() => setLightbox(null)}
        onIndexChange={(i) => setLightbox((cur) => (cur ? { ...cur, index: i } : null))}
      />

      <div style={{ marginTop: 24 }}>
        <h2>댓글</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          댓글은 GitHub Issues 기반이며, 읽기는 공개 GitHub API로 실시간 로드합니다. (작성: 로그인 필요)
        </p>

        {local ? (
          <div style={{ display: 'grid', gap: 10 }}>
            {localThread.map((c) => (
              <div key={c.id} className="card">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <strong>@{c.user}</strong> <span className="muted">· {c.createdAt}</span>
                  </div>
                  <div className="pill">local</div>
                </div>
                <pre style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{c.body}</pre>
              </div>
            ))}
            {localThread.length === 0 ? <div className="muted">아직 댓글이 없습니다.</div> : null}
          </div>
        ) : thread ? (
          <div style={{ display: 'grid', gap: 10 }}>
            {thread.comments.map((c) => (
              <div key={c.id} className="card">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <strong>@{c.user}</strong> <span className="muted">· {c.createdAt}</span>
                  </div>
                  <div className="pill">#{thread.issueNumber}</div>
                </div>
                <pre style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{c.body}</pre>
              </div>
            ))}
            {thread.comments.length === 0 ? <div className="muted">아직 댓글이 없습니다.</div> : null}
          </div>
        ) : (
          <div className="muted">
            {threadLoading ? '댓글을 불러오는 중...' : '아직 스레드가 없습니다. (첫 댓글 작성 시 생성)'}
          </div>
        )}

        {!local && threadError ? (
          <div className="muted" style={{ marginTop: 8 }}>
            댓글 로딩 실패: {threadError}
          </div>
        ) : null}

        <div className="card" style={{ marginTop: 12 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <div>
                <strong>댓글 작성</strong>
              </div>
              <div className="muted">{local ? '로컬 모드: 브라우저에만 저장됩니다.' : '로그인 후(허용된 사용자만) 작성할 수 있습니다.'}</div>
            </div>
            {local ? null : !state.accessToken ? (
              <button
                className="btn primary"
                onClick={() => login(`/post/${encodeURIComponent(post.category)}/${encodeURIComponent(post.slug)}`)}
              >
                GitHub 로그인
              </button>
            ) : (
              <div className="pill">@{state.username ?? 'unknown'}</div>
            )}
          </div>

          {local ? (
            <div className="row" style={{ marginTop: 10 }}>
              <input
                className="input"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="name"
              />
            </div>
          ) : null}
          <div style={{ marginTop: 10 }}>
            <textarea
              className="textarea"
              placeholder="댓글을 입력하세요."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={local ? sending : !state.accessToken || !isAllowedUser || sending}
            />
          </div>
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              className="btn primary"
              disabled={local ? sending || !comment.trim() : !state.accessToken || !isAllowedUser || sending || !comment.trim()}
              onClick={async () => {
                setSending(true);
                try {
                    if (local) {
                      addLocalComment({ postId: post.id, user: localName, body: comment.trim() });
                      setComment('');
                      alert('로컬 댓글이 등록되었습니다.');
                    } else {
                      const octokit = getOctokit();
                      const issueNumber = await ensureCommentIssue(octokit, post.id);
                      const res = await createComment(octokit, issueNumber, comment.trim());
                      const data: any = res?.data ?? null;
                      const created = {
                        id: typeof data?.id === 'number' ? data.id : Date.now(),
                        user: String(data?.user?.login ?? state.username ?? 'unknown'),
                        body: String(data?.body ?? comment.trim()),
                        createdAt: String(data?.created_at ?? new Date().toISOString())
                      };
                      setThread((prev) => {
                        const base =
                          prev && prev.issueNumber === issueNumber
                            ? prev
                            : { postId: post.id, issueNumber, comments: [] };
                        return { ...base, comments: [...base.comments, created] };
                      });
                      setComment('');
                      alert('댓글이 등록되었습니다.');
                    }
                } catch (e) {
                  alert(e instanceof Error ? e.message : String(e));
                } finally {
                  setSending(false);
                }
              }}
            >
              {sending ? '전송 중...' : '댓글 등록'}
            </button>
          </div>

          {!local && state.accessToken && !isAllowedUser ? (
            <div className="muted" style={{ marginTop: 8 }}>
              이 계정은 `VITE_ALLOWED_USERS`에 포함되지 않아 쓰기 권한이 없습니다.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
