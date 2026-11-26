// Release selection is controlled on the server. Only a pinned, private, uploaded
// Apple Silicon DMG can issue a provider download link.
const repo = 'https://api.github.com/repos/evyatostv/ClinicFlow';

export async function githubMacInstaller(
  os: string, env = (name: string) => Deno.env.get(name), request = fetch,
): Promise<{downloadUrl: string; expiresAt: string} | null> {
  const id = env('MAC_INSTALLER_GITHUB_ASSET_ID');
  const digest = env('MAC_INSTALLER_SHA256');
  if (os !== 'mac' || (!id && !digest)) return null;
  const token = env('INSTALLER_GITHUB_READ_TOKEN');
  if (!id || !/^[1-9]\d{0,19}$/.test(id) || !digest || !/^[a-f0-9]{64}$/.test(digest) || !token) {
    throw new Error('Missing installer configuration');
  }
  const api = (url: string, accept: string) => request(url, {
    headers: {Authorization: 'Bearer ' + token, Accept: accept, 'User-Agent': 'ClinicFlow-installer'},
    redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(8000),
  });
  const asset = repo + '/releases/assets/' + id;
  const [visibility, metadata] = await Promise.all([
    api(repo, 'application/vnd.github+json'), api(asset, 'application/vnd.github+json'),
  ]);
  if (!visibility.ok || !metadata.ok || (await visibility.json()).private !== true) {
    throw new Error('Private installer unavailable');
  }
  const info = await metadata.json();
  if (String(info.id) !== id || info.digest !== 'sha256:' + digest || info.state !== 'uploaded' ||
      !(info.size > 0) || !/^Clinic[ .-]Flow-\d+\.\d+\.\d+-arm64\.dmg$/i.test(info.name)) {
    throw new Error('Installer identity mismatch');
  }
  const binary = await api(asset + '?t=' + Date.now(), 'application/octet-stream');
  const target = binary.headers.get('location');
  if (binary.status !== 302 || !target) throw new Error('Temporary link unavailable');
  const url = new URL(target);
  const expiry = Date.parse(url.searchParams.get('se') || '');
  if (url.origin !== 'https://release-assets.githubusercontent.com' || url.username || url.password ||
      !url.searchParams.get('sig') || !Number.isFinite(expiry) || expiry < Date.now() + 60000) {
    throw new Error('Invalid temporary link');
  }
  // Exercise the same object a purchaser will download. Never forward credentials
  // across origins. Cancel immediately if a provider ignores the range request.
  const probe = await request(url, {headers: {Range: 'bytes=0-0'}, redirect: 'manual', signal: AbortSignal.timeout(8000)});
  await probe.body?.cancel();
  if (probe.status !== 206 || probe.headers.get('content-range') !== 'bytes 0-0/' + info.size) {
    throw new Error('Installer bytes unavailable');
  }
  return {downloadUrl: url.href, expiresAt: new Date(expiry).toISOString()};
}
