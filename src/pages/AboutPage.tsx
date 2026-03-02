import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="card prose">
      <h1 style={{ marginTop: 0 }}>About</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        GitHub Pages 기반 개인 블로그. Read는 정적 인덱스, Write는 (옵션) GitHub OAuth(PKCE)로 동작합니다.
      </p>

      <h2>Architecture</h2>
      <ul>
        <li>Read: 빌드 시 생성되는 JSON 인덱스 기반 (`content-index.json`, `timeline-index.json`)</li>
        <li>Write: GitHub OAuth(PKCE) 로그인 후 Octokit으로 content repo에 커밋</li>
        <li>content repo 변경 시 `repository_dispatch`로 web repo 빌드/배포 트리거</li>
      </ul>

      <h2>Security</h2>
      <ul>
        <li>`client_secret`은 사용하지 않음 (PKCE)</li>
        <li>`access_token`은 메모리에만 보관 (localStorage 저장 안 함)</li>
        <li>MDX는 Markdown only + sanitize 적용</li>
      </ul>

      <h2>Links</h2>
      <div className="row">
        <Link to="/timeline" className="pill">
          Timeline
        </Link>
        <Link to="/editor" className="pill">
          Post
        </Link>
      </div>
    </div>
  );
}

