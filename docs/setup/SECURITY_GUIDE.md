# SECURITY_GUIDE

## 금지

- client_secret 사용 금지
- localStorage에 access_token 저장 금지

## XSS 방어

- MDX JSX/Expression 비활성화(빌드 실패)
- HTML sanitize 적용(rehype-sanitize)
- 외부 링크는 `rel="noreferrer"` 적용

## 최소 권한

- `VITE_ALLOWED_USERS`로 쓰기 사용자 제한
- Repo 권한이 최종 통제 수단(Repo B에 push 권한이 없는 사용자는 커밋 불가)

