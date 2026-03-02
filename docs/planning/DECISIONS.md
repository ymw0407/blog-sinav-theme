# DECISIONS

## 2026-02-26: HashRouter 선택

GitHub Pages의 SPA 라우팅(404) 문제를 피하기 위해 `HashRouter`를 기본으로 사용한다.

## 2026-02-26: MDX에서 JSX/Expression 비활성화

XSS 및 임의 코드 실행 위험을 줄이기 위해 MDX 파일 확장자는 사용하되, JSX/Expression은 빌드에서 실패하도록 차단한다.

