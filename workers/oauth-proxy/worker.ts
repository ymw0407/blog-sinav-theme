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
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Allow the SPA to call this from GitHub Pages origin.
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store'
    }
  });
}

function text(status: number, body: string) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store'
    }
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    if (req.method !== 'POST') return text(405, 'Method Not Allowed');

    if (url.pathname !== '/github/oauth/access_token') return text(404, 'Not Found');

    const ct = req.headers.get('content-type') || '';
    if (!ct.toLowerCase().includes('application/x-www-form-urlencoded')) {
      return json(400, { error: 'invalid_request', error_description: 'Expected form-urlencoded body.' });
    }

    const raw = await req.text();
    const params = new URLSearchParams(raw);

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
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store'
      }
    });
  }
};

