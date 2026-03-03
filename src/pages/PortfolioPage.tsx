import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/auth/AuthContext';
import { getPortfolioIndex } from '../app/content/contentIndex';
import { isGitHubWriteEnabled, isLocalMode } from '../app/mode';
import Lightbox, { type LightboxItem } from '../shared/ui/Lightbox';
import ResolvedImage from '../shared/ui/ResolvedImage';
import PostDocView from './PostDocView';
import { IconX } from '../shared/ui/icons';
import { formatResumePeriod, normalizeResumePeriod } from '../shared/lib/resumePeriod';

function normalizePortfolio(p: any) {
  const readLogo = (x: any) => {
    if (!x || typeof x !== 'object') return null;
    if (typeof x.src !== 'string' || !x.src) return null;
    return { src: x.src, alt: typeof x.alt === 'string' ? x.alt : undefined };
  };

  const readLinks = (x: any) => {
    if (!Array.isArray(x)) return [];
    return x
      .map((l: any) => ({ label: String(l?.label ?? ''), url: String(l?.url ?? '') }))
      .filter((l: any) => l.url);
  };

  const coerceLine = (x: any) => {
    if (typeof x === 'string') return x;
    if (x && typeof x === 'object') {
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
    summary: typeof p?.summary === 'string' ? p.summary : '',
    ethics: typeof p?.ethics === 'string' ? p.ethics : '',
    skills: Array.isArray(p?.skills) ? p.skills.filter((x: any) => typeof x === 'string') : [],
    links: Array.isArray(p?.links) ? p.links.map((l: any) => ({ label: String(l?.label ?? ''), url: String(l?.url ?? '') })) : [],
    facts: Array.isArray(p?.facts)
      ? p.facts
          .map((f: any) => ({ label: String(f?.label ?? ''), value: String(f?.value ?? '') }))
          .filter((f: any) => f.label || f.value)
      : [],
    contact:
      p?.contact && typeof p.contact === 'object'
        ? {
            phone: typeof p.contact.phone === 'string' ? p.contact.phone : '',
            email: typeof p.contact.email === 'string' ? p.contact.email : '',
            location: typeof p.contact.location === 'string' ? p.contact.location : ''
          }
        : { phone: '', email: '', location: '' },
    hobbies: Array.isArray(p?.hobbies) ? p.hobbies.map(String).filter(Boolean) : [],
    languages: Array.isArray(p?.languages) ? p.languages.map(String).filter(Boolean) : [],
    work: Array.isArray(p?.work)
      ? p.work.map((w: any) => ({
          org: String(w?.org ?? ''),
          title: String(w?.title ?? ''),
          period: normalizeResumePeriod(w?.period),
          stacks: Array.isArray(w?.stacks) ? w.stacks.map(String).filter(Boolean) : [],
          location: typeof w?.location === 'string' ? w.location : '',
          description: typeof w?.description === 'string' ? w.description : '',
          logo: w?.logo && typeof w.logo?.src === 'string' ? { src: String(w.logo.src), alt: typeof w.logo.alt === 'string' ? String(w.logo.alt) : undefined } : null,
          links: readLinks(w?.links)
        }))
      : [],
    awards: Array.isArray(p?.awards)
      ? p.awards
          .map((a: any) => {
            if (typeof a === 'string') return { title: a };
            if (!a || typeof a !== 'object') return null;
            const title = String(a.title ?? a.name ?? '').trim();
            if (!title) return null;
            const issuer = typeof a.issuer === 'string' ? a.issuer : typeof a.org === 'string' ? a.org : '';
            const period = normalizeResumePeriod(a.period);
            const description = typeof a.description === 'string' ? a.description : '';
            return {
              title,
              issuer: issuer || undefined,
              period,
              description: description || undefined,
              logo: readLogo(a.logo),
              links: readLinks(a.links)
            };
          })
          .filter(Boolean)
      : [],
    certificates: Array.isArray(p?.certificates)
      ? p.certificates
          .map((a: any) => {
            if (typeof a === 'string') return { title: a };
            if (!a || typeof a !== 'object') return null;
            const title = String(a.title ?? a.name ?? '').trim();
            if (!title) return null;
            const issuer = typeof a.issuer === 'string' ? a.issuer : typeof a.org === 'string' ? a.org : '';
            const period = normalizeResumePeriod(a.period);
            const description = typeof a.description === 'string' ? a.description : '';
            return {
              title,
              issuer: issuer || undefined,
              period,
              description: description || undefined,
              logo: readLogo(a.logo),
              links: readLinks(a.links)
            };
          })
          .filter(Boolean)
      : [],
    education: Array.isArray(p?.education)
      ? p.education
          .map((e: any) => {
            if (typeof e === 'string') return { school: e };
            if (!e || typeof e !== 'object') return null;
            const school = String(e.school ?? e.org ?? e.title ?? '').trim();
            if (!school) return null;
            const degree = typeof e.degree === 'string' ? e.degree : typeof e.major === 'string' ? e.major : '';
            const period = normalizeResumePeriod(e.period);
            const description = typeof e.description === 'string' ? e.description : '';
            return {
              school,
              degree: degree || undefined,
              period,
              description: description || undefined,
              logo: readLogo(e.logo),
              links: readLinks(e.links)
            };
          })
          .filter(Boolean)
      : [],
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
            const venue = typeof pub.venue === 'string' ? pub.venue : typeof pub.org === 'string' ? pub.org : typeof pub.issuer === 'string' ? pub.issuer : '';
            const period = normalizeResumePeriod(pub.period);
            const description = typeof pub.description === 'string' ? pub.description : '';
            return {
              title,
              venue: venue || undefined,
              period,
              description: description || undefined,
              logo: readLogo(pub.logo),
              links: readLinks(pub.links)
            };
          })
          .filter(Boolean)
      : [],
    projects: Array.isArray(p?.projects)
      ? p.projects.map((proj: any) => ({
          title: String(proj?.title ?? ''),
          role: String(proj?.role ?? ''),
          period: normalizeResumePeriod(proj?.period),
          description: String(proj?.description ?? ''),
          doc: proj?.doc ?? null,
          links: readLinks(proj?.links),
          media: Array.isArray(proj?.media) ? proj.media : [],
          tags: Array.isArray(proj?.tags) ? proj.tags : []
        }))
      : []
  };
}

export default function PortfolioPage() {
  const raw = getPortfolioIndex().portfolio;
  const p = React.useMemo(() => normalizePortfolio(raw), [raw]);

  const local = isLocalMode();
  const ghEnabled = isGitHubWriteEnabled();
  const { state, isAllowedUser } = useAuth();
  const canGitHubWrite = ghEnabled && Boolean(state.accessToken) && isAllowedUser;
  const canWrite = local ? true : canGitHubWrite;

  const [lbItems, setLbItems] = React.useState<LightboxItem[]>([]);
  const [lbIndex, setLbIndex] = React.useState<number | null>(null);
  const [openProject, setOpenProject] = React.useState<number | null>(null);
  const project = openProject === null ? null : (p.projects[openProject] ?? null);
  const projectBodyRef = React.useRef<HTMLDivElement | null>(null);

  function openResumeLightbox(params: {
    src: string;
    alt: string;
    title?: string;
    subtitle?: string;
    pill?: string;
    rows?: Array<{ key: string; value: string | undefined | null }>;
    links?: Array<{ label?: string; url: string }>;
  }) {
    const rows = (params.rows ?? [])
      .map((r) => ({ key: String(r.key), value: String(r.value ?? '').trim() }))
      .filter((r) => r.key && r.value);
    const links = (params.links ?? []).filter((l) => Boolean(l?.url));
    const item: LightboxItem = {
      src: params.src,
      alt: params.alt,
      meta:
        params.title || params.subtitle || params.pill || rows.length || links.length
          ? {
              title: params.title,
              intent: params.subtitle,
              date: params.pill,
              rows: rows.length ? rows : undefined,
              links: links.length ? links : undefined
            }
          : undefined
    };
    setLbItems([item]);
    setLbIndex(0);
  }

  React.useEffect(() => {
    if (openProject === null) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prevOverflow;
    };
  }, [openProject]);

  React.useEffect(() => {
    if (openProject === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenProject(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openProject]);

  const isEmpty =
    !p.name &&
    !p.headline &&
    !p.summary &&
    !p.ethics &&
    p.links.length === 0 &&
    p.projects.length === 0 &&
    p.awards.length === 0 &&
    p.certificates.length === 0 &&
    p.education.length === 0 &&
    p.publications.length === 0 &&
    p.work.length === 0 &&
    p.facts.length === 0;

  return (
    <div className="profilePage">
      {p.cover?.src ? (
        <div className="profileCoverFrame" style={{ aspectRatio: '16 / 6' }}>
          <ResolvedImage src={p.cover.src} alt={p.cover.alt ?? p.name ?? 'Cover'} className="profileCoverImg" loading="lazy" />
        </div>
      ) : null}

      <div className="profileCv">
        <aside className="profileSidebar">
          <div className="profileSidebarCard">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <div className="profileSidebarName">{p.name || 'Resume'}</div>
              <div className="row" style={{ gap: 8 }}>
                <Link to="/" className="pill">
                  Home
                </Link>
                <Link to="/profile" className="pill">
                  Profile
                </Link>
                {canWrite ? (
                  <Link to="/resume/edit" className="pill">
                    Edit
                  </Link>
                ) : null}
              </div>
            </div>

            {p.photo?.src ? (
              <div className="profileSidebarPhoto" style={{ marginTop: 12 }}>
                <div className="profilePhotoFrame" style={{ aspectRatio: '4 / 5' }}>
                  <ResolvedImage src={p.photo.src} alt={p.photo.alt ?? p.name ?? 'Profile'} className="profilePhotoImg" loading="lazy" />
                </div>
              </div>
            ) : null}

            {p.headline ? <div className="profileSidebarHeadline">{p.headline}</div> : null}

            {p.skills.length ? (
              <div className="profileSkills" style={{ marginTop: 12 }}>
                {p.skills.map((s: string) => (
                  <div key={s} className="pill">
                    {s}
                  </div>
                ))}
              </div>
            ) : null}

            {p.contact.phone || p.contact.email || p.contact.location ? (
              <div style={{ marginTop: 14 }}>
                <div className="profileSidebarTitle">Contact</div>
                <div className="profileSidebarList">
                  {p.contact.phone ? (
                    <div className="profileSidebarItem">
                      <span className="profileSidebarKey">Phone</span>
                      <span className="profileSidebarVal">{p.contact.phone}</span>
                    </div>
                  ) : null}
                  {p.contact.email ? (
                    <div className="profileSidebarItem">
                      <span className="profileSidebarKey">Email</span>
                      <span className="profileSidebarVal">{p.contact.email}</span>
                    </div>
                  ) : null}
                  {p.contact.location ? (
                    <div className="profileSidebarItem">
                      <span className="profileSidebarKey">Location</span>
                      <span className="profileSidebarVal">{p.contact.location}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {p.hobbies.length ? (
              <div style={{ marginTop: 14 }}>
                <div className="profileSidebarTitle">Hobbies</div>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {p.hobbies.map((h: string, idx: number) => (
                    <div key={`${h}-${idx}`} className="pill">
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {p.languages.length ? (
              <div style={{ marginTop: 14 }}>
                <div className="profileSidebarTitle">Languages</div>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {p.languages.map((l: string, idx: number) => (
                    <div key={`${l}-${idx}`} className="pill">
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {p.links.length ? (
              <div style={{ marginTop: 14 }}>
                <div className="profileSidebarTitle">Links</div>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {p.links
                    .filter((l: any) => l?.url)
                    .map((l: any) => (
                      <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="pill">
                        {l.label || l.url}
                      </a>
                    ))}
                </div>
              </div>
            ) : null}

            {p.facts.length ? (
              <div className="profileFacts" style={{ marginTop: 14 }}>
                {p.facts.map((f: any, idx: number) => (
                  <div key={idx} className="profileFactRow">
                    <div className="profileFactLabel">{f.label}</div>
                    <div className="profileFactValue">{f.value}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </aside>

        <div className="profileMain">
          {p.summary ? (
            <section className="profileCallout">
              <div className="profileCalloutTitle">Intro</div>
              <div className="profileCalloutBody">{p.summary}</div>
            </section>
          ) : null}

          {p.ethics ? (
            <section className="card profileSection">
              <div className="profileSectionTitle">Ethics / Notes</div>
              <div className="profileSectionBody">{p.ethics}</div>
            </section>
          ) : null}

          {p.work.length ? (
            <section className="card profileSection">
              <div className="profileSectionTitle">Work Experience</div>
              <div className="profileWorkList">
                {p.work.map((w: any, idx: number) => (
                  <div key={idx} className="profileWorkItem">
                    <div className="profileWorkLeft">
                      {w.logo?.src ? (
                        <div className="profileWorkLogoFrame" style={{ aspectRatio: '1 / 1' }}>
                          <ResolvedImage src={w.logo.src} alt={w.logo.alt ?? `${w.org} logo`} className="profileWorkLogoImg" loading="lazy" />
                        </div>
                      ) : (
                        <div className="profileWorkLogoFallback" aria-hidden="true">
                          {String(w.org || '?').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="profileWorkRight">
                      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                        <div>
                          <div className="profileWorkOrg">{w.org}</div>
                          <div className="profileWorkTitle">{w.title}</div>
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {[formatResumePeriod(w.period), w.location].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      {w.stacks?.length ? (
                        <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                          {w.stacks.map((s: string) => (
                            <div key={s} className="pill">
                              {s}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {w.description ? (
                        <div className="muted" style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>
                          {w.description}
                        </div>
                      ) : null}
                      {w.links?.length ? (
                        <div className="row" style={{ marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
                          {w.links
                            .filter((l: any) => l?.url)
                            .map((l: any) => (
                              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="pill">
                                {l.label || l.url}
                              </a>
                            ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {p.education.length ? (
            <section className="card profileSection">
              <div className="profileSectionTitle">Education</div>
              <div className="profileWorkList">
                {p.education.map((e: any, idx: number) => {
                  const periodText = formatResumePeriod(e.period);
                  return (
                    <div key={idx} className="profileWorkItem">
                      <div className="profileWorkLeft">
                        {e.logo?.src ? (
                          <button
                            type="button"
                            className="profileWorkLogoBtn"
                            aria-label="Open image"
                            title="Open image"
                            onClick={() => {
                              openResumeLightbox({
                                src: e.logo.src,
                                alt: e.logo.alt ?? e.school,
                                title: e.school,
                                subtitle: e.degree || undefined,
                                pill: periodText || undefined,
                                rows: [
                                  { key: 'Type', value: 'Education' },
                                  { key: 'School', value: e.school },
                                  { key: 'Degree', value: e.degree },
                                  { key: 'Period', value: periodText }
                                ],
                                links: e.links
                              });
                            }}
                          >
                            <div className="profileWorkLogoFrame" style={{ aspectRatio: '1 / 1' }}>
                              <ResolvedImage src={e.logo.src} alt={e.logo.alt ?? e.school} className="profileWorkLogoImg" loading="lazy" />
                            </div>
                          </button>
                        ) : (
                          <div className="profileWorkLogoFallback" aria-hidden="true">
                            {String(e.school || '?').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="profileWorkRight">
                        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                          <div>
                            <div className="profileWorkOrg">{e.school}</div>
                            {e.degree ? <div className="profileWorkTitle">{e.degree}</div> : null}
                          </div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {periodText}
                          </div>
                        </div>
                        {e.description ? (
                          <div className="muted" style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>
                            {e.description}
                          </div>
                        ) : null}
                        {e.links?.length ? (
                          <div className="row" style={{ marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
                            {e.links.map((l: any) => (
                              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="pill">
                                {l.label || l.url}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {p.awards.length ? (
            <section className="card profileSection">
              <div className="profileSectionTitle">Awards</div>
              <div className="resumeEntryList">
                {p.awards.map((a: any, i: number) => (
                  <div className="resumeEntry resumeMediaEntry resumeMediaEntryA4Portrait" key={i}>
                    <button
                      type="button"
                      className="resumeMediaBtn"
                      aria-label="Open image"
                      title="Open image"
                      disabled={!a.logo?.src}
                      onClick={() => {
                        if (!a.logo?.src) return;
                        openResumeLightbox({
                          src: a.logo.src,
                          alt: a.logo.alt ?? a.title,
                          title: a.title,
                          subtitle: a.issuer || undefined,
                          pill: formatResumePeriod(a.period) || undefined,
                          rows: [
                            { key: 'Type', value: 'Award' },
                            { key: 'Issuer', value: a.issuer },
                            { key: 'Period', value: formatResumePeriod(a.period) },
                            { key: 'Description', value: a.description }
                          ],
                          links: a.links
                        });
                      }}
                    >
                      <div className="resumeMediaFrame resumeMediaFrameA4Portrait" aria-hidden="true">
                        {a.logo?.src ? <ResolvedImage src={a.logo.src} alt={a.logo.alt ?? a.title} className="resumeMediaImg" loading="lazy" /> : <div />}
                      </div>
                    </button>
                    <div className="resumeEntryBody">
                      <div className="resumeEntryTop">
                        <div>
                          <div className="resumeEntryTitle">{a.title}</div>
                          {a.issuer ? <div className="muted" style={{ marginTop: 2 }}>{a.issuer}</div> : null}
                        </div>
                        {formatResumePeriod(a.period) ? <div className="pill">{formatResumePeriod(a.period)}</div> : null}
                      </div>
                      {a.description ? (
                        <div className="muted" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                          {a.description}
                        </div>
                      ) : null}
                      {a.links?.length ? (
                        <div className="row" style={{ marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
                          {a.links.map((l: any) => (
                            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="pill">
                              {l.label || l.url}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {p.certificates.length ? (
            <section className="card profileSection">
              <div className="profileSectionTitle">Certificates</div>
              <div className="resumeEntryList">
                {p.certificates.map((a: any, i: number) => (
                  <div className="resumeEntry resumeMediaEntry resumeMediaEntryA4Portrait" key={i}>
                    <button
                      type="button"
                      className="resumeMediaBtn"
                      aria-label="Open image"
                      title="Open image"
                      disabled={!a.logo?.src}
                      onClick={() => {
                        if (!a.logo?.src) return;
                        openResumeLightbox({
                          src: a.logo.src,
                          alt: a.logo.alt ?? a.title,
                          title: a.title,
                          subtitle: a.issuer || undefined,
                          pill: formatResumePeriod(a.period) || undefined,
                          rows: [
                            { key: 'Type', value: 'Certificate' },
                            { key: 'Issuer', value: a.issuer },
                            { key: 'Period', value: formatResumePeriod(a.period) },
                            { key: 'Description', value: a.description }
                          ],
                          links: a.links
                        });
                      }}
                    >
                      <div className="resumeMediaFrame resumeMediaFrameA4Portrait" aria-hidden="true">
                        {a.logo?.src ? <ResolvedImage src={a.logo.src} alt={a.logo.alt ?? a.title} className="resumeMediaImg" loading="lazy" /> : <div />}
                      </div>
                    </button>
                    <div className="resumeEntryBody">
                      <div className="resumeEntryTop">
                        <div>
                          <div className="resumeEntryTitle">{a.title}</div>
                          {a.issuer ? <div className="muted" style={{ marginTop: 2 }}>{a.issuer}</div> : null}
                        </div>
                        {formatResumePeriod(a.period) ? <div className="pill">{formatResumePeriod(a.period)}</div> : null}
                      </div>
                      {a.description ? (
                        <div className="muted" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                          {a.description}
                        </div>
                      ) : null}
                      {a.links?.length ? (
                        <div className="row" style={{ marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
                          {a.links.map((l: any) => (
                            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="pill">
                              {l.label || l.url}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {p.publications.length ? (
            <section className="card profileSection">
              <div className="profileSectionTitle">Publications</div>
              <div className="resumeEntryList">
                {p.publications.map((pub: any, i: number) => (
                  <div className="resumeEntry resumeMediaEntry resumeMediaEntryA4Portrait" key={i}>
                    <button
                      type="button"
                      className="resumeMediaBtn"
                      aria-label="Open image"
                      title="Open image"
                      disabled={!pub.logo?.src}
                      onClick={() => {
                        if (!pub.logo?.src) return;
                        openResumeLightbox({
                          src: pub.logo.src,
                          alt: pub.logo.alt ?? pub.title,
                          title: pub.title,
                          subtitle: pub.venue || undefined,
                          pill: formatResumePeriod(pub.period) || undefined,
                          rows: [
                            { key: 'Type', value: 'Publication' },
                            { key: 'Venue', value: pub.venue },
                            { key: 'Period', value: formatResumePeriod(pub.period) },
                            { key: 'Description', value: pub.description }
                          ],
                          links: pub.links
                        });
                      }}
                    >
                      <div className="resumeMediaFrame resumeMediaFrameA4Portrait" aria-hidden="true">
                        {pub.logo?.src ? (
                          <ResolvedImage src={pub.logo.src} alt={pub.logo.alt ?? pub.title} className="resumeMediaImg" loading="lazy" />
                        ) : (
                          <div className="resumeEntryLogoFallback">P</div>
                        )}
                      </div>
                    </button>
                    <div className="resumeEntryBody">
                      <div className="resumeEntryTop">
                        <div>
                          <div className="resumeEntryTitle">{pub.title}</div>
                          {pub.venue ? <div className="muted" style={{ marginTop: 2 }}>{pub.venue}</div> : null}
                        </div>
                        {formatResumePeriod(pub.period) ? <div className="pill">{formatResumePeriod(pub.period)}</div> : null}
                      </div>
                      {pub.description ? (
                        <div className="muted" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                          {pub.description}
                        </div>
                      ) : null}
                      {pub.links?.length ? (
                        <div className="row" style={{ marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
                          {pub.links.map((l: any) => (
                            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="pill">
                              {l.label || l.url}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="card profileSection profileProjects">
            <div className="profileSectionTitle">Projects</div>
            <div className="resumeEntryList">
              {p.projects.map((proj: any, projIdx: number) => {
                const cover = (proj.media ?? [])?.[0] ?? null;
                const openLightbox = () => {
                  if (!cover?.src) return;
                  openResumeLightbox({
                    src: String(cover.src),
                    alt: String(cover.alt ?? proj.title ?? `Project ${projIdx + 1}`),
                    title: proj.title || `Project ${projIdx + 1}`,
                    subtitle: proj.role || undefined,
                    pill: formatResumePeriod(proj.period) || undefined,
                    rows: [
                      { key: 'Type', value: 'Project' },
                      { key: 'Role', value: proj.role },
                      { key: 'Period', value: formatResumePeriod(proj.period) },
                      { key: 'Tags', value: Array.isArray(proj.tags) ? proj.tags.filter(Boolean).join(', ') : '' }
                    ],
                    links: proj.links
                  });
                };
                return (
                  <div
                    key={projIdx}
                    className="resumeEntry projectEntry"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter' && e.key !== ' ') return;
                      e.preventDefault();
                      setOpenProject(projIdx);
                    }}
                    onClick={() => setOpenProject(projIdx)}
                    aria-label={`Open project: ${proj.title}`}
                  >
                    <button
                      type="button"
                      className="projectMediaBtn"
                      aria-label="Open image"
                      title="Open image"
                      disabled={!cover?.src}
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox();
                      }}
                    >
                      <div className="projectMediaFrame" aria-hidden="true">
                        {cover?.src ? (
                          <ResolvedImage
                            src={String(cover.src)}
                            alt={String(cover.alt ?? proj.title ?? '')}
                            className="projectMediaImg"
                            loading="lazy"
                          />
                        ) : (
                          <div />
                        )}
                      </div>
                    </button>

                    <div className="resumeEntryBody">
                      <div className="resumeEntryTop">
                        <div>
                          <div className="projectTitle">{proj.title}</div>
                          <div className="muted">{proj.role}</div>
                        </div>
                        {formatResumePeriod(proj.period) ? <div className="pill">{formatResumePeriod(proj.period)}</div> : null}
                      </div>

                      {proj.tags?.length ? (
                        <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                          {proj.tags.map((t: string) => (
                            <div key={t} className="pill" onClick={(e) => e.stopPropagation()}>
                              {t}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {proj.description ? <div className="muted projectExcerpt">{proj.description}</div> : null}

                      {proj.links?.length ? (
                        <div className="row" style={{ marginTop: 10, gap: 8, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                          {proj.links
                            .filter((l: any) => l?.url)
                            .map((l: any) => (
                              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="pill" onClick={(e) => e.stopPropagation()}>
                                {l.label || l.url}
                              </a>
                            ))}
                        </div>
                      ) : null}

                    </div>
                  </div>
                );
              })}

              {isEmpty ? <div className="muted">No portfolio data yet.</div> : null}
            </div>
          </section>
        </div>
      </div>

      <Lightbox items={lbItems} index={lbIndex} onClose={() => setLbIndex(null)} onIndexChange={setLbIndex} />

      {openProject !== null && project && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="projectModalOverlay"
              role="dialog"
              aria-modal="true"
              aria-label={`Project details: ${project.title}`}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.target === e.currentTarget) setOpenProject(null);
              }}
            >
              <div className="projectModal" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                <div className="projectModalTop">
                  <div style={{ minWidth: 0 }}>
                    <div className="projectModalTitle">{project.title}</div>
                    <div className="muted" style={{ marginTop: 2 }}>
                      {[project.role, formatResumePeriod(project.period)].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <button type="button" className="btn iconBtn" aria-label="Close" title="Close" onClick={() => setOpenProject(null)}>
                    <IconX size={18} />
                  </button>
                </div>

                <div
                  className="projectModalBody mdx postProse"
                  ref={projectBodyRef}
                  onClick={(e) => {
                    const container = projectBodyRef.current;
                    if (!container) return;
                    const target = e.target;
                    if (!(target instanceof HTMLImageElement)) return;

                    const images = Array.from(container.querySelectorAll('img'))
                      .map((img) => img as HTMLImageElement)
                      .map((img) => ({
                        el: img,
                        src: img.currentSrc || img.src,
                        alt: img.alt || ''
                      }))
                      .filter((x) => Boolean(x.src));

                    const idx = images.findIndex((x) => x.el === target);
                    if (idx < 0) return;
                    e.preventDefault();
                    e.stopPropagation();
                    setLbItems(images.map(({ src, alt }) => ({ src, alt })));
                    setLbIndex(idx);
                  }}
                >
                  {Array.isArray(project.media) && project.media.length ? (
                    <div className="projectModalHero">
                      <button
                        type="button"
                        className="projectModalHeroBtn"
                        onClick={() => {
                          const items: LightboxItem[] = project.media.map((m: any) => ({
                            src: String(m.src),
                            alt: String(m.alt ?? project.title),
                            caption: m.caption || undefined
                          }));
                          setLbItems(items);
                          setLbIndex(0);
                        }}
                        aria-label="Open project media"
                        title="Open project media"
                      >
                        <ResolvedImage
                          src={String(project.media[0]!.src)}
                          alt={String(project.media[0]!.alt ?? project.title)}
                          className="projectModalHeroImg"
                          loading="lazy"
                        />
                      </button>
                    </div>
                  ) : null}

                  {project.tags?.length ? (
                    <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      {project.tags.map((t: string) => (
                        <div key={t} className="pill">
                          {t}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {project.doc ? (
                    <div style={{ marginTop: 12 }}>
                      <PostDocView doc={project.doc} />
                    </div>
                  ) : project.description ? (
                    <div className="muted" style={{ marginTop: 12, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                      {project.description}
                    </div>
                  ) : null}

                  {project.links?.length ? (
                    <div className="row" style={{ marginTop: 14, gap: 8, flexWrap: 'wrap' }}>
                      {project.links
                        .filter((l: any) => l?.url)
                        .map((l: any) => (
                          <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="pill">
                            {l.label || l.url}
                          </a>
                        ))}
                    </div>
                  ) : null}

                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}


