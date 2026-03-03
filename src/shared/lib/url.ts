export function resolvePublicUrl(input: string): string {
  let src = String(input ?? '').trim();
  if (!src) return src;

  const assetVersion = String((import.meta as any)?.env?.VITE_ASSET_VERSION ?? '').trim();

  // Special schemes handled elsewhere or already self-contained.
  if (src.startsWith('local-media:')) return src;
  if (src.startsWith('data:')) return src;
  if (src.startsWith('blob:')) return src;

  // Absolute URLs: http(s), etc.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(src)) return src;

  // Back-compat: some older content mistakenly used `media/asset/...` (singular).
  // Public folder path is `media/assets/...` (plural).
  if (src.startsWith('media/asset/')) src = `media/assets/${src.slice('media/asset/'.length)}`;
  else if (src === 'media/asset') src = 'media/assets';
  else if (src.startsWith('/media/asset/')) src = `/media/assets/${src.slice('/media/asset/'.length)}`;
  else if (src === '/media/asset') src = '/media/assets';

  const base = String(import.meta.env.BASE_URL || '/');
  const baseNorm = base.endsWith('/') ? base : `${base}/`;

  // Already base-prefixed
  if (src.startsWith(baseNorm)) return src;

  // Root-relative paths should be base-relative in GitHub Pages project sites.
  if (src.startsWith('/')) {
    if (baseNorm === '/') return src;
    return `${baseNorm}${src.replace(/^\/+/, '')}`;
  }

  // Plain relative path: treat as public asset under BASE_URL.
  const resolved = `${baseNorm}${src.replace(/^\.?\//, '')}`;

  // Cache-bust for public assets (not fingerprinted like Vite's /assets/*).
  // Helps when a fresh upload briefly 404s before redeploy and the CDN caches the 404.
  if (assetVersion) {
    const isPublicMedia = resolved.startsWith(`${baseNorm}media/`) || (baseNorm === '/' && resolved.startsWith('/media/'));
    if (isPublicMedia && !resolved.includes('v=')) {
      const [base, hash] = resolved.split('#', 2);
      const sep = base.includes('?') ? '&' : '?';
      return `${base}${sep}v=${encodeURIComponent(assetVersion)}${hash ? `#${hash}` : ''}`;
    }
  }

  return resolved;
}

// Some CDNs / edge caches can temporarily cache a 404 for newly deployed public media paths.
// If a client hits that cached 404, retrying with a semantically equivalent pathname variant
// can bypass the cache key and succeed (if the origin already has the file).
//
// This intentionally returns an absolute URL and inserts a double slash after the origin:
//   https://example.com/media/x.png  -> https://example.com//media/x.png
export function makeMediaCacheBypassUrl(resolvedUrl: string): string | null {
  if (typeof window === 'undefined') return null;

  const raw = String(resolvedUrl ?? '').trim();
  if (!raw) return null;
  if (raw.startsWith('local-media:')) return null;
  if (raw.startsWith('data:')) return null;
  if (raw.startsWith('blob:')) return null;

  let u: URL;
  try {
    u = new URL(raw, window.location.origin);
  } catch {
    return null;
  }

  // Only retry same-origin media paths.
  if (u.origin !== window.location.origin) return null;
  if (!u.pathname.includes('/media/')) return null;

  const pathNoLeading = u.pathname.replace(/^\/+/, '');
  const doubled = `${u.origin}//${pathNoLeading}${u.search}${u.hash}`;
  return doubled === u.href ? null : doubled;
}
