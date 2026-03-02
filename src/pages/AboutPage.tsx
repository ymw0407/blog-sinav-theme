import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="card prose">
      <h1 style={{ marginTop: 0 }}>About</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        GitHub Pages 기반 개인 블로그 템플릿 (Read: 정적 인덱스 / Write: PKCE + Octokit).
      </p>

      <h2>Architecture</h2>
      <ul>
        <li>Read: 빌드 시 생성되는 JSON 인덱스 기반 (`content-index.json`, `timeline-index.json`)</li>
        <li>Write: GitHub OAuth(PKCE) 로그인 후 Octokit으로 Repo B에 커밋</li>
        <li>Repo B 이벤트 → `repository_dispatch`로 Repo A 빌드/배포 트리거</li>
      </ul>

      <h2>Security</h2>
      <ul>
        <li>`client_secret` 미사용</li>
        <li>`access_token`은 메모리에만 저장 (localStorage 금지)</li>
        <li>MDX는 Markdown only + sanitize 적용</li>
      </ul>

      <h2>Links</h2>
      <div className="row">
        <Link to="/timeline" className="pill">
          Timeline
        </Link>
        <Link to="/editor" className="pill">
          Write
        </Link>
      </div>
    </div>
  );
}
