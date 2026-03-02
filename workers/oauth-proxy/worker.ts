// Minimal OAuth token exchange proxy.
//
// Why: GitHub's token endpoint does not allow browser CORS, so the SPA must call a server-side proxy.
//
// Route:
//   POST /github/oauth/access_token  (application/x-www-form-urlencoded)
//
// Optional:
//   If you set env.GITHUB_CLIENT_SECRET, it will be included in the token exchange request.
//
export interface Env {
  GITHUB_CLIENT_SECRET?: string;
  // Comma-separated list of allowed browser origins.
  // Example: "https://ymw0407.github.io,http://localhost:5173"
  ALLOWED_ORIGINS?: string;
  // Optional: comma-separated list of allowed client IDs.
  ALLOWED_CLIENT_IDS?: string;
}

function parseCsv(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(origin: string | null, allowedOrigins: string[]) {
  const o = origin || '';
  const allowed = o && allowedOrigins.includes(o);
  return {
    // If the request origin is allowed, echo it back. Otherwise omit CORS headers.
    ...(allowed ? { 'Access-Control-Allow-Origin': o, Vary: 'Origin' } : {}),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  } as Record<string, string>;
}

function json(status: number, body: unknown, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...cors
    }
  });
}

function text(status: number, body: string, cors: Record<string, string>) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...cors
    }
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin');
    const allowedOrigins = parseCsv(env.ALLOWED_ORIGINS);
    const cors = corsHeaders(origin, allowedOrigins);

    if (req.method === 'OPTIONS') {
      // Preflight: only reply with CORS headers when origin is allowed.
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    if (req.method !== 'POST') return text(405, 'Method Not Allowed', cors);

    if (url.pathname !== '/github/oauth/access_token') return text(404, 'Not Found', cors);

    // If configured, enforce same-origin allowlist.
    if (allowedOrigins.length > 0) {
      if (!origin || !allowedOrigins.includes(origin)) {
        return json(403, { error: 'forbidden', error_description: 'Origin not allowed.' }, cors);
      }
    }

    const ct = req.headers.get('content-type') || '';
    if (!ct.toLowerCase().includes('application/x-www-form-urlencoded')) {
      return json(400, { error: 'invalid_request', error_description: 'Expected form-urlencoded body.' }, cors);
    }

    const raw = await req.text();
    const params = new URLSearchParams(raw);

    const allowedClientIds = parseCsv(env.ALLOWED_CLIENT_IDS);
    if (allowedClientIds.length > 0) {
      const clientId = params.get('client_id') || '';
      if (!allowedClientIds.includes(clientId)) {
        return json(403, { error: 'forbidden', error_description: 'client_id not allowed.' }, cors);
      }
    }

    // Optional: if client_secret isn't required (PKCE), this can remain unset.
    if (env.GITHUB_CLIENT_SECRET && !params.get('client_secret')) {
      params.set('client_secret', env.GITHUB_CLIENT_SECRET);
    }

    // Ask GitHub for JSON to make parsing less error-prone.
    const ghReq = new Request('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: params.toString()
    });

    const ghRes = await fetch(ghReq);
    const ghText = await ghRes.text();
    return new Response(ghText, {
      status: ghRes.status,
      headers: {
        'Content-Type': ghRes.headers.get('content-type') || 'text/plain; charset=utf-8',
        ...cors
      }
    });
  }
};
