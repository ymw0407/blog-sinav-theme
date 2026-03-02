# COMMIT STRATEGY

## Conventional Commits

형식:

```
type(scope): message
```

types:

- `feat`
- `fix`
- `refactor`
- `docs`
- `chore`
- `style`
- `test`

## 브랜치 전략

- `main`: 항상 배포 가능 상태
- `feature/*`
- `fix/*`
- `docs/*`
- `refactor/*`

## 웹 업로드 자동 커밋 메시지

예:

```
feat(post): add dev/my-post

Generated-By: blog-web
Source-User: <github-username>
```

