# blog-web (Repo A)

React + TypeScript + Vite 기반의 GitHub Pages 블로그 웹앱입니다.

- Read: 빌드 시 생성되는 정적 JSON 인덱스(`src/generated/*.json`)
- Write(선택): GitHub OAuth (Authorization Code + PKCE) + Octokit으로 Repo B에 커밋
- 2-Repo: Repo A(`blog-web`) + Repo B(`blog-content`)

## Quick Start (Local)

```bash
pnpm install
pnpm run index-content
pnpm dev
```

`pnpm run index-content`는 `content/`(Repo B checkout 경로)를 스캔해 인덱스를 생성합니다.  
로컬 개발에서 GitHub 연동 없이도(LOCAL 모드) 글/앨범/댓글을 작성해 볼 수 있습니다.

## Docs

- Planning: `docs/planning/`
- Setup: `docs/setup/`
