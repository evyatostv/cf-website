import { createUpdateFeed } from './feed.ts';

function assert(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

Deno.test('entitlement covers session, manifest, artifact, expiry, revocation and platform', async () => {
  const device = 'a'.repeat(64);
  const env: Record<string, string> = {
    SUPABASE_URL: 'https://test.supabase.co', SUPABASE_ANON_KEY: 'anon',
    DESKTOP_UPDATE_SIGNING_KEY: '04'.repeat(32), KEYGEN_ACCOUNT_ID: 'acc', DESKTOP_UPDATE_KEYGEN_TOKEN: 'keygen-secret',
  };
  let current = 100;
  let paid = true;
  let enabled = true;
  let lookups = 0;
  const product = 'baa66a06-ff90-47c3-a1d3-97f5aa8b1575';
  function entry(last: number, version: string, status = 'PUBLISHED') {
    return { id: 'e958c955-508f-4634-ac3c-897d83c11f0' + last, attributes: { version, status, channel: 'stable' },
      relationships: { product: { data: { id: product } } } };
  }
  const baseline = entry(1, '0.9.26');
  let releases = [entry(2, '0.9.3'), entry(3, '0.11.0-beta.1'), entry(4, '0.10.0', 'DRAFT'), baseline];

  const request: typeof fetch = async (input, init) => {
    if (String(input).endsWith('/rpc/check_paid_device')) {
      const ok = JSON.parse(String(init?.body)).p_token === device;
      return enabled ? Response.json(paid && ok) : new Response(null, { status: 500 });
    }
    const url = new URL(String(input));
    assert(url.host === 'api.keygen.sh', 'fixed release provider');
    assert(new Headers(init?.headers).get('authorization') === 'Bearer keygen-secret', 'server-only upstream credential');
    if (url.pathname.endsWith('/releases')) {
      assert(url.searchParams.get('channel') === 'stable' && url.searchParams.get('status') === 'PUBLISHED', 'published filter');
      return Response.json({ data: releases });
    }
    if (url.pathname.endsWith('/' + baseline.id)) return Response.json({ data: baseline });
    assert(url.pathname.includes('/releases/' + baseline.id + '/artifacts/'), 'latest stable release pinned across requests');
    assert(init?.redirect === 'manual', 'never forward credentials');
    lookups++;
    return new Response(null, { status: 303, headers: { Location: 'https://bucket.s3.amazonaws.com/file?X-Amz-Signature=x' } });
  };
  const handle = createUpdateFeed({ env: n => env[n], request, now: () => current });
  const sessionUrl = 'https://test.supabase.co/functions/v1/desktop-update-feed/session';
  function start(token: string, platform = 'darwin', arch = 'arm64') {
    return handle(new Request(sessionUrl, { method: 'POST', headers: { Authorization: 'Bearer ' + token },
      body: JSON.stringify({ platform, arch }) }));
  }
  assert((await start('invalid')).status === 401, 'missing device denied');
  assert((await start('b'.repeat(64))).status === 403, 'unpaid denied');
  assert((await start(device, 'darwin', 'x64')).status === 400, 'unsupported architecture');
  for (const [platform, arch, manifest, file] of [
    ['darwin', 'arm64', 'stable-mac.yml', 'Clinic Flow-0.9.26-arm64-mac.zip'],
    ['win32', 'x64', 'stable.yml', 'Clinic-Flow-Setup-0.9.26.exe'],
  ]) {
    const out = await start(device, platform, arch);
    assert(out.status === 200, 'paid session');
    const { feedUrl } = await out.json();
    assert(!feedUrl.includes(device), 'device credential stays private');
    for (const name of [manifest, file]) {
      const r = await handle(new Request(feedUrl + encodeURIComponent(name)));
      assert(r.status === 307 && !r.headers.get('location')?.includes('keygen-secret'), 'temporary storage link');
    }
    const before = lookups;
    assert((await handle(new Request(feedUrl + 'private.db'))).status === 404, 'arbitrary file denied');
    baseline.attributes.status = 'YANKED';
    assert((await handle(new Request(feedUrl + file))).status === 404, 'pinned release yank immediately blocks bytes');
    baseline.attributes.status = 'PUBLISHED';
    paid = false;
    assert((await handle(new Request(feedUrl + manifest))).status === 403, 'revoked device');
    paid = true;
    current += 1800001;
    assert((await handle(new Request(feedUrl + manifest))).status === 403, 'expired session');
    assert(lookups === before, 'denials never call provider');
  }
  releases = [entry(5, '0.9.30', 'DRAFT')];
  assert((await start(device)).status === 404, 'draft-only catalog issues no feed');
  enabled = false;
  assert((await start(device)).status === 503, 'entitlement outage fails closed');
});
