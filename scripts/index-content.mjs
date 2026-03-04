import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import YAML from 'yaml';
import { Octokit } from '@octokit/rest';

const ROOT = process.cwd();
const GENERATED_DIR = path.join(ROOT, 'src', 'generated');

function toPosix(p) {
  return p.split(path.sep).join('/');
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function rimraf(dir) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const from = path.join(src, e.name);
    const to = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(from, to);
    else await fs.copyFile(from, to);
  }
}

function assertFrontmatter(file, fm) {
  const required = ['title', 'category', 'tags', 'summary'];
  for (const k of required) {
    if (fm[k] === undefined) throw new Error(`[${file}] missing frontmatter: ${k}`);
  }
  if (!Array.isArray(fm.tags)) throw new Error(`[${file}] tags must be an array`);
}

function computeTags(posts) {
  const map = new Map();
  for (const p of posts) {
    for (const t of p.tags) map.set(t, (map.get(t) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

function normalizeThumbnail(input) {
  if (!input) return null;
  if (typeof input === 'string') return { src: input };
  if (typeof input === 'object' && typeof input.src === 'string') {
    const alt = typeof input.alt === 'string' ? input.alt : undefined;
    return { src: input.src, ...(alt ? { alt } : {}) };
  }
  return null;
}

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  return JSON.parse(text);
}

function readRepoFromEnv() {
  const owner = String(process.env.VITE_CONTENT_REPO_OWNER ?? '').trim();
  const repo = String(process.env.VITE_CONTENT_REPO_NAME ?? '').trim();
  if (owner && repo) return { owner, repo };

  const contentRepo = String(process.env.CONTENT_REPO ?? '').trim();
  if (contentRepo && contentRepo.includes('/')) {
    const [o, r] = contentRepo.split('/');
    if (o && r) return { owner: o, repo: r };
  }

  return null;
}

function readGitHubTokenFromEnv() {
  const candidates = [
    process.env.CONTENT_REPO_TOKEN,
    process.env.GITHUB_TOKEN,
    process.env.GH_TOKEN,
    process.env.GITHUB_API_TOKEN
  ];
  for (const t of candidates) {
    const token = String(t ?? '').trim();
    if (token) return token;
  }
  return null;
}

function extractPostIdFromIssue(issue) {
  const title = String(issue?.title ?? '');
  const body = String(issue?.body ?? '');

  const m1 = title.match(/^Comments:\s*(.+)\s*$/);
  if (m1?.[1]) return m1[1].trim();

  const m2 = body.match(/postId:\s*`([^`]+)`/i);
  if (m2?.[1]) return m2[1].trim();

  return null;
}

async function fetchCommentThreads({ owner, repo }) {
  const token = readGitHubTokenFromEnv();
  const octokit = new Octokit(token ? { auth: token } : {});

  const issues = await octokit.paginate(octokit.issues.listForRepo, {
    owner,
    repo,
    labels: 'blog-comment',
    state: 'all',
    per_page: 100
  });

  const threads = [];
  for (const issue of issues) {
    const postId = extractPostIdFromIssue(issue);
    if (!postId) continue;
    if (!issue?.number) continue;

    const comments = await octokit.paginate(octokit.issues.listComments, {
      owner,
      repo,
      issue_number: issue.number,
      per_page: 100
    });

    threads.push({
      postId,
      issueNumber: issue.number,
      comments: comments
        .map((c) => ({
          id: c.id,
          user: c.user?.login ?? 'ghost',
          body: c.body ?? '',
          createdAt: c.created_at ?? new Date().toISOString()
        }))
        .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    });
  }

  threads.sort((a, b) => String(a.postId).localeCompare(String(b.postId)));
  return threads;
}

async function main() {
  const contentDir = path.join(ROOT, 'content');
  const rootDir = contentDir;
  const rootPrefix = '/content';

  let allowedCategories = null;
  try {
    const siteYml = path.join(ROOT, 'src', 'config', 'site.yml');
    const raw = await fs.readFile(siteYml, 'utf8');
    const parsed = YAML.parse(raw);
    const keys = Array.isArray(parsed?.categories) ? parsed.categories.map((c) => String(c?.key)).filter(Boolean) : [];
    allowedCategories = keys.length ? keys : null;
  } catch {
    // optional
  }

  const postsRoot = path.join(rootDir, 'posts');
  const allFiles = (await exists(postsRoot)) ? await walk(postsRoot) : [];
  const mdxFiles = allFiles.filter((f) => f.endsWith('.mdx'));
  const jsonFiles = allFiles.filter((f) => f.endsWith('.json'));

  const posts = [];
  for (const file of mdxFiles) {
    const rel = path.relative(rootDir, file);
    const slug = path.basename(file, '.mdx');
    const parsed = matter(await fs.readFile(file, 'utf8'));
    const fm = parsed.data ?? {};
    assertFrontmatter(rel, fm);
    if (allowedCategories && !allowedCategories.includes(String(fm.category))) {
      throw new Error(`[${rel}] invalid category (not in site.yml): ${fm.category}`);
    }
    const datetime = fm.datetime ?? fm.date;
    if (datetime === undefined) throw new Error(`[${rel}] missing frontmatter: datetime (or legacy date)`);
    const id = `${fm.category}/${slug}`;
    const thumbnail = normalizeThumbnail(fm.thumbnail);
    posts.push({
      id,
      slug,
      title: String(fm.title),
      datetime: String(datetime),
      date: String(String(datetime).slice(0, 10)),
      category: String(fm.category),
      tags: fm.tags.map(String),
      summary: String(fm.summary),
      ...(thumbnail ? { thumbnail } : {}),
      draft: Boolean(fm.draft),
      kind: 'mdx',
      mdxImportPath: `${rootPrefix}/${toPosix(rel)}`
    });
  }

  for (const file of jsonFiles) {
    const rel = path.relative(rootDir, file);
    const slug = path.basename(file, '.json');
    const raw = await readJson(file);
    const fm = raw ?? {};
    assertFrontmatter(rel, fm);
    if (allowedCategories && !allowedCategories.includes(String(fm.category))) {
      throw new Error(`[${rel}] invalid category (not in site.yml): ${fm.category}`);
    }
    const datetime = fm.datetime ?? fm.date;
    if (datetime === undefined) throw new Error(`[${rel}] missing frontmatter: datetime (or legacy date)`);
    const id = `${fm.category}/${slug}`;
    const thumbnail = normalizeThumbnail(fm.thumbnail);
    posts.push({
      id,
      slug,
      title: String(fm.title),
      datetime: String(datetime),
      date: String(String(datetime).slice(0, 10)),
      category: String(fm.category),
      tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [],
      summary: String(fm.summary),
      ...(thumbnail ? { thumbnail } : {}),
      draft: Boolean(fm.draft),
      kind: 'doc',
      docImportPath: `${rootPrefix}/${toPosix(rel)}`
    });
  }

  posts.sort((a, b) => String(b.datetime ?? b.date ?? '').localeCompare(String(a.datetime ?? a.date ?? '')));

  const timeline = posts
    .filter((p) => !p.draft)
    .map((p) => ({ postId: p.id, datetime: p.datetime ?? p.date, date: p.date }))
    .sort((a, b) => String(b.datetime ?? b.date ?? '').localeCompare(String(a.datetime ?? a.date ?? '')));

  const worksFile = path.join(rootDir, 'gallery', 'works.json');
  const albumsFile = path.join(rootDir, 'albums', 'albums.json');
  const portfolioFile = path.join(rootDir, 'portfolio', 'portfolio.json');
  const siteIdentityFile = path.join(rootDir, 'site', 'identity.json');
  const assetsDir = path.join(rootDir, 'assets');

  const works = (await exists(worksFile)) ? await readJson(worksFile) : [];
  let albums = (await exists(albumsFile)) ? await readJson(albumsFile) : [];
  const portfolio = (await exists(portfolioFile))
    ? await readJson(portfolioFile)
    : { name: '', headline: '', links: [], projects: [] };
  const siteIdentity = (await exists(siteIdentityFile)) ? await readJson(siteIdentityFile) : {};

  if (!Array.isArray(albums)) albums = [];
  // Album manifest support: external providers (Drive/S3/GCS) should generate a manifest JSON
  // and commit it to Repo B. Build time resolves it to album.items.
  albums = await Promise.all(
    albums.map(async (album) => {
      const src = album?.source;
      if (src?.type === 'manifest' && typeof src.manifestPath === 'string') {
        const manifestFile = path.join(rootDir, src.manifestPath);
        if (await exists(manifestFile)) {
          const manifest = await readJson(manifestFile);
          const items = Array.isArray(manifest) ? manifest : manifest?.items;
          if (Array.isArray(items)) return { ...album, items };
        }
      }
      return album;
    })
  );

  // Copy content assets into Repo A public folder for static serving
  const publicMedia = path.join(ROOT, 'public', 'media');
  await rimraf(publicMedia);
  if (await exists(assetsDir)) {
    await copyDir(assetsDir, path.join(publicMedia, 'assets'));
  }

  await fs.mkdir(GENERATED_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();

  await fs.writeFile(
    path.join(GENERATED_DIR, 'content-index.json'),
    JSON.stringify({ generatedAt, posts, tags: computeTags(posts.filter((p) => !p.draft)) }, null, 2),
    'utf8'
  );
  await fs.writeFile(
    path.join(GENERATED_DIR, 'timeline-index.json'),
    JSON.stringify({ generatedAt, items: timeline }, null, 2),
    'utf8'
  );
  await fs.writeFile(
    path.join(GENERATED_DIR, 'gallery-index.json'),
    JSON.stringify({ generatedAt, works }, null, 2),
    'utf8'
  );
  await fs.writeFile(
    path.join(GENERATED_DIR, 'albums-index.json'),
    JSON.stringify({ generatedAt, albums }, null, 2),
    'utf8'
  );
  await fs.writeFile(
    path.join(GENERATED_DIR, 'portfolio-index.json'),
    JSON.stringify({ generatedAt, portfolio }, null, 2),
    'utf8'
  );

  let commentThreads = [];
  const repo = readRepoFromEnv();
  if (repo) {
    try {
      commentThreads = await fetchCommentThreads(repo);
      console.log(`Indexed ${commentThreads.reduce((n, t) => n + (t.comments?.length ?? 0), 0)} comments from ${repo.owner}/${repo.repo}`);
    } catch (e) {
      console.warn(`[comments-index] failed to fetch from ${repo.owner}/${repo.repo}. Falling back to empty index.`);
      console.warn(e instanceof Error ? e.message : String(e));
      commentThreads = [];
    }
  } else {
    console.log('[comments-index] skipped (VITE_CONTENT_REPO_OWNER/NAME not set).');
  }

  await fs.writeFile(
    path.join(GENERATED_DIR, 'comments-index.json'),
    JSON.stringify({ generatedAt, threads: commentThreads }, null, 2),
    'utf8'
  );
  await fs.writeFile(
    path.join(GENERATED_DIR, 'site-identity.json'),
    JSON.stringify({ generatedAt, identity: siteIdentity ?? {} }, null, 2),
    'utf8'
  );

  console.log(`Indexed ${posts.length} posts from content/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
