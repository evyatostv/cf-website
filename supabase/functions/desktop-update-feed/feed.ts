const ttlMs = 30 * 60 * 1000;
const deviceToken = /^[0-9a-f]{64}$/;
const keygenProduct = 'baa66a06-ff90-47c3-a1d3-97f5aa8b1575';
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

type Platform = 'darwin' | 'win32';
type Session = { token: string; platform: Platform; expires: number };
type Dependency = {
  env: (name: string) => string | undefined;
  request: typeof fetch;
  now: () => number;
};

function reply(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers });
}

function decodeUrl(value: string) {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}

function encodeUrl(value: Uint8Array) {
  return btoa(String.fromCharCode(...value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function allowedFile(platform: Platform, name: string) {
  if (platform === 'darwin') {
    return name === 'stable-mac.yml' || /^Clinic[ .-]Flow-\d+\.\d+\.\d+-arm64-mac\.zip(?:\.blockmap)?$/.test(name);
  }
  return name === 'stable.yml' || /^Clinic-Flow-Setup-\d+\.\d+\.\d+\.exe(?:\.blockmap)?$/.test(name);
}

function downloadLocation(raw: string | null) {
  if (!raw) return null;
  const url = new URL(raw);
  const provider = url.hostname.endsWith('.amazonaws.com') || url.hostname.endsWith('.r2.cloudflarestorage.com');
  if (!provider || url.protocol !== 'https:' || url.username || url.password || url.port ||
      !url.searchParams.has('X-Amz-Signature')) return null;
  return url.href;
}

export function createUpdateFeed({ env, request, now }: Dependency) {
  let sealingKey: Promise<CryptoKey> | undefined;
  function key() {
    const secret = env('DESKTOP_UPDATE_SIGNING_KEY');
    if (!secret || !/^[a-f0-9]{64}$/.test(secret)) throw new Error('Session key missing');
    sealingKey ??= crypto.subtle.importKey('raw', Uint8Array.from(secret.match(/../g)!, b => parseInt(b, 16)),
      'AES-GCM', false, ['encrypt', 'decrypt']);
    return sealingKey;
  }

  async function seal(session: Session) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(), encoder.encode(JSON.stringify(session)));
    return encodeUrl(new Uint8Array([...iv, ...new Uint8Array(ciphertext)]));
  }

  async function unseal(value: string): Promise<Session | null> {
    if (!/^[A-Za-z0-9_-]{120,320}$/.test(value)) return null;
    const activeKey = await key();
    try {
      const bytes = decodeUrl(value);
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(0, 12) }, activeKey, bytes.subarray(12));
      const session = JSON.parse(decoder.decode(plain)) as Session;
      if (!deviceToken.test(session.token) || !['darwin', 'win32'].includes(session.platform) ||
          !Number.isSafeInteger(session.expires) || session.expires <= now()) return null;
      return session;
    } catch { return null; }
  }

  async function active(token: string) {
    const anon = env('SUPABASE_ANON_KEY')!;
    const result = await request(env('SUPABASE_URL') + '/rest/v1/rpc/check_paid_device', {
      method: 'POST', headers: { apikey: anon, Authorization: 'Bearer ' + anon, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_token: token }), redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    if (!result.ok) throw new Error('Device check unavailable');
    return (await result.json()) === true;
  }

  return async (req: Request): Promise<Response> => {
    try {
      const path = new URL(req.url).pathname.split('/desktop-update-feed/').pop() || '';
      if (path === 'session') {
        if (req.method !== 'POST') return reply(405, { error: 'method_not_allowed' });
        const auth = /^Bearer ([0-9a-f]{64})$/i.exec(req.headers.get('Authorization') || '');
        if (!auth || !deviceToken.test(auth[1])) return reply(401, { error: 'device_credential_required' });
        const data = await req.json().catch(() => null);
        if (!(data?.platform === 'darwin' && data?.arch === 'arm64') && !(data?.platform === 'win32' && data?.arch === 'x64')) {
          return reply(400, { error: 'unsupported_platform' });
        }
        if (!await active(auth[1])) return reply(403, { error: 'paid_device_required' });
        const expires = now() + ttlMs;
        const id = await seal({ token: auth[1], platform: data.platform, expires });
        const base = new URL(env('SUPABASE_URL')!).origin;
        return reply(200, { feedUrl: base + '/functions/v1/desktop-update-feed/channel/' + id + '/', expiresAt: new Date(expires).toISOString() });
      }
      if (!['GET', 'HEAD'].includes(req.method)) return reply(405, { error: 'method_not_allowed' });
      const parts = path.split('/');
      if (parts.length !== 3 || parts[0] !== 'channel') return reply(404, { error: 'not_found' });
      const session = await unseal(parts[1]);
      if (!session) return reply(403, { error: 'session_invalid' });
      let name: string;
      try { name = decodeURIComponent(parts[2]); } catch { return reply(400, { error: 'invalid_name' }); }
      if (!allowedFile(session.platform, name)) return reply(404, { error: 'not_found' });
      if (!await active(session.token)) return reply(403, { error: 'paid_device_required' });

      const token = env('DESKTOP_UPDATE_KEYGEN_TOKEN') || env('KEYGEN_TOKEN');
      if (!token || !env('KEYGEN_ACCOUNT_ID')) throw new Error('Release service unavailable');
      const artifact = new URL('https://api.keygen.sh/v1/accounts/' + encodeURIComponent(env('KEYGEN_ACCOUNT_ID')!) + '/artifacts/' + encodeURIComponent(name));
      artifact.searchParams.set('product', keygenProduct);
      artifact.searchParams.set('channel', 'stable');
      const result = await request(artifact, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.api+json' },
        redirect: 'manual', signal: AbortSignal.timeout(10000) });
      await result.body?.cancel();
      if (result.status === 404 || result.status === 200) return reply(404, { error: 'release_unavailable' });
      const location = result.status === 303 && downloadLocation(result.headers.get('location'));
      if (!location) throw new Error('Release download unavailable');
      // The signed storage URL allows range requests without transmitting a device or Keygen credential.
      return new Response(null, { status: 307, headers: { ...headers, Location: location } });
    } catch {
      console.error('desktop-update-feed: dependency unavailable');
      return reply(503, { error: 'update_service_unavailable' });
    }
  };
}
