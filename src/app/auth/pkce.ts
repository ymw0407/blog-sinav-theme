function base64UrlEncode(bytes: ArrayBuffer) {
  const chars = Array.from(new Uint8Array(bytes))
    .map((b) => String.fromCharCode(b))
    .join('');
  const b64 = btoa(chars);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function randomString(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes.buffer);
}

export async function pkceChallengeFromVerifier(verifier: string) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

