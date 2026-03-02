function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function coerceIsoDatetime(input: string | null | undefined) {
  const raw = String(input ?? '').trim();
  if (!raw) return new Date().toISOString();
  // Accept YYYY-MM-DD as legacy "date" and normalize to ISO (UTC midnight)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T00:00:00.000Z`;
  // If it's already ISO-ish, keep it.
  if (raw.includes('T')) return raw;
  return raw;
}

export function formatDateTime(input: string | null | undefined) {
  const iso = coerceIsoDatetime(input);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(input ?? '');
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function isoToDatetimeLocalValue(input: string | null | undefined) {
  const d = new Date(coerceIsoDatetime(input));
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}

export function datetimeLocalValueToIso(value: string) {
  const raw = String(value ?? '').trim();
  if (!raw) return new Date().toISOString();
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

