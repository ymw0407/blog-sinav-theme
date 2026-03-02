export type EditorDraftData = {
  title: string;
  datetime: string;
  date?: string; // legacy
  category: string;
  tags: string;
  summary: string;
  thumbnail: { src: string; alt?: string } | null;
  // legacy: "draft" used to exist as a publish flag; editor now always autosaves without a draft mode.
  draft?: boolean;
  doc: any;
};

export type EditorDraft = {
  key: string;
  updatedAt: string;
  data: EditorDraftData;
};

const PREFIX = 'blog.editor.draft.v1:';

function storageKey(key: string) {
  return `${PREFIX}${key}`;
}

export function getEditorDraft(key: string): EditorDraft | null {
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EditorDraft> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.updatedAt !== 'string') return null;
    if (!parsed.data || typeof parsed.data !== 'object') return null;
    return { key, updatedAt: parsed.updatedAt, data: parsed.data as EditorDraftData };
  } catch {
    return null;
  }
}

export function setEditorDraft(key: string, data: EditorDraftData) {
  const payload: EditorDraft = { key, updatedAt: new Date().toISOString(), data };
  localStorage.setItem(storageKey(key), JSON.stringify(payload));
  return payload;
}

export function clearEditorDraft(key: string) {
  localStorage.removeItem(storageKey(key));
}
