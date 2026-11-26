// Grow's getTransactionInfo read is scoped by the merchant's own pageCode.
export async function linkDigest(id: unknown, token: unknown): Promise<string | null> {
  if (!['number','string'].includes(typeof id) || !/^[1-9]\d{0,19}$/.test(String(id))
    || typeof token !== 'string' || !/^[a-zA-Z0-9]{12,128}$/.test(token)) return null;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${id}:${token}`));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2,'0')).join('');
}

type Readback = {kind:'direct'; pageCode:string} | {kind:'make'; url:string; key:string};

export function growReadbackConfig(): Readback | null {
  const raw = Deno.env.get('MAKE_GROW_READBACK_URL')?.trim();
  const key = Deno.env.get('MAKE_GROW_READBACK_KEY')?.trim();
  if (raw || key) {
    const url = URL.parse(raw || '');
    if (!key || key === Deno.env.get('MAKE_CALLBACK_SECRET')?.trim() || !url || url.protocol !== 'https:' ||
        !/^hook(?:\.[a-z0-9-]+)?\.make\.com$/.test(url.hostname) || url.port || url.username || url.password ||
        !/^\/[A-Za-z0-9_-]+$/.test(url.pathname) || url.hash || url.search) return null;
    for (const name of ['MAKE_PAYMENT_WEBHOOK_URL','MAKE_GROW_NOTIFY_URL']) {
      const other = URL.parse(Deno.env.get(name) || '');
      if (other?.origin === url.origin && other.pathname.replace(/\/+$/,'') === url.pathname) return null;
    }
    return {kind:'make',url:url.href,key};
  }
  const pageCode = Deno.env.get('GROW_READBACK_PAGE_CODE')?.trim();
  return pageCode ? {kind:'direct',pageCode} : null;
}

export async function verifyGrowPayment(binding: string, transactionId: string, token: unknown,
  config: Readback, orderId: string, amount: number, currency: string, linkId: unknown, linkToken: unknown): Promise<boolean> {
  if (!binding || !/^[1-9]\d{0,19}$/.test(transactionId) || currency !== 'ILS') return false;
  let tx;
  if (config.kind === 'make') {
    if (await linkDigest(linkId,linkToken) !== binding) return false;
    const response = await fetch(config.url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),
      headers:{'Content-Type':'application/json','x-make-apikey':config.key},
      body:JSON.stringify({paymentLinkProcessId:linkId,paymentLinkProcessToken:linkToken,transactionId})});
    if (!response.ok) throw Error('Grow lookup unavailable');
    tx = await response.json();
  } else {
    if (typeof token !== 'string' || !/^[a-zA-Z0-9]{12,128}$/.test(token)) return false;
    const body = new FormData();
    body.set('pageCode', config.pageCode);
    body.set('transactionId', transactionId);
    body.set('transactionToken', token);
    const response = await fetch('https://secure.meshulam.co.il/api/light/server/1.0/getTransactionInfo',
      {method:'POST', body, redirect:'error', signal:AbortSignal.timeout(10000)});
    if (!response.ok) throw Error('Grow lookup unavailable');
    const result = await response.json();
    tx = result?.data;
    if (String(result?.status) !== '1' || !tx || tx.transactionToken !== token) return false;
  }
  if (!tx || String(tx.transactionId) !== transactionId || String(tx.statusCode) !== '2' || tx.status !== 'שולם' ||
      await linkDigest(tx.paymentLinkProcessId,tx.paymentLinkProcessToken) !== binding) return false;
  // Grow supports only ILS. Refuse any explicit contradictory currency.
  if (tx.currency != null && tx.currency !== 'ILS') return false;
  const customOrder = tx.customFields?.cField1 ?? tx.customField?.cField1;
  if (customOrder != null && customOrder !== orderId) return false;
  const sum = /^(0|[1-9]\d{0,6})(?:\.(\d{1,2}))?$/.exec(String(tx.sum));
  return !!sum && Number(sum[1])*100 + Number((sum[2] || '').padEnd(2,'0')) === amount;
}
