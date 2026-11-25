import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: {
  order: {type:'string'}, capture: {type:'string'}, 'amount-agorot': {type:'string'},
  currency: {type:'string'}, kind: {type:'string'}, reference: {type:'string'},
  apply: {type:'boolean'}, 'confirm-order': {type:'string'},
}});
const { order, capture, currency, kind, reference, apply } = values;
const amount = values['amount-agorot'];
const identifier = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/;
if (!order || !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(order)
  || !capture || !identifier.test(capture) || !reference || reference.length<2 || !identifier.test(reference)
  || !amount || !/^[1-9][0-9]{0,8}$/.test(amount) || currency!=='ILS'
  || !['full_refund','lost_chargeback'].includes(kind)) {
  throw new Error('Required: --order UUID --capture ORIGINAL_TX --amount-agorot 149900 --currency ILS --kind full_refund|lost_chargeback --reference PROVIDER_CASE_ID');
}
if (apply && values['confirm-order']!==order) throw new Error('To apply, repeat the order ID using --confirm-order.');
const temp=mkdtempSync(join(tmpdir(),'clinicflow-reversal-'));
try {
  const path=join(temp,'review.sql');
  // Every string parameter was restricted to a quote-free identifier above.
  writeFileSync(path,`select public.support_reconcile_grow_reversal('${order}','${capture}',${amount},'${currency}','${kind}','${reference}',${Boolean(apply)}) as outcome`,{mode:0o600});
  const response=execFileSync('supabase',['db','query','--linked','--file',path,'--output','json'],{
    cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8',stdio:['ignore','pipe','inherit'],
  });
  const outcome=JSON.parse(response).rows[0].outcome;
  console.log(JSON.stringify(outcome,null,2));
  if (!['READY','RECORDED','ALREADY_RECORDED'].includes(outcome.result)) process.exitCode=2;
} finally {
  rmSync(temp,{recursive:true,force:true});
}
