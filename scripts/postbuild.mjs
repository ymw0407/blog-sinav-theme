import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

function normalizeBasePath(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return '/';
  if (!raw.startsWith('/')) return `/${raw}`;
  return raw.endsWith('/') ? raw : `${raw}/`;
}

function normalizeSiteUrl(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  try {
    const u = new URL(raw);
    return u.href.endsWith('/') ? u.href : `${u.href}/`;
  } catch {
    return '';
  }
}

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function toIsoLastmod(input, fallback) {
  const raw = String(input ?? '').trim();
  if (!raw) return fallback;
  // Accept either "YYYY-MM-DD" or ISO datetime.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T00:00:00.000Z`;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toISOString();
}

async function main() {
  const root = process.cwd();
  const distDir = path.join(root, 'dist');
  if (!(await exists(distDir))) return;

  const indexHtmlFile = path.join(distDir, 'index.html');
  const indexHtml = (await exists(indexHtmlFile)) ? await fs.readFile(indexHtmlFile, 'utf8') : '';

  const siteUrl = normalizeSiteUrl(process.env.VITE_SITE_URL);
  const basePath = normalizeBasePath(process.env.VITE_BASE_PATH);
  const baseNoSlash = basePath === '/' ? '' : basePath.replace(/\/$/, '');
  const canonicalBase = siteUrl ? new URL(basePath, siteUrl).href : '';

  const robotsLines = ['User-agent: *', 'Allow: /'];
  if (canonicalBase) robotsLines.push(`Sitemap: ${canonicalBase}sitemap.xml`);
  robotsLines.push('');
  await fs.writeFile(path.join(distDir, 'robots.txt'), robotsLines.join('\n'), 'utf8');

  // GitHub Pages SPA fallback: redirect unknown routes to the app entrypoint.
  // Also ensures OAuth callback deep-link works even if the route isn't a real file.
  const fallback404 = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="refresh" content="0; url=${xmlEscape(baseNoSlash || '/')}" />
    <title>Redirecting…</title>
  </head>
  <body>
    <script>
      (function () {
        var BASE = ${JSON.stringify(basePath)};
        var base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE; // "/repo" or ""
        var l = window.location;
        // If we already have a forwarded path, stop (avoid loops).
        if (l.search && l.search.indexOf('__p=') !== -1) return;
        var rest = l.pathname.indexOf(base) === 0 ? l.pathname.slice(base.length) : l.pathname;
        if (!rest) rest = '/';
        var target = base + '/?__p=' + encodeURIComponent(rest + l.search + l.hash);
        l.replace(l.origin + target);
      })();
    </script>
  </body>
</html>
`;
  await fs.writeFile(path.join(distDir, '404.html'), fallback404, 'utf8');

  const generatedDir = path.join(root, 'src', 'generated');
  const contentIndexFile = path.join(generatedDir, 'content-index.json');
  let generatedAt = new Date().toISOString();
  const routes = new Set(['']); // '' represents the homepage
  const entries = [];
  const add = (rel, lastmod = generatedAt, opts = {}) => {
    const route = String(rel || '').replace(/^\/+/, '').replace(/\/$/, '');
    routes.add(route);
    if (!canonicalBase) return;
    const href = new URL(route ? `${route}/` : '', canonicalBase).href;
    entries.push({ loc: href, lastmod, ...opts });
  };

  add('', generatedAt, { changefreq: 'weekly', priority: '1.0' });

  try {
    const raw = await fs.readFile(contentIndexFile, 'utf8');
    const parsed = JSON.parse(raw);
    generatedAt = String(parsed?.generatedAt || generatedAt);

    const posts = Array.isArray(parsed?.posts) ? parsed.posts : [];
    const lastmodByCategory = new Map();
    for (const p of posts) {
      if (!p || p.draft === true) continue;
      const category = typeof p.category === 'string' ? p.category : '';
      const slug = typeof p.slug === 'string' ? p.slug : '';
      if (!category || !slug) continue;
      const postLastmod = toIsoLastmod(p.datetime ?? p.date, generatedAt);
      const rel = `post/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`;
      add(rel, postLastmod, { changefreq: 'monthly', priority: '0.7' });

      const prev = lastmodByCategory.get(category);
      if (!prev || postLastmod > prev) lastmodByCategory.set(category, postLastmod);
    }

    // Categories: lastmod = latest post in that category (fallback: generatedAt).
    for (const [cat, lm] of lastmodByCategory.entries()) {
      add(`category/${encodeURIComponent(cat)}`, lm, { changefreq: 'weekly', priority: '0.6' });
    }
  } catch {
    // optional
  }

  try {
    const siteYmlFile = path.join(root, 'src', 'config', 'site.yml');
    const raw = await fs.readFile(siteYmlFile, 'utf8');
    const parsed = YAML.parse(raw);
    const cats = Array.isArray(parsed?.categories) ? parsed.categories : [];
    for (const c of cats) {
      const key = typeof c?.key === 'string' ? c.key : '';
      if (!key) continue;
      // If not already added (from content-index-derived lastmod), add with a fallback lastmod.
      add(`category/${encodeURIComponent(key)}`, generatedAt, { changefreq: 'weekly', priority: '0.6' });
    }
  } catch {
    // optional
  }

  // Common top-level routes (exclude auth/editor/edit pages).
  for (const r of ['about', 'timeline', 'albums', 'gallery', 'resume', 'profile']) {
    add(r, generatedAt, { changefreq: 'weekly', priority: '0.5' });
  }

  // Create concrete HTML entrypoints so GitHub Pages serves 200 (not 404) for SPA routes.
  if (indexHtml) {
    for (const rel of routes) {
      const route = String(rel || '').replace(/^\/+/, '').replace(/\/$/, '');
      if (!route) continue;
      const dir = path.join(distDir, route);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, 'index.html'), indexHtml, 'utf8');
    }
  }

  if (!canonicalBase) {
    // If SITE_URL isn't configured, skip sitemap generation (sitemaps require absolute URLs).
    return;
  }

  const deduped = new Map();
  for (const e of entries) {
    const prev = deduped.get(e.loc);
    if (!prev || String(e.lastmod || '') > String(prev.lastmod || '')) deduped.set(e.loc, e);
  }
  const uniqueEntries = Array.from(deduped.values()).sort((a, b) => String(a.loc).localeCompare(String(b.loc)));

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...uniqueEntries.map((e) => {
      const parts = [
        `  <url>`,
        `<loc>${xmlEscape(e.loc)}</loc>`,
        `<lastmod>${xmlEscape(toIsoLastmod(e.lastmod, generatedAt))}</lastmod>`,
        e.changefreq ? `<changefreq>${xmlEscape(e.changefreq)}</changefreq>` : '',
        e.priority ? `<priority>${xmlEscape(e.priority)}</priority>` : '',
        `</url>`
      ].filter(Boolean);
      return parts.join('');
    }),
    '</urlset>',
    ''
  ].join('\n');

  await fs.writeFile(path.join(distDir, 'sitemap.xml'), xml, 'utf8');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
