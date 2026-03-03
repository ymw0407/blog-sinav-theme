export function resolvePublicUrl(input: string): string {
  const src = String(input ?? '').trim();
  if (!src) return src;

  // Special schemes handled elsewhere or already self-contained.
  if (src.startsWith('local-media:')) return src;
  if (src.startsWith('data:')) return src;
  if (src.startsWith('blob:')) return src;

  // Absolute URLs: http(s), etc.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(src)) return src;

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
  return `${baseNorm}${src.replace(/^\.?\//, '')}`;
}

