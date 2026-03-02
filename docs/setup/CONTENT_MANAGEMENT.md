# CONTENT_MANAGEMENT (Repo B: blog-content)

## 구조

```
posts/
  dev/
  coffee/
  travel/
  photo/
gallery/
albums/
portfolio/
```

## 글(frontmatter)

- `title`
- `date` (YYYY-MM-DD)
- `category` (dev/travel/photo)
  - 추가: coffee
- `tags` (array)
- `summary`
- `draft` (optional)

## 인덱싱

Repo A의 `scripts/index-content.mjs`가 Repo B를 스캔하여:

- `src/generated/content-index.json`
- `src/generated/timeline-index.json`

을 생성합니다.

## 앨범

`albums/albums.json`에 아래 형태로 작성합니다.

- `items`: `{ src, alt?, caption? }[]`
- (옵션) `period`: `{ from, to? }`
- (옵션) `source.type="manifest"` + `manifestPath`: 외부 스토리지 URL 목록을 별도 JSON으로 관리
