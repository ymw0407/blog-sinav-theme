const SESSION_KEY = '__blog_chunk_reload_once__';

function errorToMessage(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message || String(error);
  if (typeof error === 'object' && 'message' in (error as any)) return String((error as any).message || '');
  return String(error);
}

export function isDynamicImportFetchError(error: unknown): boolean {
  const message = errorToMessage(error);
  if (!message) return false;

  // Browser variations for missing/failed code-split chunks.
  const patterns = [
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'Loading chunk',
    'ChunkLoadError'
  ];

  return patterns.some((p) => message.includes(p));
}

export function reloadOnceForDynamicImportError(error: unknown): boolean {
  if (typeof window === 'undefined') return false;
  if (!isDynamicImportFetchError(error)) return false;

  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return false;
    window.sessionStorage.setItem(SESSION_KEY, String(Date.now()));
  } catch {
    // If sessionStorage is blocked, avoid reload loops.
    return false;
  }

  window.location.reload();
  return true;
}

