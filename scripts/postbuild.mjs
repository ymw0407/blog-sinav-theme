import fs from 'node:fs/promises';
import path from 'node:path';

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

async function main() {
  const root = process.cwd();
  const distDir = path.join(root, 'dist');
  if (!(await exists(distDir))) return;

  const siteUrl = normalizeSiteUrl(process.env.VITE_SITE_URL);
  const basePath = normalizeBasePath(process.env.VITE_BASE_PATH);
  const canonicalBase = siteUrl ? new URL(basePath, siteUrl).href : '';

  const robotsLines = ['User-agent: *', 'Allow: /'];
  if (canonicalBase) robotsLines.push(`Sitemap: ${canonicalBase}sitemap.xml`);
  robotsLines.push('');
  await fs.writeFile(path.join(distDir, 'robots.txt'), robotsLines.join('\n'), 'utf8');

  if (!canonicalBase) {
    // If SITE_URL isn't configured, skip sitemap generation (sitemaps require absolute URLs).
    return;
  }

  const generatedDir = path.join(root, 'src', 'generated');
  const contentIndexFile = path.join(generatedDir, 'content-index.json');
  let generatedAt = new Date().toISOString();
  const urls = [canonicalBase];

  try {
    const raw = await fs.readFile(contentIndexFile, 'utf8');
    const parsed = JSON.parse(raw);
    generatedAt = String(parsed?.generatedAt || generatedAt);
  } catch {
    // optional
  }

  // Dedupe
  const uniqueUrls = Array.from(new Set(urls));

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...uniqueUrls.map((loc) => {
      return `  <url><loc>${xmlEscape(loc)}</loc><lastmod>${xmlEscape(generatedAt)}</lastmod></url>`;
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
