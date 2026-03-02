export type ResumePeriod = { from: string; to?: string };

export function formatResumePeriod(p: ResumePeriod | null | undefined) {
  if (!p?.from && !p?.to) return '';
  if (p.from && p.to) return `${p.from} ~ ${p.to}`;
  return p.from || p.to || '';
}

export function normalizeResumePeriod(raw: unknown): ResumePeriod | undefined {
  // Accept new shape: {from,to}
  if (raw && typeof raw === 'object') {
    const r = raw as any;
    const from = typeof r.from === 'string' ? r.from : '';
    const to = typeof r.to === 'string' ? r.to : '';
    if (from || to) return { from, ...(to ? { to } : {}) };
    return undefined;
  }

  // Back-compat: string like "YYYY-MM-DD - YYYY-MM-DD" or single date.
  if (typeof raw === 'string') {
    const matches = raw.match(/\d{4}-\d{2}-\d{2}/g) ?? [];
    const from = matches[0] ?? '';
    const to = matches[1] ?? '';
    if (from || to) return { from, ...(to ? { to } : {}) };
  }
  return undefined;
}

