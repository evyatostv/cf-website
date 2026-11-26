// Grow's getTransactionInfo read is scoped by the merchant's own pageCode.
export async function linkDigest(id: unknown, token: unknown): Promise<string | null> {
  if (!['number','string'].includes(typeof id) || !/^[1-9]\d{0,19}$/.test(String(id))
    || typeof token !== 'string' || !/^[a-zA-Z0-9]{12,128}$/.test(token)) return null;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${id}:${token}`));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2,'0')).join('');
}

export async function verifyGrowPayment(binding: string, transactionId: string, token: unknown,
  pageCode: string, orderId: string, amount: number, currency: string): Promise<boolean> {
  if (!binding || !/^[1-9]\d{0,19}$/.test(transactionId) || typeof token !== 'string' ||
      !/^[a-zA-Z0-9]{12,128}$/.test(token) || currency !== 'ILS') return false;
  const body = new FormData();
  body.set('pageCode', pageCode);
  body.set('transactionId', transactionId);
  body.set('transactionToken', token);
  const response = await fetch('https://secure.meshulam.co.il/api/light/server/1.0/getTransactionInfo',
    {method:'POST', body, redirect:'error', signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw Error('Grow lookup unavailable');
  const result = await response.json();
  const tx = result?.data;
  if (String(result?.status) !== '1' || !tx || String(tx.transactionId) !== transactionId ||
      tx.transactionToken !== token || String(tx.statusCode) !== '2' || tx.status !== 'שולם' ||
      await linkDigest(tx.paymentLinkProcessId,tx.paymentLinkProcessToken) !== binding) return false;
  // Grow supports only ILS. Refuse any explicit contradictory currency.
  if (tx.currency != null && tx.currency !== 'ILS') return false;
  const customOrder = tx.customFields?.cField1 ?? tx.customField?.cField1;
  if (customOrder != null && customOrder !== orderId) return false;
  const sum = /^(0|[1-9]\d{0,6})(?:\.(\d{1,2}))?$/.exec(String(tx.sum));
  return !!sum && Number(sum[1])*100 + Number((sum[2] || '').padEnd(2,'0')) === amount;
}
