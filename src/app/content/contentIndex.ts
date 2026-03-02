import contentIndex from '../../generated/content-index.json';
import timelineIndex from '../../generated/timeline-index.json';
import galleryIndex from '../../generated/gallery-index.json';
import albumsIndex from '../../generated/albums-index.json';
import portfolioIndex from '../../generated/portfolio-index.json';
import commentsIndex from '../../generated/comments-index.json';
import type {
  AlbumsIndex,
  CommentsIndex,
  ContentIndex,
  GalleryIndex,
  PortfolioIndex,
  PostCategory,
  PostIndexItem,
  TimelineIndex
} from './types';
import { isLocalMode } from '../mode';
import { listLocalPosts } from '../local/postsStore';
import { listLocalAlbums } from '../local/albumsStore';
import { listLocalWorks } from '../local/galleryStore';
import { getLocalPortfolio } from '../local/portfolioStore';
import { coerceIsoDatetime } from '../../shared/lib/datetime';

export function getContentIndex() {
  return contentIndex as ContentIndex;
}

export function getTimelineIndex() {
  return timelineIndex as TimelineIndex;
}

export function getGalleryIndex() {
  const base = galleryIndex as GalleryIndex;
  // Local gallery works live in the viewer's browser storage. We merge them in regardless of mode
  // so the author doesn't "lose" their locally-added photos when switching auth/modes.
  const locals = listLocalWorks();
  if (locals.length === 0) return base;
  const map = new Map<string, GalleryIndex['works'][number]>();
  for (const w of base.works) map.set(w.id, w);
  for (const w of locals) map.set(w.id, w);
  return { ...base, works: Array.from(map.values()) };
}

export function getAlbumsIndex() {
  return albumsIndex as AlbumsIndex;
}

export function getPortfolioIndex() {
  const base = portfolioIndex as PortfolioIndex;
  const local = getLocalPortfolio();
  if (!local) return base;
  const basePortfolio: any = base.portfolio ?? {};
  const localPortfolio: any = local ?? {};

  const isDocEmpty = (doc: any) => {
    const c = doc?.content;
    return !c?.length || (c.length === 1 && c[0]?.type === 'paragraph' && !c[0]?.content?.length);
  };

  const merged: any = { ...basePortfolio, ...localPortfolio };

  // Resolve profile conflicts: avoid "empty local state" wiping a real saved profile.
  const bp = basePortfolio.profile ?? null;
  const lp = localPortfolio.profile ?? null;
  if (bp || lp) {
    const baseUpdatedAt = typeof bp?.updatedAt === 'string' ? bp.updatedAt : '';
    const localUpdatedAt = typeof lp?.updatedAt === 'string' ? lp.updatedAt : '';
    const baseHasDoc = bp?.doc && !isDocEmpty(bp.doc);
    const localHasDoc = lp?.doc && !isDocEmpty(lp.doc);

    let nextProfile = bp ?? {};
    if (lp) {
      const localIsNewer = localUpdatedAt && baseUpdatedAt ? localUpdatedAt >= baseUpdatedAt : Boolean(localUpdatedAt);
      if (localHasDoc && (localIsNewer || !baseHasDoc)) nextProfile = { ...(bp ?? {}), ...lp };
      else if (!localHasDoc && baseHasDoc) nextProfile = bp;
      else if (localIsNewer) nextProfile = { ...(bp ?? {}), ...lp };
    }
    merged.profile = nextProfile;
  }

  return { ...base, portfolio: merged };
}

export function getCommentsIndex() {
  return commentsIndex as CommentsIndex;
}

export function getAlbumsMerged() {
  const base = getAlbumsIndex().albums;
  // Similar to gallery: merge local albums regardless of mode so switching auth/modes
  // doesn't make locally-created albums "disappear" for the author.
  const locals = listLocalAlbums();
  if (locals.length === 0) return base;
  const map = new Map<string, (typeof base)[number]>();
  for (const a of base) map.set(a.id, a);
  for (const a of locals) map.set(a.id, a);
  return Array.from(map.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

function mergePosts(): PostIndexItem[] {
  const base = getContentIndex().posts.map((p) => ({ ...p, source: 'static' as const }));
  if (!isLocalMode()) return base;
  const locals = listLocalPosts().map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    datetime: p.datetime ?? p.date,
    date: (p.datetime ?? p.date ?? '').slice(0, 10),
    category: p.category,
    tags: p.tags,
    summary: p.summary,
    thumbnail: p.thumbnail,
    draft: p.draft,
    kind: 'doc' as const,
    doc: p.doc,
    source: 'local' as const
  }));
  const map = new Map<string, PostIndexItem>();
  for (const p of base) map.set(p.id, p);
  for (const p of locals) map.set(p.id, p);
  const dt = (x: PostIndexItem) => coerceIsoDatetime((x as any).datetime ?? (x as any).date);
  return Array.from(map.values()).sort((a, b) => dt(b).localeCompare(dt(a)));
}

export function getAllPostsMerged({ includeDraft = false } = {}) {
  // `draft` is treated as legacy metadata; content is always visible.
  // Keep the option for API compatibility (ignored).
  void includeDraft;
  return mergePosts().sort((a, b) =>
    coerceIsoDatetime((b as any).datetime ?? (b as any).date).localeCompare(coerceIsoDatetime((a as any).datetime ?? (a as any).date))
  );
}

export function getPostById(postId: string): PostIndexItem | null {
  return mergePosts().find((p) => p.id === postId) ?? null;
}

export function getPostsByCategory(category: PostCategory, { includeDraft = false } = {}) {
  void includeDraft;
  return mergePosts()
    .filter((p) => p.category === category)
    .sort((a, b) => coerceIsoDatetime((b as any).datetime ?? (b as any).date).localeCompare(coerceIsoDatetime((a as any).datetime ?? (a as any).date)));
}

export function getPostsByTag(tag: string, { includeDraft = false } = {}) {
  void includeDraft;
  return mergePosts()
    .filter((p) => p.tags.includes(tag))
    .sort((a, b) => coerceIsoDatetime((b as any).datetime ?? (b as any).date).localeCompare(coerceIsoDatetime((a as any).datetime ?? (a as any).date)));
}

export function getTimelinePosts(params: {
  tag?: string | null;
  category?: PostCategory | null;
  includeDraft?: boolean;
}) {
  const includeDraft = params.includeDraft ?? false;
  void includeDraft;
  let posts = mergePosts();
  if (params.category) posts = posts.filter((p) => p.category === params.category);
  const tag = params.tag ?? null;
  if (tag) posts = posts.filter((p) => p.tags.includes(tag));
  return posts.sort((a, b) => coerceIsoDatetime((b as any).datetime ?? (b as any).date).localeCompare(coerceIsoDatetime((a as any).datetime ?? (a as any).date)));
}
