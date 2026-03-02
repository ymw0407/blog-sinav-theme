import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>404</h1>
      <p className="muted">페이지를 찾을 수 없습니다.</p>
      <Link to="/">홈으로</Link>
    </div>
  );
}

