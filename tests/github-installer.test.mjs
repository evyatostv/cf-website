import test from 'node:test';
import assert from 'node:assert/strict';
import {githubMacInstaller} from '../supabase/functions/_shared/github-installer.ts';

const digest = 'a'.repeat(64);
const config = {MAC_INSTALLER_GITHUB_ASSET_ID:'12', MAC_INSTALLER_SHA256:digest, INSTALLER_GITHUB_READ_TOKEN:'test-only'};
for (const scenario of ['valid', 'public', 'digest', 'prerelease', 'redirect', 'expired', 'truncated', 'wrong-host']) {
  test('private Mac installer / ' + scenario, async () => {
    const env = k => config[k];
    const target = new URL('https://release-assets.githubusercontent.com/synthetic');
    target.searchParams.set('se', new Date(Date.now() + (scenario === 'expired' ? -60000 : 3600000)).toISOString());
    target.searchParams.set('sig','synthetic-signature');
    if (scenario === 'wrong-host') target.hostname='example.test';
    const request = async (input, options) => {
      const url = new URL(input);
      if (url.hostname === 'release-assets.githubusercontent.com') {
        assert.deepEqual(options.headers,{Range:'bytes=0-0'});
        return new Response('x',{status:206,headers:{'content-range':'bytes 0-0/' + (scenario==='truncated'?3:4)}});
      }
      assert.equal(url.hostname,'api.github.com');
      assert.equal(options.redirect,'manual');
      assert.equal(options.headers.Authorization,'Bearer test-only');
      if (url.pathname.endsWith('/ClinicFlow')) return Response.json({private:scenario!=='public'});
      if (options.headers.Accept === 'application/octet-stream') return new Response(null,{status:scenario==='redirect'?404:302,headers:{location:target.href}});
      return Response.json({id:12,size:4,state:'uploaded',digest:'sha256:'+(scenario==='digest'?'b'.repeat(64):digest),name: 'Clinic.Flow-0.9.25'+(scenario==='prerelease'?'-beta.4':'')+'-arm64.dmg'});
    };
    if (scenario==='valid') assert.equal((await githubMacInstaller('mac',env,request)).downloadUrl, target.href);
    else await assert.rejects(githubMacInstaller('mac',env,request));
  });
}
test('unset provider keeps storage; half-configured Mac fails closed', async () => {
  assert.equal(await githubMacInstaller('mac',()=>undefined),null);
  assert.equal(await githubMacInstaller('win',k=>config[k]),null);
  await assert.rejects(githubMacInstaller('mac',k=>k==='MAC_INSTALLER_SHA256'?digest:undefined));
});
