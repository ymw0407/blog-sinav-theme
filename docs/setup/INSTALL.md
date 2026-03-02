# INSTALL (Repo A: blog-web)

## Requirements

- Node 20+
- pnpm 9+

## Run (Local)

```bash
pnpm install
pnpm run index-content
pnpm dev
```

`pnpm run index-content`는 `content/`(Repo B checkout 경로)를 인덱싱합니다. `content/`가 비어 있어도 UI는 빈 상태로 동작합니다.

## Local Mode (No GitHub OAuth)

`.env.local`에 아래를 추가하면 로그인 없이 로컬에서 글/앨범/댓글 작성이 가능합니다.

```bash
VITE_LOCAL_MODE=true
```
