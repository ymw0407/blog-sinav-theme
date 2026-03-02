# OAuth App Setup (PKCE)

> 이 문서는 OAuth App 기준입니다. (백엔드 없이 PKCE)

1. GitHub > Settings > Developer settings > OAuth Apps > New OAuth App
2. Homepage URL: Pages 주소 또는 로컬 주소
3. Authorization callback URL:
   - 권장(redirect URI에 fragment 금지): `http://localhost:5173/` / `https://<owner>.github.io/<repo>/`
   - (옵션) callback route를 쓰고 싶다면: `https://<owner>.github.io/<repo>/#/auth/callback`

`.env`에 아래를 설정합니다.

- `VITE_GITHUB_CLIENT_ID`
- `VITE_GITHUB_REDIRECT_URI`

## 보안 주의

- `client_secret`은 절대 사용하지 않습니다.
- Access Token은 메모리에만 보관합니다.
