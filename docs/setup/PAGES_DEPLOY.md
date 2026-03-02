# PAGES_DEPLOY

## GitHub Pages 설정

- Settings → Pages
- Source: GitHub Actions

## Repository Variables / Secrets

Repo A(`blog-web`)에 아래를 설정합니다.

- Variables
  - `CONTENT_REPO`: `owner/blog-content`
- Secrets
  - `CONTENT_REPO_TOKEN`: Repo B를 checkout 가능한 토큰(최소 권한)

Repo B(`blog-content`)에 아래를 설정합니다.

- Variables
  - `WEB_REPO`: `owner/blog-web`
- Secrets
  - `REPO_DISPATCH_TOKEN`: Repo A에 `repository_dispatch` 가능한 토큰(최소 권한)
