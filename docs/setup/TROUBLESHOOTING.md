# TROUBLESHOOTING

## OAuth state/verifier 오류

- 리다이렉트 중 세션이 초기화되면 `Missing code_verifier`가 발생할 수 있습니다.
- 시크릿 모드/브라우저 확장으로 sessionStorage가 차단되는지 확인하세요.

## GitHub OAuth CORS

GitHub OAuth 토큰 교환 엔드포인트는 환경에 따라 CORS 제약이 있을 수 있습니다. 이 프로젝트는 preflight를 피하기 위해 `application/x-www-form-urlencoded`를 사용합니다.

