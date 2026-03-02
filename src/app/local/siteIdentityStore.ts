export type SiteIdentity = {
  // Brand title shown in the navbar (left side).
  siteName?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  kicker?: string;
  // New: multiple images supported (carousel). Stored as "cover" style (object-fit: cover).
  heroMedia?: { src: string; alt?: string }[] | null;
  // Legacy: single image field. Kept for backward compatibility.
  heroImage?: { src: string; alt?: string } | null;
  social?: { icon?: 'github' | 'instagram' | 'linkedin' | 'website' | 'email'; label: string; url: string }[] | null;
};

const KEY = 'blog.local.siteIdentity.v1';
const EVT = 'blog.siteIdentity.update';

let cachedLoaded = false;
let cached: SiteIdentity | null = null;

function readFromStorage(): SiteIdentity | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const data = parsed as SiteIdentity;
    // Normalize legacy single-image storage into the new array form.
    const media = Array.isArray((data as any).heroMedia) ? ((data as any).heroMedia as any[]).filter((x) => x && typeof x === 'object' && typeof x.src === 'string') : null;
    const legacy = (data as any).heroImage;
    if ((!media || media.length === 0) && legacy && typeof legacy === 'object' && typeof legacy.src === 'string' && legacy.src) {
      return { ...data, heroMedia: [{ src: legacy.src, alt: typeof legacy.alt === 'string' ? legacy.alt : undefined }] };
    }
    if (media) return { ...data, heroMedia: media.map((m) => ({ src: String((m as any).src), alt: typeof (m as any).alt === 'string' ? (m as any).alt : undefined })) };
    return data;
  } catch {
    return null;
  }
}

function ensureLoaded() {
  if (cachedLoaded) return;
  cachedLoaded = true;
  if (typeof window === 'undefined') {
    cached = null;
    return;
  }
  cached = readFromStorage();
}

function emit() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(EVT));
}

export function getSiteIdentity(): SiteIdentity | null {
  ensureLoaded();
  return cached;
}

export function setSiteIdentity(next: SiteIdentity) {
  cachedLoaded = true;
  cached = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  emit();
}

export function clearSiteIdentity() {
  cachedLoaded = true;
  cached = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  emit();
}

export function subscribeSiteIdentity(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}
