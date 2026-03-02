export type ProfileDraftData = {
  title: string;
  doc: any;
  savedAt?: string; // ISO datetime
};

const KEY_PREFIX = 'blog.local.profileDraft.v1';

export function getProfileDraft(key: string) {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.title !== 'string') return null;
    return parsed as ProfileDraftData;
  } catch {
    return null;
  }
}

export function setProfileDraft(key: string, data: ProfileDraftData) {
  const savedAt = typeof data.savedAt === 'string' && data.savedAt ? data.savedAt : new Date().toISOString();
  localStorage.setItem(`${KEY_PREFIX}:${key}`, JSON.stringify({ ...data, savedAt }));
}

export function clearProfileDraft(key: string) {
  localStorage.removeItem(`${KEY_PREFIX}:${key}`);
}
