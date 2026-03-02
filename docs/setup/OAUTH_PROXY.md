# OAuth Proxy (CORS Fix)

GitHub OAuth의 토큰 교환 엔드포인트(`https://github.com/login/oauth/access_token`)는 브라우저에서 CORS로 막힙니다.
그래서 SPA(이 프로젝트)는 **토큰 교환만 서버 측 프록시**를 통해 수행해야 합니다.

이 프로젝트는 Cloudflare Workers용 최소 프록시를 함께 제공합니다.

## 1) Cloudflare Worker 배포

`blog-web/workers/oauth-proxy` 폴더에서:

```bash
cd workers/oauth-proxy
pnpm dlx wrangler deploy
```

배포가 끝나면 Worker URL이 생성됩니다:

`https://<name>.<subdomain>.workers.dev`

## 2) (옵션) client_secret 설정

대부분의 경우 토큰 교환 시 `client_secret`이 필요합니다. Worker에 secret으로 설정하세요:

```bash
cd workers/oauth-proxy
pnpm dlx wrangler secret put GITHUB_CLIENT_SECRET
```

## 3) (권장) Origin 잠그기

내 사이트 1개만 허용하려면 CORS Origin을 allowlist로 제한하세요.

`workers/oauth-proxy/wrangler.toml`의 `ALLOWED_ORIGINS`에 다음처럼 넣고 다시 배포합니다.

예:

- `https://ymw0407.github.io`
- `http://localhost:5173`

```toml
[vars]
ALLOWED_ORIGINS = "https://ymw0407.github.io,http://localhost:5173"
```

원하면 `ALLOWED_CLIENT_IDS`도 설정해서 특정 OAuth App만 프록시를 사용하게 제한할 수 있습니다.

## 3) blog-web에 프록시 URL 연결

배포된 Worker URL을 `VITE_OAUTH_PROXY_URL`로 설정합니다.

- Local dev: `blog-web/.env.local`
- GitHub Pages: Repo A(Settings → Actions → Variables)에서 `VITE_OAUTH_PROXY_URL` 추가

Worker가 제공하는 엔드포인트는 다음입니다:

- `POST /github/oauth/access_token`

body는 `application/x-www-form-urlencoded` 그대로 전달됩니다.
