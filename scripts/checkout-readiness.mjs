import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const project = 'dmuwxydmuylcbhcoagri';
function read(args) {
  const result = spawnSync('supabase', [...args, '--output', 'json'], {cwd:root, encoding:'utf8', timeout:45000});
  if (result.status !== 0) throw Error(`Supabase ${args[0]} metadata check failed. Verify CLI login and linked project.`);
  return JSON.parse(result.stdout);
}
try {
  const platforms = process.argv.slice(2);
  if (!platforms.length || platforms.some(os => !['win','mac','linux'].includes(os))) {
    throw Error('Usage: node scripts/checkout-readiness.mjs win [mac] [linux]');
  }
  if (readFileSync(new URL('../supabase/.temp/project-ref',import.meta.url),'utf8').trim() !== project) {
    throw Error('Link this checkout to the ClinicFlow production project first.');
  }
  const names = new Set(read(['secrets','list','--project-ref',project]).map(secret => secret.name));
  const functions = read(['functions','list','--project-ref',project]);
  const handlers = ['create-grow-payment','grow-webhook','download-installer'].map(name => {
    const fn = functions.find(item => item.slug === name);
    return {name, active:fn?.status === 'ACTIVE', version:fn?.version ?? null,
      gatewayMatches:fn?.verify_jwt === (name === 'download-installer')};
  });
  const sql = `
    select exists(select 1 from storage.buckets where id='installers' and not public) as private_bucket,
      (select jsonb_object_agg(os,exists(select 1 from storage.objects o where o.bucket_id='installers'
        and o.name=filename and (o.metadata->>'size')::numeric>0))
        from (values ('win','ClinicFlow-Setup.exe'),('mac','ClinicFlow-Setup.dmg'),
          ('linux','ClinicFlow-Setup.AppImage')) platforms(os,filename)) as files,
      (select jsonb_object_agg(signature,coalesce(has_function_privilege('service_role',
          to_regprocedure(signature),'execute'),false))
       from unnest(array['public.open_grow_order(uuid,text,integer)','public.open_additional_grow_order(uuid,integer)',
         'public.fulfill_grow_order(uuid,text,text,integer,text,jsonb,text)','public.record_grow_refund(uuid,text,integer,text)',
         'public.has_verified_desktop_purchase(uuid,text)']) signature) as service_routines`;
  const [db] = read(['db','query','--linked',sql]).rows;
  const secrets = Object.fromEntries(['MAKE_PAYMENT_WEBHOOK_URL','MAKE_GROW_NOTIFY_URL','MAKE_CALLBACK_SECRET'].map(key => [key,names.has(key)]));
  const defaultBucket = !names.has('INSTALLERS_BUCKET');
  const defaultProvider = !names.has('PAYMENT_PROVIDER');
  const makeReadbackSelected = names.has('MAKE_GROW_READBACK_URL') || names.has('MAKE_GROW_READBACK_KEY');
  const merchantReadbackConfigured = makeReadbackSelected ? names.has('MAKE_GROW_READBACK_URL') && names.has('MAKE_GROW_READBACK_KEY') : names.has('GROW_READBACK_PAGE_CODE');
  const prerequisites = merchantReadbackConfigured && defaultBucket && defaultProvider && db.private_bucket && Object.values(secrets).every(Boolean)
    && handlers.every(fn => fn.active && fn.gatewayMatches) && Object.values(db.service_routines).every(Boolean);
  const perPlatform = Object.fromEntries(Object.entries(db.files).map(([os,exists]) => [os,Boolean(prerequisites && exists)]));
  console.log(JSON.stringify({ secretsPresent:secrets,merchantReadbackConfigured,handlers,serviceRoutines:db.service_routines,
    usesDefaultGrowProvider:defaultProvider,usesDefaultInstallerBucket:defaultBucket,
    defaultBucketPrivate:db.private_bucket,nonemptyDefaultBucketInstallers:db.files,
    staticPrerequisitesMet:perPlatform,providerCaptureVerified:false },null,2));
  if (!platforms.every(os => perPlatform[os])) process.exitCode = 2;
} catch (err) {
  console.error(err.code === 'ENOENT' ? 'Link the project and install the Supabase CLI before checking.' : err.message);
  process.exitCode = 1;
}
