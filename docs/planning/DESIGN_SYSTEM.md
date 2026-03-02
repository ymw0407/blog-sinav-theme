# DESIGN_SYSTEM

## 철학

- 배경은 항상 무채색(라이트=화이트, 다크=니어-블랙)
- 포인트 컬러는 제한된 영역에만 적용
  - 링크 hover
  - primary 버튼
  - active nav indicator
  - 타임라인 포인트
  - 선택된 태그
- 여백 중심, 구조적 질서, subtle 모션

## 토큰 구조 (vanilla-extract)

- `src/styles/tokens/baseColor.css.ts`: 라이트/다크 뉴트럴 베이스
- `src/styles/tokens/accentColor.css.ts`: 카테고리별 포인트 컬러
- `src/styles/tokens/theme.css.ts`: CSS 변수 계약 + `html[data-theme]`, `html[data-category]` 매핑

## 전환 UX

- route 변경 시 `html[data-category]`만 업데이트
- 포인트 컬러를 사용하는 요소에 `transition`을 부여하여 200~400ms 부드러운 전환

## 배경 모션

- `AppBackground`: 블러 처리된 neutral blob 2~3개 drift
- `prefers-reduced-motion: reduce`에서 애니메이션 비활성화

