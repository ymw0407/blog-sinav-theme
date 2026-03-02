# MEDIA_STORAGE

이 프로젝트는 **백엔드 없이** 동작하는 것을 전제로 합니다.

## 기본(권장): Repo B에 assets 커밋

- 드래그&드롭으로 이미지를 추가하면(로그인 상태) Repo B의 `assets/**`로 커밋됩니다.
- 빌드 시 `content/assets/**` → `blog-web/public/media/assets/**`로 복사되어 정적으로 서빙됩니다.

## 외부 스토리지(Drive / S3 / GCS): Manifest 방식

백엔드 없이 “편하게” 연동하려면, 런타임 API 호출이 아니라 **빌드 시점에 정적 목록(manifest)** 을 사용합니다.

### 1) manifest 파일 만들기

Repo B에 아래 형태의 JSON을 커밋합니다:

`albums/manifests/<albumId>.json`

```json
[
  { "src": "https://.../img1.jpg", "alt": "..." },
  { "src": "https://.../img2.jpg" }
]
```

### 2) albums.json에서 manifest 연결

`albums/albums.json`의 앨범 항목에:

```json
{
  "id": "album-remote-001",
  "title": "Remote Album",
  "date": "2026-02-27",
  "source": { "type": "manifest", "manifestPath": "albums/manifests/album-remote-001.json" }
}
```

### 3) 빌드에서 자동 resolve

Repo A의 `scripts/index-content.mjs`가 `manifestPath`를 읽어 `album.items`를 채웁니다.

## Drive/S3/GCS 주의사항

- **비공개 버킷/드라이브 파일**은 브라우저에서 바로 접근할 수 없습니다(서명 URL/프록시 필요).
- 백엔드 없이 하려면 “public URL” 또는 “정적 호스팅”으로 노출된 URL을 manifest에 넣는 방식이 안전합니다.

