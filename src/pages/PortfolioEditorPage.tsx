import React from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/auth/AuthContext';
import { getPortfolioIndex } from '../app/content/contentIndex';
import type { Portfolio } from '../app/content/types';
import { getEnv } from '../app/env';
import { uploadPortfolioAsset, upsertPortfolioJsonInRepo } from '../app/content/portfolioRepo';
import { saveLocalImage } from '../app/local/mediaStore';
import { setLocalPortfolio } from '../app/local/portfolioStore';
import { isGitHubWriteEnabled, isLocalMode } from '../app/mode';
import RichEditor from '../app/editor/RichEditor';
import ResolvedImage from '../shared/ui/ResolvedImage';
import { IconUpload, IconX } from '../shared/ui/icons';
import { formatResumePeriod, normalizeResumePeriod } from '../shared/lib/resumePeriod';

function readPeriodDates(period: any) {
  const p = normalizeResumePeriod(period);
  return { start: p?.from ?? '', end: p?.to ?? '' };
}

function writePeriodDates(start: string, end: string) {
  const s = String(start ?? '').trim();
  const e = String(end ?? '').trim();
  if (!s && !e) return undefined;
  return { from: s || e, ...(e ? { to: e } : {}) };
}

function ImageDropzone(props: {
  disabled: boolean;
  label: string;
  hint?: string;
  preview: React.ReactNode;
  onPick: (file: File) => void | Promise<void>;
}) {
  const { disabled, label, hint, preview, onPick } = props;
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [active, setActive] = React.useState(false);
  const dragDepthRef = React.useRef(0);

  const pick = React.useCallback(
    async (file: File | null) => {
      if (!file) return;
      await onPick(file);
    },
    [onPick]
  );

  return (
    <div
      className={`resumeDropzone dropZone${active ? ' active' : ''}${disabled ? ' disabled' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      title={label}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        inputRef.current?.click();
      }}
      onClick={() => {
        if (disabled) return;
        inputRef.current?.click();
      }}
      onDragEnter={(e) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        dragDepthRef.current += 1;
        setActive(true);
      }}
      onDragLeave={(e) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) setActive(false);
      }}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={async (e) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        dragDepthRef.current = 0;
        setActive(false);
        const f = e.dataTransfer?.files?.[0] ?? null;
        await pick(f);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        disabled={disabled}
        onChange={async (e) => {
          const f = e.target.files?.[0] ?? null;
          try {
            await pick(f);
          } finally {
            e.target.value = '';
          }
        }}
      />
      <div className="dropZoneBody">
        <div className="dropZonePreview">
          <div className="dropZonePreviewInner">{preview}</div>
        </div>
        <div className="dropZoneText">
          <div className="row" style={{ gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <IconUpload size={16} />
            <div className="dropZoneLabel">{label}</div>
            <div className="dropZoneBadge">Drag & drop</div>
          </div>
          {hint ? <div className="dropZoneHint muted">{hint}</div> : null}
        </div>
      </div>
    </div>
  );
}

function slugify(s: string) {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function linesToList(text: string) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function listToLines(list: string[] | undefined) {
  return (list ?? []).join('\n');
}

function parseCommaList(raw: string) {
  return raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function shiftStringMapOnRemove(prev: Record<number, string>, removedIndex: number) {
  const next: Record<number, string> = {};
  for (const k of Object.keys(prev)) {
    const i = Number(k);
    if (!Number.isFinite(i)) continue;
    if (i < removedIndex) next[i] = String(prev[i] ?? '');
    else if (i > removedIndex) next[i - 1] = String(prev[i] ?? '');
  }
  return next;
}

function normalizePortfolio(p: any): Portfolio {
  const readLogo = (x: any) => {
    if (!x || typeof x !== 'object') return undefined;
    if (typeof x.src !== 'string' || !x.src) return undefined;
    return { src: x.src, alt: typeof x.alt === 'string' ? x.alt : undefined };
  };

  const readLinks = (x: any) => {
    if (!Array.isArray(x)) return undefined;
    const out = x.map((l: any) => ({ label: String(l?.label ?? ''), url: String(l?.url ?? '') })).filter((l: any) => l.url);
    return out.length ? out : undefined;
  };

  const coerceLine = (x: any) => {
    if (typeof x === 'string') return x;
    if (x && typeof x === 'object') {
      // Back-compat if older structured objects existed.
      const candidate = x.title ?? x.name ?? x.school ?? x.org ?? x.venue;
      if (typeof candidate === 'string') return candidate;
    }
    return '';
  };
  return {
    name: typeof p?.name === 'string' ? p.name : '',
    headline: typeof p?.headline === 'string' ? p.headline : '',
    cover: p?.cover && typeof p.cover?.src === 'string' ? { src: p.cover.src, alt: typeof p.cover.alt === 'string' ? p.cover.alt : undefined } : undefined,
    photo: p?.photo && typeof p.photo?.src === 'string' ? { src: p.photo.src, alt: typeof p.photo.alt === 'string' ? p.photo.alt : undefined } : undefined,
    summary: typeof p?.summary === 'string' ? p.summary : undefined,
    ethics: typeof p?.ethics === 'string' ? p.ethics : undefined,
    skills: Array.isArray(p?.skills) ? p.skills.filter((x: any) => typeof x === 'string') : undefined,
    links: Array.isArray(p?.links) ? p.links.map((l: any) => ({ label: String(l?.label ?? ''), url: String(l?.url ?? '') })) : [],
    facts: Array.isArray(p?.facts)
      ? p.facts
          .map((f: any) => ({ label: String(f?.label ?? ''), value: String(f?.value ?? '') }))
          .filter((f: any) => f.label || f.value)
      : undefined,
    profile: p?.profile && typeof p.profile === 'object' ? p.profile : undefined,
    contact:
      p?.contact && typeof p.contact === 'object'
        ? {
            phone: typeof p.contact.phone === 'string' ? p.contact.phone : undefined,
            email: typeof p.contact.email === 'string' ? p.contact.email : undefined,
            location: typeof p.contact.location === 'string' ? p.contact.location : undefined
          }
        : undefined,
    hobbies: Array.isArray(p?.hobbies) ? p.hobbies.map(String).filter(Boolean) : undefined,
    languages: Array.isArray(p?.languages) ? p.languages.map(String).filter(Boolean) : undefined,
    work: Array.isArray(p?.work)
      ? p.work.map((w: any) => ({
          org: String(w?.org ?? ''),
          title: String(w?.title ?? ''),
          period: normalizeResumePeriod(w?.period),
          stacks: Array.isArray(w?.stacks) ? w.stacks.map(String).filter(Boolean) : undefined,
          location: typeof w?.location === 'string' ? w.location : undefined,
          description: typeof w?.description === 'string' ? w.description : undefined,
          logo: w?.logo && typeof w.logo?.src === 'string' ? { src: String(w.logo.src), alt: typeof w.logo.alt === 'string' ? String(w.logo.alt) : undefined } : undefined,
          links: Array.isArray(w?.links) ? w.links.map((l: any) => ({ label: String(l?.label ?? ''), url: String(l?.url ?? '') })) : undefined
        }))
      : undefined,
    awards: Array.isArray(p?.awards)
      ? p.awards
          .map((a: any) => {
            if (typeof a === 'string') return { title: a };
            if (!a || typeof a !== 'object') return null;
            const title = String(a.title ?? a.name ?? '').trim();
            if (!title) return null;
            const issuer = typeof a.issuer === 'string' ? a.issuer : typeof a.org === 'string' ? a.org : undefined;
            const period = normalizeResumePeriod(a.period);
            const description = typeof a.description === 'string' ? a.description : undefined;
            return { title, issuer, period, description, logo: readLogo(a.logo), links: readLinks(a.links) };
          })
          .filter(Boolean)
      : undefined,
    certificates: Array.isArray(p?.certificates)
      ? p.certificates
          .map((a: any) => {
            if (typeof a === 'string') return { title: a };
            if (!a || typeof a !== 'object') return null;
            const title = String(a.title ?? a.name ?? '').trim();
            if (!title) return null;
            const issuer = typeof a.issuer === 'string' ? a.issuer : typeof a.org === 'string' ? a.org : undefined;
            const period = normalizeResumePeriod(a.period);
            const description = typeof a.description === 'string' ? a.description : undefined;
            return { title, issuer, period, description, logo: readLogo(a.logo), links: readLinks(a.links) };
          })
          .filter(Boolean)
      : undefined,
    education: Array.isArray(p?.education)
      ? p.education
          .map((e: any) => {
            if (typeof e === 'string') return { school: e };
            if (!e || typeof e !== 'object') return null;
            const school = String(e.school ?? e.org ?? e.title ?? '').trim();
            if (!school) return null;
            const degree = typeof e.degree === 'string' ? e.degree : typeof e.major === 'string' ? e.major : undefined;
            const period = normalizeResumePeriod(e.period);
            const description = typeof e.description === 'string' ? e.description : undefined;
            return { school, degree, period, description, logo: readLogo(e.logo), links: readLinks(e.links) };
          })
          .filter(Boolean)
      : undefined,
    publications: Array.isArray(p?.publications)
      ? p.publications
          .map((pub: any) => {
            if (typeof pub === 'string') {
              const title = pub.trim();
              if (!title) return null;
              return { title };
            }
            if (!pub || typeof pub !== 'object') return null;
            const title = String(pub.title ?? pub.name ?? pub.paper ?? pub.book ?? '').trim();
            if (!title) return null;
            const venue = typeof pub.venue === 'string' ? pub.venue : typeof pub.org === 'string' ? pub.org : typeof pub.issuer === 'string' ? pub.issuer : undefined;
            const period = normalizeResumePeriod(pub.period);
            const description = typeof pub.description === 'string' ? pub.description : undefined;
            return { title, venue, period, description, logo: readLogo(pub.logo), links: readLinks(pub.links) };
          })
          .filter(Boolean)
      : undefined,
    projects: Array.isArray(p?.projects)
      ? p.projects.map((proj: any) => ({
          title: String(proj?.title ?? ''),
          role: String(proj?.role ?? ''),
          period: normalizeResumePeriod(proj?.period),
          description: String(proj?.description ?? ''),
          doc: proj?.doc ?? null,
          links: Array.isArray(proj?.links) ? proj.links.map((l: any) => ({ label: String(l?.label ?? ''), url: String(l?.url ?? '') })) : undefined,
          media: Array.isArray(proj?.media) ? proj.media : undefined,
          tags: Array.isArray(proj?.tags) ? proj.tags : undefined
        }))
      : []
  };
}

export default function PortfolioEditorPage() {
  const env = getEnv();
  const nav = useNavigate();
  const local = isLocalMode();
  const ghEnabled = isGitHubWriteEnabled();
  const { state, isAllowedUser, getOctokit, login } = useAuth();
  const canGitHubWrite = ghEnabled && Boolean(state.accessToken) && isAllowedUser;
  const canWrite = local ? true : canGitHubWrite;

  const [p, setP] = React.useState<Portfolio>(() => normalizePortfolio(getPortfolioIndex().portfolio));
  const [saving, setSaving] = React.useState(false);

  const [skillsText, setSkillsText] = React.useState(() => (p.skills ?? []).join(', '));
  const [workStacksText, setWorkStacksText] = React.useState<Record<number, string>>(() => {
    const out: Record<number, string> = {};
    (p.work ?? []).forEach((w, idx) => (out[idx] = (w.stacks ?? []).join(', ')));
    return out;
  });
  const [projectTagsText, setProjectTagsText] = React.useState<Record<number, string>>(() => {
    const out: Record<number, string> = {};
    (p.projects ?? []).forEach((proj, idx) => (out[idx] = (proj.tags ?? []).join(', ')));
    return out;
  });
  // Publications are structured (title/venue/period/links/logo), so no line-based textarea state.
  const [hobbiesText, setHobbiesText] = React.useState(() => listToLines(p.hobbies));
  const [languagesText, setLanguagesText] = React.useState(() => listToLines(p.languages));
  const [openEntry, setOpenEntry] = React.useState<Record<string, boolean>>({});
  const [projectEditorIndex, setProjectEditorIndex] = React.useState<number | null>(null);

  type EntryKind = 'award' | 'certificate' | 'education' | 'publication' | 'work' | 'project';
  const entryKey = React.useCallback((kind: EntryKind, index: number) => `${kind}:${index}`, []);

  const setEntryOpen = React.useCallback((kind: EntryKind, index: number, nextOpen: boolean) => {
    setOpenEntry((prev) => ({ ...prev, [entryKey(kind, index)]: nextOpen }));
  }, [entryKey]);

  const shiftOpenEntryOnRemove = React.useCallback((kind: EntryKind, removedIndex: number) => {
    setOpenEntry((prev) => {
      const next: Record<string, boolean> = {};
      for (const k of Object.keys(prev)) {
        const [rawKind, rawIdx] = k.split(':');
        if (!rawKind || !rawIdx) continue;
        const idx = Number(rawIdx);
        if (!Number.isFinite(idx)) continue;
        if (rawKind !== kind) {
          next[k] = Boolean(prev[k]);
          continue;
        }
        if (idx < removedIndex) next[`${rawKind}:${idx}`] = Boolean(prev[k]);
        else if (idx > removedIndex) next[`${rawKind}:${idx - 1}`] = Boolean(prev[k]);
      }
      return next;
    });
  }, []);

  React.useEffect(() => setHobbiesText(listToLines(p.hobbies)), [p.hobbies]);
  React.useEffect(() => setLanguagesText(listToLines(p.languages)), [p.languages]);
  React.useEffect(() => {
    // Keep the raw input in sync when the portfolio loads or is replaced.
    // (We intentionally don't derive the input value from the array because it would
    // erase trailing commas while typing.)
    setSkillsText((p.skills ?? []).join(', '));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const len = (p.work ?? []).length;
    setWorkStacksText((prev) => {
      const next: Record<number, string> = {};
      for (let i = 0; i < len; i++) next[i] = prev[i] ?? (p.work?.[i]?.stacks ?? []).join(', ');
      return next;
    });
  }, [p.work?.length]);

  React.useEffect(() => {
    const len = (p.projects ?? []).length;
    setProjectTagsText((prev) => {
      const next: Record<number, string> = {};
      for (let i = 0; i < len; i++) next[i] = prev[i] ?? (p.projects?.[i]?.tags ?? []).join(', ');
      return next;
    });
  }, [p.projects?.length]);

  React.useEffect(() => {
    if (projectEditorIndex === null) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prevOverflow;
    };
  }, [projectEditorIndex]);

  React.useEffect(() => {
    if (projectEditorIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setProjectEditorIndex(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [projectEditorIndex]);

  async function uploadImage(params: { file: File; scope: 'profile' | 'project' | 'cover' | 'work' | 'award' | 'certificate' | 'education' | 'publication'; scopeId?: string }) {
    if (local) return await saveLocalImage(params.file);
    if (!canGitHubWrite) {
      await login('/resume/edit');
      throw new Error('Not authenticated.');
    }
    const octokit = getOctokit();
    return await uploadPortfolioAsset({
      octokit,
      owner: env.VITE_CONTENT_REPO_OWNER,
      repo: env.VITE_CONTENT_REPO_NAME,
      scope: params.scope,
      scopeId: params.scopeId,
      file: params.file,
      username: state.username ?? 'unknown'
    });
  }

  async function save() {
    setSaving(true);
    try {
      const next: Portfolio = {
        ...p,
        awards: (p.awards ?? []).filter((a: any) => String(a?.title ?? '').trim()),
        certificates: (p.certificates ?? []).filter((a: any) => String(a?.title ?? '').trim()),
        education: (p.education ?? []).filter((e: any) => String(e?.school ?? '').trim()),
        publications: (p.publications ?? []).filter((x: any) => String(x?.title ?? '').trim()),
        hobbies: linesToList(hobbiesText),
        languages: linesToList(languagesText)
      };

      if (local) {
        setLocalPortfolio(next);
      } else {
        if (!canGitHubWrite) {
          await login('/resume/edit');
          return;
        }
        const octokit = getOctokit();
        await upsertPortfolioJsonInRepo({
          owner: env.VITE_CONTENT_REPO_OWNER,
          repo: env.VITE_CONTENT_REPO_NAME,
          octokit,
          portfolio: next,
          username: state.username ?? 'unknown'
        });
        alert('Saved. A rebuild will deploy soon.');
        // Keep the newest state visible immediately in this browser.
        setLocalPortfolio(next);
      }

      nav('/resume');
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card resumeEditor">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ marginTop: 0 }}>Edit Resume</h1>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {!state.accessToken && !local ? (
            <button className="btn" onClick={() => login('/resume/edit')} type="button">
              Login with GitHub
            </button>
          ) : (
            <div className="pill">{local ? 'local mode' : `@${state.username ?? 'unknown'}`}</div>
          )}
        </div>
      </div>

      <div className="profileEditGrid" style={{ marginTop: 14 }}>
        <div className="profileEditLeft">
          <div className="card">
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
              Cover (optional)
            </div>
            <ImageDropzone
              disabled={saving || !canWrite}
              label="Drop a cover image (or click to select)"
              hint="Crops to 16:6"
              preview={
                <div className="profileCoverFrame" style={{ aspectRatio: '16 / 6' }}>
                  {p.cover?.src ? <ResolvedImage src={p.cover.src} alt={p.cover.alt ?? p.name ?? 'Cover'} className="profileCoverImg" /> : <div />}
                </div>
              }
              onPick={async (f) => {
                const src = await uploadImage({ file: f, scope: 'cover' });
                setP((prev) => ({ ...prev, cover: { src, alt: prev.cover?.alt } }));
              }}
            />
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
              <button className="pill" type="button" disabled={saving || !canWrite || !p.cover?.src} onClick={() => setP((prev) => ({ ...prev, cover: undefined }))}>
                Remove
              </button>
            </div>
            <div style={{ marginTop: 10 }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Cover alt text (optional)
              </div>
              <input
                className="input"
                value={p.cover?.alt ?? ''}
                onChange={(e) => setP((prev) => ({ ...prev, cover: prev.cover ? { ...prev.cover, alt: e.target.value } : prev.cover }))}
                disabled={saving || !p.cover?.src}
              />
            </div>
          </div>

          <div className="card">
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
              Profile Photo
            </div>
            <ImageDropzone
              disabled={saving || !canWrite}
              label="Drop a profile photo (or click to select)"
              hint="Crops to 4:5"
              preview={
                <div className="profilePhotoFrame" style={{ aspectRatio: '4 / 5' }}>
                  {p.photo?.src ? <ResolvedImage src={p.photo.src} alt={p.photo.alt ?? p.name ?? 'Profile'} className="profilePhotoImg" /> : <div />}
                </div>
              }
              onPick={async (f) => {
                const src = await uploadImage({ file: f, scope: 'profile' });
                setP((prev) => ({ ...prev, photo: { src, alt: prev.photo?.alt } }));
              }}
            />
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
              <button className="pill" type="button" disabled={saving || !canWrite || !p.photo?.src} onClick={() => setP((prev) => ({ ...prev, photo: undefined }))}>
                Remove
              </button>
            </div>
            <div style={{ marginTop: 10 }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Photo alt text (optional)
              </div>
              <input
                className="input"
                value={p.photo?.alt ?? ''}
                onChange={(e) => setP((prev) => ({ ...prev, photo: prev.photo ? { ...prev.photo, alt: e.target.value } : prev.photo }))}
                disabled={saving || !p.photo?.src}
              />
            </div>
          </div>

          <div className="card" id="resume-basics">
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Name
            </div>
            <input className="input" value={p.name} onChange={(e) => setP((prev) => ({ ...prev, name: e.target.value }))} disabled={saving} />

            <div className="muted" style={{ fontSize: 12, margin: '10px 0 6px' }}>
              Headline
            </div>
            <input className="input" value={p.headline} onChange={(e) => setP((prev) => ({ ...prev, headline: e.target.value }))} disabled={saving} />

            <div className="muted" style={{ fontSize: 12, margin: '10px 0 6px' }}>
              Summary (optional)
            </div>
            <textarea className="textarea" value={p.summary ?? ''} onChange={(e) => setP((prev) => ({ ...prev, summary: e.target.value }))} disabled={saving} style={{ minHeight: 90 }} />

            <div className="muted" style={{ fontSize: 12, margin: '10px 0 6px' }}>
              Professional Ethics / Notes (optional)
            </div>
            <textarea className="textarea" value={p.ethics ?? ''} onChange={(e) => setP((prev) => ({ ...prev, ethics: e.target.value }))} disabled={saving} style={{ minHeight: 110 }} />

            <div className="muted" style={{ fontSize: 12, margin: '10px 0 6px' }}>
              Skills (comma separated, optional)
            </div>
            <input
              className="input"
              value={skillsText}
              onChange={(e) => {
                const raw = e.target.value;
                setSkillsText(raw);
                setP((prev) => ({
                  ...prev,
                  skills: parseCommaList(raw)
                }));
              }}
              disabled={saving}
            />
          </div>

          <div className="card" id="resume-contact">
            <div style={{ fontWeight: 750 }}>Contact</div>
            <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Phone (optional)
                </div>
                <input className="input" value={p.contact?.phone ?? ''} onChange={(e) => setP((prev) => ({ ...prev, contact: { ...(prev.contact ?? {}), phone: e.target.value } }))} disabled={saving} />
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Email (optional)
                </div>
                <input className="input" value={p.contact?.email ?? ''} onChange={(e) => setP((prev) => ({ ...prev, contact: { ...(prev.contact ?? {}), email: e.target.value } }))} disabled={saving} />
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Location (optional)
                </div>
                <input className="input" value={p.contact?.location ?? ''} onChange={(e) => setP((prev) => ({ ...prev, contact: { ...(prev.contact ?? {}), location: e.target.value } }))} disabled={saving} />
              </div>
            </div>
          </div>

          <div className="card" id="resume-links">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 750 }}>Links</div>
              <button
                type="button"
                className="pill"
                disabled={saving}
                onClick={() => setP((prev) => ({ ...prev, links: [...(prev.links ?? []), { label: '', url: '' }] }))}
              >
                + Add
              </button>
            </div>
            <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              {(p.links ?? []).map((l, idx) => (
                <div key={idx} className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    className="input"
                    style={{ flex: 1, minWidth: 160 }}
                    placeholder="Label"
                    value={l.label}
                    onChange={(e) =>
                      setP((prev) => {
                        const next = [...prev.links];
                        next[idx] = { ...next[idx], label: e.target.value };
                        return { ...prev, links: next };
                      })
                    }
                    disabled={saving}
                  />
                  <input
                    className="input"
                    style={{ flex: 2, minWidth: 220 }}
                    placeholder="https://..."
                    value={l.url}
                    onChange={(e) =>
                      setP((prev) => {
                        const next = [...prev.links];
                        next[idx] = { ...next[idx], url: e.target.value };
                        return { ...prev, links: next };
                      })
                    }
                    disabled={saving}
                  />
                  <button type="button" className="btn" disabled={saving} onClick={() => setP((prev) => ({ ...prev, links: prev.links.filter((_, i) => i !== idx) }))}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 750 }}>Facts (Notion-style properties)</div>
              <button
                type="button"
                className="pill"
                disabled={saving}
                onClick={() => setP((prev) => ({ ...prev, facts: [...(prev.facts ?? []), { label: '', value: '' }] }))}
              >
                + Add
              </button>
            </div>
            <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              {(p.facts ?? []).map((f, idx) => (
                <div key={idx} className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    className="input"
                    style={{ flex: 1, minWidth: 160 }}
                    placeholder="Label"
                    value={f.label}
                    onChange={(e) =>
                      setP((prev) => {
                        const next = [...(prev.facts ?? [])];
                        next[idx] = { ...next[idx], label: e.target.value };
                        return { ...prev, facts: next };
                      })
                    }
                    disabled={saving}
                  />
                  <input
                    className="input"
                    style={{ flex: 2, minWidth: 220 }}
                    placeholder="Value"
                    value={f.value}
                    onChange={(e) =>
                      setP((prev) => {
                        const next = [...(prev.facts ?? [])];
                        next[idx] = { ...next[idx], value: e.target.value };
                        return { ...prev, facts: next };
                      })
                    }
                    disabled={saving}
                  />
                  <button type="button" className="btn" disabled={saving} onClick={() => setP((prev) => ({ ...prev, facts: (prev.facts ?? []).filter((_, i) => i !== idx) }))}>
                    Remove
                  </button>
                </div>
              ))}
              {(p.facts ?? []).length === 0 ? <div className="muted" style={{ fontSize: 12 }}>No facts yet.</div> : null}
            </div>
          </div>

          <div className="card" id="resume-personal">
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Hobbies (one per line)
            </div>
            <textarea className="textarea" value={hobbiesText} onChange={(e) => setHobbiesText(e.target.value)} disabled={saving} style={{ minHeight: 90 }} />

            <div className="muted" style={{ fontSize: 12, margin: '10px 0 6px' }}>
              Languages (one per line)
            </div>
            <textarea className="textarea" value={languagesText} onChange={(e) => setLanguagesText(e.target.value)} disabled={saving} style={{ minHeight: 90 }} />
          </div>

          <div className="card" id="resume-awards">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 750 }}>Awards</div>
              <button
                type="button"
                className="pill"
                disabled={saving}
                onClick={() => {
                  const idx = (p.awards ?? []).length;
                  setEntryOpen('award', idx, true);
                  setP((prev) => ({
                    ...prev,
                    awards: [...(prev.awards ?? []), { title: 'New Award', issuer: '', period: undefined, description: '', logo: undefined, links: [] }]
                  }));
                }}
              >
                + Add
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              {(p.awards ?? []).map((a, idx) => {
                const scopeId = `${idx}-${slugify(a.title) || 'award'}`;
                return (
                  <details
                    key={idx}
                    className="resumeEditEntry"
                    open={Boolean(openEntry[entryKey('award', idx)])}
                    onToggle={(e) => setEntryOpen('award', idx, (e.currentTarget as HTMLDetailsElement).open)}
                  >
                    <summary className="resumeEditSummary">
                      <div className="pill">Award {idx + 1}</div>
                      <div className="resumeEditSummaryMain">
                        <div className="resumeEditSummaryTitle">{a.title || 'Untitled'}</div>
                        <div className="resumeEditSummaryMeta muted">{[a.issuer, formatResumePeriod(a.period)].filter(Boolean).join(' · ')}</div>
                      </div>
                      <button
                        type="button"
                        className="btn danger"
                        disabled={saving}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!window.confirm('Remove this award?')) return;
                          shiftOpenEntryOnRemove('award', idx);
                          setP((prev) => ({ ...prev, awards: (prev.awards ?? []).filter((_, i) => i !== idx) }));
                        }}
                      >
                        Remove
                      </button>
                    </summary>

                    <div className="resumeEditDetails" style={{ display: 'grid', gap: 10 }}>
                      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Title
                          </div>
                          <input
                            className="input"
                            value={a.title}
                            onChange={(e) =>
                              setP((prev) => {
                                const next = [...(prev.awards ?? [])];
                                next[idx] = { ...next[idx], title: e.target.value };
                                return { ...prev, awards: next };
                              })
                            }
                            disabled={saving}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Issuer (optional)
                          </div>
                          <input
                            className="input"
                            value={a.issuer ?? ''}
                            onChange={(e) =>
                              setP((prev) => {
                                const next = [...(prev.awards ?? [])];
                                next[idx] = { ...next[idx], issuer: e.target.value };
                                return { ...prev, awards: next };
                              })
                            }
                            disabled={saving}
                          />
                        </div>
                      </div>

                      <div className="row" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Period (optional, dates only)
                          </div>
                          {(() => {
                            const { start, end } = readPeriodDates(a.period);
                            return (
                              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                                <input
                                  className="input"
                                  type="date"
                                  style={{ flex: 1, minWidth: 160 }}
                                  value={start}
                                  onChange={(e) =>
                                    setP((prev) => {
                                      const next = [...(prev.awards ?? [])];
                                      const cur = next[idx];
                                      next[idx] = { ...cur, period: writePeriodDates(e.target.value, readPeriodDates(cur.period).end) };
                                      return { ...prev, awards: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                                <input
                                  className="input"
                                  type="date"
                                  style={{ flex: 1, minWidth: 160 }}
                                  value={end}
                                  onChange={(e) =>
                                    setP((prev) => {
                                      const next = [...(prev.awards ?? [])];
                                      const cur = next[idx];
                                      next[idx] = { ...cur, period: writePeriodDates(readPeriodDates(cur.period).start, e.target.value) };
                                      return { ...prev, awards: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                              </div>
                            );
                          })()}
                        </div>

                        <div style={{ width: 160 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Photo (optional)
                          </div>
                          <ImageDropzone
                            disabled={saving || !canWrite}
                            label="Drop"
                            hint="or click"
                            preview={
                              <div className="profileWorkLogoPreviewFrame" style={{ aspectRatio: '1 / 1', width: 104 }}>
                                {a.logo?.src ? (
                                  <ResolvedImage src={a.logo.src} alt={a.logo.alt ?? a.title} className="profileWorkLogoPreviewImg" loading="lazy" />
                                ) : (
                                  <div />
                                )}
                              </div>
                            }
                            onPick={async (f) => {
                              const src = await uploadImage({ file: f, scope: 'award', scopeId });
                              setP((prev) => {
                                const next = [...(prev.awards ?? [])];
                                next[idx] = { ...next[idx], logo: { src, alt: next[idx]?.logo?.alt } };
                                return { ...prev, awards: next };
                              });
                            }}
                          />
                        </div>
                      </div>

                      <div className="row" style={{ justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="pill"
                          disabled={saving || !canWrite || !a.logo?.src}
                          onClick={() =>
                            setP((prev) => {
                              const next = [...(prev.awards ?? [])];
                              next[idx] = { ...next[idx], logo: undefined };
                              return { ...prev, awards: next };
                            })
                          }
                        >
                          Remove photo
                        </button>
                      </div>

                      {a.logo?.src ? (
                        <div>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Photo alt text (optional)
                          </div>
                          <input
                            className="input"
                            value={a.logo?.alt ?? ''}
                            onChange={(e) =>
                              setP((prev) => {
                                const next = [...(prev.awards ?? [])];
                                const cur = next[idx];
                                next[idx] = { ...cur, logo: cur.logo ? { ...cur.logo, alt: e.target.value } : cur.logo };
                                return { ...prev, awards: next };
                              })
                            }
                            disabled={saving}
                          />
                        </div>
                      ) : null}

                      <div>
                        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                          Description (optional)
                        </div>
                        <textarea
                          className="textarea"
                          value={a.description ?? ''}
                          onChange={(e) =>
                            setP((prev) => {
                              const next = [...(prev.awards ?? [])];
                              next[idx] = { ...next[idx], description: e.target.value };
                              return { ...prev, awards: next };
                            })
                          }
                          disabled={saving}
                          style={{ minHeight: 90 }}
                        />
                      </div>

                      <div>
                        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <div className="muted" style={{ fontSize: 12 }}>
                            Links (optional)
                          </div>
                          <button
                            type="button"
                            className="pill"
                            disabled={saving}
                            onClick={() =>
                              setP((prev) => {
                                const next = [...(prev.awards ?? [])];
                                const links = [...(next[idx].links ?? []), { label: 'Link', url: '' }];
                                next[idx] = { ...next[idx], links };
                                return { ...prev, awards: next };
                              })
                            }
                          >
                            + Add link
                          </button>
                        </div>

                        {(a.links ?? []).length ? (
                          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                            {(a.links ?? []).map((l, li) => (
                              <div key={li} className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                <input
                                  className="input"
                                  style={{ flex: 1, minWidth: 180 }}
                                  value={l.label ?? ''}
                                  placeholder="Label"
                                  onChange={(e) =>
                                    setP((prev) => {
                                      const next = [...(prev.awards ?? [])];
                                      const links = [...(next[idx].links ?? [])];
                                      links[li] = { ...links[li], label: e.target.value };
                                      next[idx] = { ...next[idx], links };
                                      return { ...prev, awards: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                                <input
                                  className="input"
                                  style={{ flex: 2, minWidth: 240 }}
                                  value={l.url ?? ''}
                                  placeholder="https://..."
                                  onChange={(e) =>
                                    setP((prev) => {
                                      const next = [...(prev.awards ?? [])];
                                      const links = [...(next[idx].links ?? [])];
                                      links[li] = { ...links[li], url: e.target.value };
                                      next[idx] = { ...next[idx], links };
                                      return { ...prev, awards: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                                <button
                                  type="button"
                                  className="btn"
                                  disabled={saving}
                                  onClick={() =>
                                    setP((prev) => {
                                      const next = [...(prev.awards ?? [])];
                                      const links = (next[idx].links ?? []).filter((_, i) => i !== li);
                                      next[idx] = { ...next[idx], links };
                                      return { ...prev, awards: next };
                                    })
                                  }
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                            No links yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                );
              })}
              {(p.awards ?? []).length === 0 ? <div className="muted" style={{ fontSize: 12 }}>No awards yet.</div> : null}
            </div>
          </div>

          <div className="card" id="resume-certificates">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 750 }}>Certificates</div>
              <button
                type="button"
                className="pill"
                disabled={saving}
                onClick={() => {
                  const idx = (p.certificates ?? []).length;
                  setEntryOpen('certificate', idx, true);
                  setP((prev) => ({
                    ...prev,
                    certificates: [
                      ...(prev.certificates ?? []),
                      { title: 'New Certificate', issuer: '', period: undefined, description: '', logo: undefined, links: [] }
                    ]
                  }));
                }}
              >
                + Add
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              {(p.certificates ?? []).map((a: any, idx: number) => {
                const scopeId = `${idx}-${slugify(a.title) || 'certificate'}`;
                return (
                  <details
                    key={idx}
                    className="resumeEditEntry"
                    open={Boolean(openEntry[entryKey('certificate', idx)])}
                    onToggle={(e) => setEntryOpen('certificate', idx, (e.currentTarget as HTMLDetailsElement).open)}
                  >
                    <summary className="resumeEditSummary">
                      <div className="pill">Certificate {idx + 1}</div>
                      <div className="resumeEditSummaryMain">
                        <div className="resumeEditSummaryTitle">{a.title || 'Untitled'}</div>
                        <div className="resumeEditSummaryMeta muted">{[a.issuer, formatResumePeriod(a.period)].filter(Boolean).join(' · ')}</div>
                      </div>
                      <button
                        type="button"
                        className="btn danger"
                        disabled={saving}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!window.confirm('Remove this certificate?')) return;
                          shiftOpenEntryOnRemove('certificate', idx);
                          setP((prev) => ({ ...prev, certificates: (prev.certificates ?? []).filter((_: any, i: number) => i !== idx) }));
                        }}
                      >
                        Remove
                      </button>
                    </summary>

                    <div className="resumeEditDetails" style={{ display: 'grid', gap: 10 }}>
                      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Title
                          </div>
                          <input
                            className="input"
                            value={a.title}
                            onChange={(e) =>
                              setP((prev) => {
                                const next = [...(prev.certificates ?? [])];
                                next[idx] = { ...next[idx], title: e.target.value };
                                return { ...prev, certificates: next };
                              })
                            }
                            disabled={saving}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Issuer (optional)
                          </div>
                          <input
                            className="input"
                            value={a.issuer ?? ''}
                            onChange={(e) =>
                              setP((prev) => {
                                const next = [...(prev.certificates ?? [])];
                                next[idx] = { ...next[idx], issuer: e.target.value };
                                return { ...prev, certificates: next };
                              })
                            }
                            disabled={saving}
                          />
                        </div>
                      </div>

                      <div className="row" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Period (optional, dates only)
                          </div>
                          {(() => {
                            const { start, end } = readPeriodDates(a.period);
                            return (
                              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                                <input
                                  className="input"
                                  type="date"
                                  style={{ flex: 1, minWidth: 160 }}
                                  value={start}
                                  onChange={(e) =>
                                    setP((prev) => {
                                      const next = [...(prev.certificates ?? [])];
                                      const cur = next[idx];
                                      next[idx] = { ...cur, period: writePeriodDates(e.target.value, readPeriodDates(cur.period).end) };
                                      return { ...prev, certificates: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                                <input
                                  className="input"
                                  type="date"
                                  style={{ flex: 1, minWidth: 160 }}
                                  value={end}
                                  onChange={(e) =>
                                    setP((prev) => {
                                      const next = [...(prev.certificates ?? [])];
                                      const cur = next[idx];
                                      next[idx] = { ...cur, period: writePeriodDates(readPeriodDates(cur.period).start, e.target.value) };
                                      return { ...prev, certificates: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                              </div>
                            );
                          })()}
                        </div>

                        <div style={{ width: 160 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Photo (optional)
                          </div>
                          <ImageDropzone
                            disabled={saving || !canWrite}
                            label="Drop"
                            hint="or click"
                            preview={
                              <div className="profileWorkLogoPreviewFrame" style={{ aspectRatio: '1 / 1', width: 104 }}>
                                {a.logo?.src ? (
                                  <ResolvedImage src={a.logo.src} alt={a.logo.alt ?? a.title} className="profileWorkLogoPreviewImg" loading="lazy" />
                                ) : (
                                  <div />
                                )}
                              </div>
                            }
                            onPick={async (f) => {
                              const src = await uploadImage({ file: f, scope: 'certificate', scopeId });
                              setP((prev) => {
                                const next = [...(prev.certificates ?? [])];
                                next[idx] = { ...next[idx], logo: { src, alt: next[idx]?.logo?.alt ?? f.name } };
                                return { ...prev, certificates: next };
                              });
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                          Description (optional)
                        </div>
                        <textarea
                          className="textarea"
                          value={a.description ?? ''}
                          onChange={(e) =>
                            setP((prev) => {
                              const next = [...(prev.certificates ?? [])];
                              next[idx] = { ...next[idx], description: e.target.value };
                              return { ...prev, certificates: next };
                            })
                          }
                          disabled={saving}
                          style={{ minHeight: 90 }}
                        />
                      </div>

                      <div>
                        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <div className="muted" style={{ fontSize: 12 }}>
                            Links (optional)
                          </div>
                          <button
                            type="button"
                            className="pill"
                            disabled={saving}
                            onClick={() =>
                              setP((prev) => {
                                const next = [...(prev.certificates ?? [])];
                                const links = [...(next[idx].links ?? []), { label: 'Link', url: '' }];
                                next[idx] = { ...next[idx], links };
                                return { ...prev, certificates: next };
                              })
                            }
                          >
                            + Add link
                          </button>
                        </div>

                        {(a.links ?? []).length ? (
                          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                            {(a.links ?? []).map((l: any, li: number) => (
                              <div key={li} className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                <input
                                  className="input"
                                  style={{ flex: 1, minWidth: 180 }}
                                  value={l.label ?? ''}
                                  placeholder="Label"
                                  onChange={(e) =>
                                    setP((prev) => {
                                      const next = [...(prev.certificates ?? [])];
                                      const links = [...(next[idx].links ?? [])];
                                      links[li] = { ...links[li], label: e.target.value };
                                      next[idx] = { ...next[idx], links };
                                      return { ...prev, certificates: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                                <input
                                  className="input"
                                  style={{ flex: 2, minWidth: 240 }}
                                  value={l.url ?? ''}
                                  placeholder="https://..."
                                  onChange={(e) =>
                                    setP((prev) => {
                                      const next = [...(prev.certificates ?? [])];
                                      const links = [...(next[idx].links ?? [])];
                                      links[li] = { ...links[li], url: e.target.value };
                                      next[idx] = { ...next[idx], links };
                                      return { ...prev, certificates: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                                <button
                                  type="button"
                                  className="btn"
                                  disabled={saving}
                                  onClick={() =>
                                    setP((prev) => {
                                      const next = [...(prev.certificates ?? [])];
                                      const links = (next[idx].links ?? []).filter((_: any, i: number) => i !== li);
                                      next[idx] = { ...next[idx], links };
                                      return { ...prev, certificates: next };
                                    })
                                  }
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                            No links yet.
                          </div>
                        )}
                      </div>

                      {a.logo?.src ? (
                        <div>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Photo alt text (optional)
                          </div>
                          <input
                            className="input"
                            value={a.logo?.alt ?? ''}
                            onChange={(e) =>
                              setP((prev) => {
                                const next = [...(prev.certificates ?? [])];
                                const cur = next[idx];
                                next[idx] = { ...cur, logo: cur.logo ? { ...cur.logo, alt: e.target.value } : cur.logo };
                                return { ...prev, certificates: next };
                              })
                            }
                            disabled={saving}
                          />
                        </div>
                      ) : null}

                      <div className="row" style={{ justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="pill"
                          disabled={saving || !canWrite || !a.logo?.src}
                          onClick={() =>
                            setP((prev) => {
                              const next = [...(prev.certificates ?? [])];
                              next[idx] = { ...next[idx], logo: undefined };
                              return { ...prev, certificates: next };
                            })
                          }
                        >
                          Remove photo
                        </button>
                      </div>
                    </div>
                  </details>
                );
              })}
              {(p.certificates ?? []).length === 0 ? <div className="muted" style={{ fontSize: 12 }}>No certificates yet.</div> : null}
            </div>
          </div>

          <div className="card" id="resume-education">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 750 }}>Education</div>
              <button
                type="button"
                className="pill"
                disabled={saving}
                onClick={() => {
                  const idx = (p.education ?? []).length;
                  setEntryOpen('education', idx, true);
                  setP((prev) => ({
                    ...prev,
                    education: [...(prev.education ?? []), { school: 'New School', degree: '', period: undefined, description: '', logo: undefined, links: [] }]
                  }));
                }}
              >
                + Add
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              {(p.education ?? []).map((e, idx) => {
                const scopeId = `${idx}-${slugify(e.school) || 'education'}`;
                return (
                  <details
                    key={idx}
                    className="resumeEditEntry"
                    open={Boolean(openEntry[entryKey('education', idx)])}
                    onToggle={(ev) => setEntryOpen('education', idx, (ev.currentTarget as HTMLDetailsElement).open)}
                  >
                    <summary className="resumeEditSummary">
                      <div className="pill">Education {idx + 1}</div>
                      <div className="resumeEditSummaryMain">
                        <div className="resumeEditSummaryTitle">{e.school || 'Untitled'}</div>
                        <div className="resumeEditSummaryMeta muted">{[e.degree, formatResumePeriod(e.period)].filter(Boolean).join(' · ')}</div>
                      </div>
                      <button
                        type="button"
                        className="btn danger"
                        disabled={saving}
                        onClick={(clickEv) => {
                          clickEv.preventDefault();
                          clickEv.stopPropagation();
                          if (!window.confirm('Remove this education item?')) return;
                          shiftOpenEntryOnRemove('education', idx);
                          setP((prev) => ({ ...prev, education: (prev.education ?? []).filter((_, i) => i !== idx) }));
                        }}
                      >
                        Remove
                      </button>
                    </summary>

                    <div className="resumeEditDetails" style={{ display: 'grid', gap: 10 }}>
                      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            School
                          </div>
                          <input
                            className="input"
                            value={e.school}
                            onChange={(ev) =>
                              setP((prev) => {
                                const next = [...(prev.education ?? [])];
                                next[idx] = { ...next[idx], school: ev.target.value };
                                return { ...prev, education: next };
                              })
                            }
                            disabled={saving}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Degree / Major (optional)
                          </div>
                          <input
                            className="input"
                            value={e.degree ?? ''}
                            onChange={(ev) =>
                              setP((prev) => {
                                const next = [...(prev.education ?? [])];
                                next[idx] = { ...next[idx], degree: ev.target.value };
                                return { ...prev, education: next };
                              })
                            }
                            disabled={saving}
                          />
                        </div>
                      </div>

                      <div className="row" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Period (optional, dates only)
                          </div>
                          {(() => {
                            const { start, end } = readPeriodDates(e.period);
                            return (
                              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                                <input
                                  className="input"
                                  type="date"
                                  style={{ flex: 1, minWidth: 160 }}
                                  value={start}
                                  onChange={(ev) =>
                                    setP((prev) => {
                                      const next = [...(prev.education ?? [])];
                                      const cur = next[idx];
                                      next[idx] = { ...cur, period: writePeriodDates(ev.target.value, readPeriodDates(cur.period).end) };
                                      return { ...prev, education: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                                <input
                                  className="input"
                                  type="date"
                                  style={{ flex: 1, minWidth: 160 }}
                                  value={end}
                                  onChange={(ev) =>
                                    setP((prev) => {
                                      const next = [...(prev.education ?? [])];
                                      const cur = next[idx];
                                      next[idx] = { ...cur, period: writePeriodDates(readPeriodDates(cur.period).start, ev.target.value) };
                                      return { ...prev, education: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                              </div>
                            );
                          })()}
                        </div>

                        <div style={{ width: 160 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Photo (optional)
                          </div>
                          <ImageDropzone
                            disabled={saving || !canWrite}
                            label="Drop"
                            hint="or click"
                            preview={
                              <div className="profileWorkLogoPreviewFrame" style={{ aspectRatio: '1 / 1', width: 104 }}>
                                {e.logo?.src ? (
                                  <ResolvedImage src={e.logo.src} alt={e.logo.alt ?? e.school} className="profileWorkLogoPreviewImg" loading="lazy" />
                                ) : (
                                  <div />
                                )}
                              </div>
                            }
                            onPick={async (f) => {
                              const src = await uploadImage({ file: f, scope: 'education', scopeId });
                              setP((prev) => {
                                const next = [...(prev.education ?? [])];
                                next[idx] = { ...next[idx], logo: { src, alt: next[idx]?.logo?.alt } };
                                return { ...prev, education: next };
                              });
                            }}
                          />
                        </div>
                      </div>

                      <div className="row" style={{ justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="pill"
                          disabled={saving || !canWrite || !e.logo?.src}
                          onClick={() =>
                            setP((prev) => {
                              const next = [...(prev.education ?? [])];
                              next[idx] = { ...next[idx], logo: undefined };
                              return { ...prev, education: next };
                            })
                          }
                        >
                          Remove photo
                        </button>
                      </div>

                      {e.logo?.src ? (
                        <div>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Photo alt text (optional)
                          </div>
                          <input
                            className="input"
                            value={e.logo?.alt ?? ''}
                            onChange={(ev) =>
                              setP((prev) => {
                                const next = [...(prev.education ?? [])];
                                const cur = next[idx];
                                next[idx] = { ...cur, logo: cur.logo ? { ...cur.logo, alt: ev.target.value } : cur.logo };
                                return { ...prev, education: next };
                              })
                            }
                            disabled={saving}
                          />
                        </div>
                      ) : null}

                      <div>
                        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                          Description (optional)
                        </div>
                        <textarea
                          className="textarea"
                          value={e.description ?? ''}
                          onChange={(ev) =>
                            setP((prev) => {
                              const next = [...(prev.education ?? [])];
                              next[idx] = { ...next[idx], description: ev.target.value };
                              return { ...prev, education: next };
                            })
                          }
                          disabled={saving}
                          style={{ minHeight: 90 }}
                        />
                      </div>

                      <div>
                        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <div className="muted" style={{ fontSize: 12 }}>
                            Links (optional)
                          </div>
                          <button
                            type="button"
                            className="pill"
                            disabled={saving}
                            onClick={() =>
                              setP((prev) => {
                                const next = [...(prev.education ?? [])];
                                const links = [...(next[idx].links ?? []), { label: 'Link', url: '' }];
                                next[idx] = { ...next[idx], links };
                                return { ...prev, education: next };
                              })
                            }
                          >
                            + Add link
                          </button>
                        </div>

                        {(e.links ?? []).length ? (
                          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                            {(e.links ?? []).map((l, li) => (
                              <div key={li} className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                <input
                                  className="input"
                                  style={{ flex: 1, minWidth: 180 }}
                                  value={l.label ?? ''}
                                  placeholder="Label"
                                  onChange={(ev) =>
                                    setP((prev) => {
                                      const next = [...(prev.education ?? [])];
                                      const links = [...(next[idx].links ?? [])];
                                      links[li] = { ...links[li], label: ev.target.value };
                                      next[idx] = { ...next[idx], links };
                                      return { ...prev, education: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                                <input
                                  className="input"
                                  style={{ flex: 2, minWidth: 240 }}
                                  value={l.url ?? ''}
                                  placeholder="https://..."
                                  onChange={(ev) =>
                                    setP((prev) => {
                                      const next = [...(prev.education ?? [])];
                                      const links = [...(next[idx].links ?? [])];
                                      links[li] = { ...links[li], url: ev.target.value };
                                      next[idx] = { ...next[idx], links };
                                      return { ...prev, education: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                                <button
                                  type="button"
                                  className="btn"
                                  disabled={saving}
                                  onClick={() =>
                                    setP((prev) => {
                                      const next = [...(prev.education ?? [])];
                                      const links = (next[idx].links ?? []).filter((_, i) => i !== li);
                                      next[idx] = { ...next[idx], links };
                                      return { ...prev, education: next };
                                    })
                                  }
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                            No links yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                );
              })}
              {(p.education ?? []).length === 0 ? <div className="muted" style={{ fontSize: 12 }}>No education items yet.</div> : null}
            </div>
          </div>

          <div className="card" id="resume-publications">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 750 }}>Publications</div>
              <button
                type="button"
                className="pill"
                disabled={saving}
                onClick={() => {
                  const idx = (p.publications ?? []).length;
                  setEntryOpen('publication', idx, true);
                  setP((prev) => ({
                    ...prev,
                    publications: [...(prev.publications ?? []), { title: 'New Publication', venue: '', period: undefined, description: '', logo: undefined, links: [] }]
                  }));
                }}
              >
                + Add
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              {(p.publications ?? []).map((pub: any, idx: number) => {
                const scopeId = `${idx}-${slugify(pub.title)}`;
                return (
                  <details
                    key={idx}
                    className="resumeEditEntry"
                    open={Boolean(openEntry[entryKey('publication', idx)])}
                    onToggle={(ev) => setEntryOpen('publication', idx, (ev.currentTarget as HTMLDetailsElement).open)}
                  >
                    <summary className="resumeEditSummary">
                      <div className="pill">Publication {idx + 1}</div>
                      <div className="resumeEditSummaryMain">
                        <div className="resumeEditSummaryTitle">{pub.title || 'Untitled'}</div>
                        <div className="resumeEditSummaryMeta muted">{[pub.venue, formatResumePeriod(pub.period)].filter(Boolean).join(' · ')}</div>
                      </div>
                      <button
                        type="button"
                        className="btn danger"
                        disabled={saving}
                        onClick={(clickEv) => {
                          clickEv.preventDefault();
                          clickEv.stopPropagation();
                          if (!window.confirm('Remove this publication?')) return;
                          shiftOpenEntryOnRemove('publication', idx);
                          setP((prev) => ({ ...prev, publications: (prev.publications ?? []).filter((_, i) => i !== idx) }));
                        }}
                      >
                        Remove
                      </button>
                    </summary>

                    <div className="resumeEditDetails" style={{ display: 'grid', gap: 10 }}>
                      <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                        Title
                      </div>
                      <input
                        className="input"
                        value={pub.title ?? ''}
                        onChange={(e) =>
                          setP((prev) => {
                            const next = [...(prev.publications ?? [])];
                            next[idx] = { ...next[idx], title: e.target.value };
                            return { ...prev, publications: next };
                          })
                        }
                        disabled={saving}
                      />

                      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Venue (optional)
                          </div>
                          <input
                            className="input"
                            value={pub.venue ?? ''}
                            onChange={(e) =>
                              setP((prev) => {
                                const next = [...(prev.publications ?? [])];
                                next[idx] = { ...next[idx], venue: e.target.value };
                                return { ...prev, publications: next };
                              })
                            }
                            disabled={saving}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Period (optional, dates only)
                          </div>
                          {(() => {
                            const { start, end } = readPeriodDates(pub.period);
                            return (
                              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                                <input
                                  className="input"
                                  type="date"
                                  style={{ flex: 1, minWidth: 160 }}
                                  value={start}
                                  onChange={(e) =>
                                    setP((prev) => {
                                      const next = [...(prev.publications ?? [])];
                                      const cur = next[idx];
                                      next[idx] = { ...cur, period: writePeriodDates(e.target.value, readPeriodDates(cur.period).end) };
                                      return { ...prev, publications: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                                <input
                                  className="input"
                                  type="date"
                                  style={{ flex: 1, minWidth: 160 }}
                                  value={end}
                                  onChange={(e) =>
                                    setP((prev) => {
                                      const next = [...(prev.publications ?? [])];
                                      const cur = next[idx];
                                      next[idx] = { ...cur, period: writePeriodDates(readPeriodDates(cur.period).start, e.target.value) };
                                      return { ...prev, publications: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                        Description (optional)
                      </div>
                      <textarea
                        className="textarea"
                        value={pub.description ?? ''}
                        onChange={(e) =>
                          setP((prev) => {
                            const next = [...(prev.publications ?? [])];
                            next[idx] = { ...next[idx], description: e.target.value };
                            return { ...prev, publications: next };
                          })
                        }
                        disabled={saving}
                        style={{ minHeight: 110 }}
                      />

                      <div>
                        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                          Cover (optional)
                        </div>
                        <ImageDropzone
                          disabled={saving || !canWrite}
                          label="Drop an image (or click to select)"
                          hint="Square works best"
                          preview={
                            <div className="profileWorkLogoPreviewFrame" style={{ aspectRatio: '1 / 1', width: 104 }}>
                              {pub.logo?.src ? (
                                <ResolvedImage src={pub.logo.src} alt={pub.logo.alt ?? pub.title} className="profileWorkLogoPreviewImg" loading="lazy" />
                              ) : (
                                <div />
                              )}
                            </div>
                          }
                          onPick={async (f) => {
                            const src = await uploadImage({ file: f, scope: 'publication', scopeId });
                            setP((prev) => {
                              const next = [...(prev.publications ?? [])];
                              next[idx] = { ...next[idx], logo: { src, alt: next[idx]?.logo?.alt ?? f.name } };
                              return { ...prev, publications: next };
                            });
                          }}
                        />
                      </div>

                      {pub.logo?.src ? (
                        <div style={{ display: 'grid', gap: 8 }}>
                          <div className="muted" style={{ fontSize: 12 }}>
                            Image alt text (optional)
                          </div>
                          <input
                            className="input"
                            placeholder="Alt text (optional)"
                            value={pub.logo.alt ?? ''}
                            onChange={(e) =>
                              setP((prev) => {
                                const next = [...(prev.publications ?? [])];
                                const src = (next[idx]?.logo as any)?.src ?? (pub.logo as any)?.src;
                                if (src) next[idx] = { ...next[idx], logo: { src: String(src), alt: e.target.value } };
                                return { ...prev, publications: next };
                              })
                            }
                            disabled={saving}
                          />
                          <button
                            type="button"
                            className="pill"
                            disabled={saving || !canWrite}
                            onClick={() =>
                              setP((prev) => {
                                const next = [...(prev.publications ?? [])];
                                next[idx] = { ...next[idx], logo: undefined };
                                return { ...prev, publications: next };
                              })
                            }
                          >
                            Remove image
                          </button>
                        </div>
                      ) : null}

                      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 750 }}>Links (optional)</div>
                        <button
                          type="button"
                          className="pill"
                          disabled={saving}
                          onClick={() =>
                            setP((prev) => {
                              const next = [...(prev.publications ?? [])];
                              const links = [...(next[idx].links ?? []), { label: '', url: '' }];
                              next[idx] = { ...next[idx], links };
                              return { ...prev, publications: next };
                            })
                          }
                        >
                          + Add link
                        </button>
                      </div>

                      {(pub.links ?? []).length ? (
                        <div style={{ display: 'grid', gap: 10 }}>
                          {(pub.links ?? []).map((l: any, li: number) => (
                            <div key={li} className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                              <input
                                className="input"
                                style={{ flex: 1, minWidth: 160 }}
                                value={l.label ?? ''}
                                placeholder="Label"
                                onChange={(e) =>
                                  setP((prev) => {
                                    const next = [...(prev.publications ?? [])];
                                    const links = [...(next[idx].links ?? [])];
                                    links[li] = { ...links[li], label: e.target.value };
                                    next[idx] = { ...next[idx], links };
                                    return { ...prev, publications: next };
                                  })
                                }
                                disabled={saving}
                              />
                              <input
                                className="input"
                                style={{ flex: 2, minWidth: 240 }}
                                value={l.url ?? ''}
                                placeholder="https://..."
                                onChange={(e) =>
                                  setP((prev) => {
                                    const next = [...(prev.publications ?? [])];
                                    const links = [...(next[idx].links ?? [])];
                                    links[li] = { ...links[li], url: e.target.value };
                                    next[idx] = { ...next[idx], links };
                                    return { ...prev, publications: next };
                                  })
                                }
                                disabled={saving}
                              />
                              <button
                                type="button"
                                className="btn"
                                disabled={saving}
                                onClick={() =>
                                  setP((prev) => {
                                    const next = [...(prev.publications ?? [])];
                                    const links = (next[idx].links ?? []).filter((_, i) => i !== li);
                                    next[idx] = { ...next[idx], links };
                                    return { ...prev, publications: next };
                                  })
                                }
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="muted" style={{ fontSize: 12 }}>
                          No links yet.
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
              {(p.publications ?? []).length === 0 ? <div className="muted" style={{ fontSize: 12 }}>No publications yet.</div> : null}
            </div>

          </div>
        </div>

        <div className="profileEditRight">
          <div className="card" id="resume-work">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 750 }}>Work Experience</div>
              <button
                type="button"
                className="pill"
                disabled={saving}
                onClick={() => {
                  const idx = (p.work ?? []).length;
                  setEntryOpen('work', idx, true);
                  setP((prev) => ({
                    ...prev,
                    work: [
                      ...(prev.work ?? []),
                      { org: 'New Org', title: 'Role', period: undefined, stacks: [], location: '', description: '', logo: undefined, links: [] }
                    ]
                  }));
                }}
              >
                + Add
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              {(p.work ?? []).map((w, idx) => {
                const scopeId = `${idx}-${slugify(`${w.org}-${w.title}`)}`;
                return (
                  <details
                    key={idx}
                    className="resumeEditEntry"
                    open={Boolean(openEntry[entryKey('work', idx)])}
                    onToggle={(ev) => setEntryOpen('work', idx, (ev.currentTarget as HTMLDetailsElement).open)}
                  >
                    <summary className="resumeEditSummary">
                      <div className="pill">Work {idx + 1}</div>
                      <div className="resumeEditSummaryMain">
                        <div className="resumeEditSummaryTitle">{[w.org, w.title].filter(Boolean).join(' · ') || 'Untitled'}</div>
                        <div className="resumeEditSummaryMeta muted">{[formatResumePeriod(w.period), w.location].filter(Boolean).join(' · ')}</div>
                      </div>
                      <button
                        type="button"
                        className="btn danger"
                        disabled={saving}
                        onClick={(clickEv) => {
                          clickEv.preventDefault();
                          clickEv.stopPropagation();
                          if (!window.confirm('Remove this work item?')) return;
                          shiftOpenEntryOnRemove('work', idx);
                          setWorkStacksText((prev) => shiftStringMapOnRemove(prev, idx));
                          setP((prev) => ({ ...prev, work: (prev.work ?? []).filter((_, i) => i !== idx) }));
                        }}
                      >
                        Remove
                      </button>
                    </summary>

                    <div className="resumeEditDetails" style={{ display: 'grid', gap: 10 }}>
                      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Organization
                          </div>
                          <input
                            className="input"
                            value={w.org}
                            onChange={(e) =>
                              setP((prev) => {
                                const next = [...(prev.work ?? [])];
                                next[idx] = { ...next[idx], org: e.target.value };
                                return { ...prev, work: next };
                              })
                            }
                            disabled={saving}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Title / Role
                          </div>
                          <input
                            className="input"
                            value={w.title}
                            onChange={(e) =>
                              setP((prev) => {
                                const next = [...(prev.work ?? [])];
                                next[idx] = { ...next[idx], title: e.target.value };
                                return { ...prev, work: next };
                              })
                            }
                            disabled={saving}
                          />
                        </div>
                      </div>

                      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Period (optional, dates only)
                          </div>
                          {(() => {
                            const { start, end } = readPeriodDates(w.period);
                            return (
                              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                                <input
                                  className="input"
                                  type="date"
                                  style={{ flex: 1, minWidth: 160 }}
                                  value={start}
                                  onChange={(e) =>
                                    setP((prev) => {
                                      const next = [...(prev.work ?? [])];
                                      const cur = next[idx];
                                      next[idx] = { ...cur, period: writePeriodDates(e.target.value, readPeriodDates(cur.period).end) };
                                      return { ...prev, work: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                                <input
                                  className="input"
                                  type="date"
                                  style={{ flex: 1, minWidth: 160 }}
                                  value={end}
                                  onChange={(e) =>
                                    setP((prev) => {
                                      const next = [...(prev.work ?? [])];
                                      const cur = next[idx];
                                      next[idx] = { ...cur, period: writePeriodDates(readPeriodDates(cur.period).start, e.target.value) };
                                      return { ...prev, work: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                              </div>
                            );
                          })()}
                        </div>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Location (optional)
                          </div>
                          <input
                            className="input"
                            value={w.location ?? ''}
                            onChange={(e) =>
                              setP((prev) => {
                                const next = [...(prev.work ?? [])];
                                next[idx] = { ...next[idx], location: e.target.value };
                                return { ...prev, work: next };
                              })
                            }
                            disabled={saving}
                          />
                        </div>
                      </div>

                      <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                        Stacks (comma separated, optional)
                      </div>
                      <input
                        className="input"
                        value={workStacksText[idx] ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setWorkStacksText((prev) => ({ ...prev, [idx]: raw }));
                          setP((prev) => {
                            const next = [...(prev.work ?? [])];
                            next[idx] = { ...next[idx], stacks: parseCommaList(raw) };
                            return { ...prev, work: next };
                          });
                        }}
                        disabled={saving}
                      />

                      <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                        Description (optional)
                      </div>
                      <textarea
                        className="textarea"
                        value={w.description ?? ''}
                        onChange={(e) =>
                          setP((prev) => {
                            const next = [...(prev.work ?? [])];
                            next[idx] = { ...next[idx], description: e.target.value };
                            return { ...prev, work: next };
                          })
                        }
                        disabled={saving}
                        style={{ minHeight: 120 }}
                      />

                      <div>
                        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                          Logo (optional)
                        </div>
                        <ImageDropzone
                          disabled={saving || !canWrite}
                          label="Drop a logo (or click to select)"
                          hint="Shows as 16:9"
                          preview={
                            <div className="profileWorkLogoPreviewFrame" style={{ aspectRatio: '16 / 9' }}>
                              {w.logo?.src ? (
                                <ResolvedImage src={w.logo.src} alt={w.logo.alt ?? `${w.org} logo`} className="profileWorkLogoPreviewImg" loading="lazy" />
                              ) : (
                                <div />
                              )}
                            </div>
                          }
                          onPick={async (f) => {
                            const src = await uploadImage({ file: f, scope: 'work', scopeId });
                            setP((prev) => {
                              const next = [...(prev.work ?? [])];
                              next[idx] = { ...next[idx], logo: { src, alt: next[idx]?.logo?.alt ?? f.name } };
                              return { ...prev, work: next };
                            });
                          }}
                        />
                      </div>

                      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 750 }}>Links (optional)</div>
                        <button
                          type="button"
                          className="pill"
                          disabled={saving}
                          onClick={() =>
                            setP((prev) => {
                              const next = [...(prev.work ?? [])];
                              const links = [...(next[idx].links ?? []), { label: '', url: '' }];
                              next[idx] = { ...next[idx], links };
                              return { ...prev, work: next };
                            })
                          }
                        >
                          + Add
                        </button>
                      </div>

                      <div style={{ display: 'grid', gap: 10 }}>
                        {(w.links ?? []).map((l, linkIdx) => (
                          <div key={linkIdx} className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              className="input"
                              style={{ flex: 1, minWidth: 160 }}
                              placeholder="Label"
                              value={l.label}
                              onChange={(e) =>
                                setP((prev) => {
                                  const next = [...(prev.work ?? [])];
                                  const links = [...(next[idx].links ?? [])];
                                  links[linkIdx] = { ...links[linkIdx], label: e.target.value };
                                  next[idx] = { ...next[idx], links };
                                  return { ...prev, work: next };
                                })
                              }
                              disabled={saving}
                            />
                            <input
                              className="input"
                              style={{ flex: 2, minWidth: 220 }}
                              placeholder="https://..."
                              value={l.url}
                              onChange={(e) =>
                                setP((prev) => {
                                  const next = [...(prev.work ?? [])];
                                  const links = [...(next[idx].links ?? [])];
                                  links[linkIdx] = { ...links[linkIdx], url: e.target.value };
                                  next[idx] = { ...next[idx], links };
                                  return { ...prev, work: next };
                                })
                              }
                              disabled={saving}
                            />
                            <button
                              type="button"
                              className="btn"
                              disabled={saving}
                              onClick={() =>
                                setP((prev) => {
                                  const next = [...(prev.work ?? [])];
                                  const links = (next[idx].links ?? []).filter((_, i) => i !== linkIdx);
                                  next[idx] = { ...next[idx], links };
                                  return { ...prev, work: next };
                                })
                              }
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                );
              })}
              {(p.work ?? []).length === 0 ? <div className="muted" style={{ fontSize: 12 }}>No work items yet.</div> : null}
            </div>
          </div>

          <div className="card" id="resume-projects">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 750 }}>Projects</div>
              <button
                type="button"
                className="pill"
                disabled={saving}
                onClick={() => {
                  const idx = (p.projects ?? []).length;
                  setEntryOpen('project', idx, true);
                  setP((prev) => ({
                    ...prev,
                    projects: [...(prev.projects ?? []), { title: 'New Project', role: '', period: undefined, description: '', doc: null, links: [], media: [], tags: [] }]
                  }));
                }}
              >
                + Add project
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              {(p.projects ?? []).map((proj, projIdx) => {
                const scopeId = `${projIdx}-${slugify(proj.title)}`;
                const cover = Array.isArray(proj.media) && proj.media.length ? proj.media[0] : null;
                return (
                  <details
                    key={projIdx}
                    className="resumeEditEntry"
                    open={Boolean(openEntry[entryKey('project', projIdx)])}
                    onToggle={(ev) => setEntryOpen('project', projIdx, (ev.currentTarget as HTMLDetailsElement).open)}
                  >
                    <summary className="resumeEditSummary">
                      <div className="pill">Project {projIdx + 1}</div>
                      <div className="resumeEditSummaryMain">
                        <div className="resumeEditSummaryTitle">{proj.title || 'Untitled'}</div>
                        <div className="resumeEditSummaryMeta muted">{[proj.role, formatResumePeriod(proj.period)].filter(Boolean).join(' · ')}</div>
                      </div>
                      <button
                        type="button"
                        className="btn"
                        disabled={saving}
                        onClick={(clickEv) => {
                          clickEv.preventDefault();
                          clickEv.stopPropagation();
                          setProjectEditorIndex(projIdx);
                        }}
                      >
                        Open page
                      </button>
                      <button
                        className="btn danger"
                        type="button"
                        disabled={saving}
                        onClick={(clickEv) => {
                          clickEv.preventDefault();
                          clickEv.stopPropagation();
                          if (!window.confirm('Remove this project?')) return;
                          shiftOpenEntryOnRemove('project', projIdx);
                          setProjectTagsText((prev) => shiftStringMapOnRemove(prev, projIdx));
                          setP((prev) => ({ ...prev, projects: (prev.projects ?? []).filter((_, i) => i !== projIdx) }));
                          setProjectEditorIndex((cur) => {
                            if (cur === null) return null;
                            if (cur === projIdx) return null;
                            if (cur > projIdx) return cur - 1;
                            return cur;
                          });
                        }}
                      >
                        Remove
                      </button>
                    </summary>

                    <div className="resumeEditDetails" style={{ display: 'grid', gap: 10 }}>
                      <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                        Title
                      </div>
                      <input
                        className="input"
                        value={proj.title}
                        onChange={(e) =>
                          setP((prev) => {
                            const next = [...prev.projects];
                            next[projIdx] = { ...next[projIdx], title: e.target.value };
                            return { ...prev, projects: next };
                          })
                        }
                        disabled={saving}
                      />

                      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Role
                          </div>
                          <input
                            className="input"
                            value={proj.role}
                            onChange={(e) =>
                              setP((prev) => {
                                const next = [...prev.projects];
                                next[projIdx] = { ...next[projIdx], role: e.target.value };
                                return { ...prev, projects: next };
                              })
                            }
                            disabled={saving}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Period (optional, dates only)
                          </div>
                          {(() => {
                            const { start, end } = readPeriodDates(proj.period);
                            return (
                              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                                <input
                                  className="input"
                                  type="date"
                                  style={{ flex: 1, minWidth: 160 }}
                                  value={start}
                                  onChange={(e) =>
                                    setP((prev) => {
                                      const next = [...prev.projects];
                                      const cur = next[projIdx];
                                      next[projIdx] = { ...cur, period: writePeriodDates(e.target.value, readPeriodDates(cur.period).end) };
                                      return { ...prev, projects: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                                <input
                                  className="input"
                                  type="date"
                                  style={{ flex: 1, minWidth: 160 }}
                                  value={end}
                                  onChange={(e) =>
                                    setP((prev) => {
                                      const next = [...prev.projects];
                                      const cur = next[projIdx];
                                      next[projIdx] = { ...cur, period: writePeriodDates(readPeriodDates(cur.period).start, e.target.value) };
                                      return { ...prev, projects: next };
                                    })
                                  }
                                  disabled={saving}
                                />
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                        Tags (comma separated, optional)
                      </div>
                      <input
                        className="input"
                        value={projectTagsText[projIdx] ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setProjectTagsText((prev) => ({ ...prev, [projIdx]: raw }));
                          setP((prev) => {
                            const next = [...prev.projects];
                            next[projIdx] = { ...next[projIdx], tags: parseCommaList(raw) };
                            return { ...prev, projects: next };
                          });
                        }}
                        disabled={saving}
                      />

                      <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                        Description (optional)
                      </div>
                      <textarea
                        className="textarea"
                        value={proj.description}
                        onChange={(e) =>
                          setP((prev) => {
                            const next = [...prev.projects];
                            next[projIdx] = { ...next[projIdx], description: e.target.value };
                            return { ...prev, projects: next };
                          })
                        }
                        disabled={saving}
                        style={{ minHeight: 110 }}
                      />

                      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <div className="muted" style={{ fontSize: 12 }}>
                          Page content (Notion-style)
                        </div>
                        <button
                          type="button"
                          className="pill"
                          disabled={saving}
                          onClick={() => setProjectEditorIndex(projIdx)}
                        >
                          {proj.doc ? 'Edit page' : 'Write page'}
                        </button>
                      </div>

                      <div className="muted" style={{ fontSize: 12 }}>
                        {proj.doc ? 'Page exists. Open the page to edit.' : 'No page yet. Open the page to write.'}
                      </div>

                      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 750 }}>Links (optional)</div>
                        <button
                          type="button"
                          className="pill"
                          disabled={saving}
                          onClick={() =>
                            setP((prev) => {
                              const next = [...prev.projects];
                              const links = [...(next[projIdx].links ?? []), { label: '', url: '' }];
                              next[projIdx] = { ...next[projIdx], links };
                              return { ...prev, projects: next };
                            })
                          }
                        >
                          + Add link
                        </button>
                      </div>

                      {(proj.links ?? []).length ? (
                        <div style={{ display: 'grid', gap: 10 }}>
                          {(proj.links ?? []).map((l: any, li: number) => (
                            <div key={li} className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                              <input
                                className="input"
                                style={{ flex: 1, minWidth: 160 }}
                                placeholder="Label"
                                value={l.label ?? ''}
                                onChange={(e) =>
                                  setP((prev) => {
                                    const next = [...prev.projects];
                                    const links = [...(next[projIdx].links ?? [])];
                                    links[li] = { ...links[li], label: e.target.value };
                                    next[projIdx] = { ...next[projIdx], links };
                                    return { ...prev, projects: next };
                                  })
                                }
                                disabled={saving}
                              />
                              <input
                                className="input"
                                style={{ flex: 2, minWidth: 220 }}
                                placeholder="https://..."
                                value={l.url ?? ''}
                                onChange={(e) =>
                                  setP((prev) => {
                                    const next = [...prev.projects];
                                    const links = [...(next[projIdx].links ?? [])];
                                    links[li] = { ...links[li], url: e.target.value };
                                    next[projIdx] = { ...next[projIdx], links };
                                    return { ...prev, projects: next };
                                  })
                                }
                                disabled={saving}
                              />
                              <button
                                type="button"
                                className="btn"
                                disabled={saving}
                                onClick={() =>
                                  setP((prev) => {
                                    const next = [...prev.projects];
                                    const links = (next[projIdx].links ?? []).filter((_, i) => i !== li);
                                    next[projIdx] = { ...next[projIdx], links };
                                    return { ...prev, projects: next };
                                  })
                                }
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="muted" style={{ fontSize: 12 }}>
                          No links yet.
                        </div>
                      )}

                      <div>
                        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                          Cover (optional)
                        </div>
                        <ImageDropzone
                          disabled={saving || !canWrite}
                          label="Drop a cover image (or click to select)"
                          hint="Shows as 16:10"
                          preview={
                            <div className="profileMediaFrame" style={{ aspectRatio: '16 / 10' }}>
                              {cover?.src ? <ResolvedImage src={cover.src} alt={cover.alt ?? proj.title} className="profileMediaImg" loading="lazy" /> : <div />}
                            </div>
                          }
                          onPick={async (f) => {
                            const src = await uploadImage({ file: f, scope: 'project', scopeId });
                            setP((prev) => {
                              const next = [...prev.projects];
                              next[projIdx] = { ...next[projIdx], media: [{ src, alt: next[projIdx]?.media?.[0]?.alt ?? f.name }] };
                              return { ...prev, projects: next };
                            });
                          }}
                        />
                      </div>

                      {cover?.src ? (
                        <div style={{ display: 'grid', gap: 8 }}>
                          <div className="muted" style={{ fontSize: 12 }}>
                            Cover alt text (optional)
                          </div>
                          <input
                            className="input"
                            placeholder="Alt text (optional)"
                            value={cover.alt ?? ''}
                            onChange={(e) =>
                              setP((prev) => {
                                const next = [...prev.projects];
                                const cur = next[projIdx];
                                next[projIdx] = { ...cur, media: [{ ...(cur.media?.[0] ?? { src: cover.src }), alt: e.target.value }] };
                                return { ...prev, projects: next };
                              })
                            }
                            disabled={saving}
                          />
                          <button
                            type="button"
                            className="pill"
                            disabled={saving || !canWrite}
                            onClick={() =>
                              setP((prev) => {
                                const next = [...prev.projects];
                                next[projIdx] = { ...next[projIdx], media: [] };
                                return { ...prev, projects: next };
                              })
                            }
                          >
                            Remove cover
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="resumeSaveBar" role="region" aria-label="Resume editor actions">
        <div className="resumeSaveBarInner">
          <Link to="/resume" className="pill">
            Cancel
          </Link>
          <button className="btn primary" disabled={saving || !canWrite} onClick={() => save()} type="button">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {projectEditorIndex !== null && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="projectModalOverlay"
              role="dialog"
              aria-modal="true"
              aria-label="Edit project page"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.target === e.currentTarget) setProjectEditorIndex(null);
              }}
            >
              <div className="projectModal" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                <div className="projectModalTop">
                  <div style={{ minWidth: 0 }}>
                    <div className="projectModalTitle">{p.projects?.[projectEditorIndex]?.title || 'Project'}</div>
                    <div className="muted" style={{ marginTop: 2 }}>
                      {[p.projects?.[projectEditorIndex]?.role, formatResumePeriod(p.projects?.[projectEditorIndex]?.period)].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <button type="button" className="btn iconBtn" aria-label="Close" title="Close" onClick={() => setProjectEditorIndex(null)}>
                    <IconX size={18} />
                  </button>
                </div>

                <div className="projectModalBody">
                  {(() => {
                    const proj = p.projects?.[projectEditorIndex] ?? null;
                    if (!proj) return <div className="muted">Missing project.</div>;
                    const scopeId = `${projectEditorIndex}-${slugify(proj.title)}`;
                    const cover = Array.isArray(proj.media) && proj.media.length ? proj.media[0] : null;
                    return (
                      <div style={{ display: 'grid', gap: 12 }}>
                        <div>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                            Cover (optional)
                          </div>
                          <ImageDropzone
                            disabled={saving || !canWrite}
                            label="Drop a cover image (or click to select)"
                            hint="Shows as 16:9"
                            preview={
                              <div className="projectModalHero">
                                {cover?.src ? (
                                  <ResolvedImage src={cover.src} alt={cover.alt ?? proj.title} className="projectModalHeroImg" loading="lazy" />
                                ) : (
                                  <div />
                                )}
                              </div>
                            }
                            onPick={async (f) => {
                              const src = await uploadImage({ file: f, scope: 'project', scopeId });
                              setP((prev) => {
                                const next = [...prev.projects];
                                next[projectEditorIndex] = { ...next[projectEditorIndex], media: [{ src, alt: next[projectEditorIndex]?.media?.[0]?.alt ?? f.name }] };
                                return { ...prev, projects: next };
                              });
                            }}
                          />
                        </div>

                        {cover?.src ? (
                          <div style={{ display: 'grid', gap: 8 }}>
                            <div className="muted" style={{ fontSize: 12 }}>
                              Cover alt text (optional)
                            </div>
                            <input
                              className="input"
                              value={cover.alt ?? ''}
                              onChange={(e) =>
                                setP((prev) => {
                                  const next = [...prev.projects];
                                  const cur = next[projectEditorIndex];
                                  next[projectEditorIndex] = { ...cur, media: [{ ...(cur.media?.[0] ?? { src: cover.src }), alt: e.target.value }] };
                                  return { ...prev, projects: next };
                                })
                              }
                              disabled={saving}
                              placeholder="Alt text (optional)"
                            />
                            <button
                              type="button"
                              className="pill"
                              disabled={saving || !canWrite}
                              onClick={() =>
                                setP((prev) => {
                                  const next = [...prev.projects];
                                  next[projectEditorIndex] = { ...next[projectEditorIndex], media: [] };
                                  return { ...prev, projects: next };
                                })
                              }
                            >
                              Remove cover
                            </button>
                          </div>
                        ) : null}

                        <div className="muted" style={{ fontSize: 12 }}>
                          Write like a new page. Images can be inserted directly into the editor (drag & drop or paste).
                        </div>

                        <div className="card" style={{ padding: 12 }}>
                          <RichEditor
                            initialDoc={proj.doc ?? null}
                            onChange={(doc) =>
                              setP((prev) => {
                                const next = [...prev.projects];
                                next[projectEditorIndex] = { ...next[projectEditorIndex], doc };
                                return { ...prev, projects: next };
                              })
                            }
                            onUploadImage={async (file) => await uploadImage({ file, scope: 'project', scopeId })}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
