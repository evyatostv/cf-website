/** Server-only checkout selection. Historical provider callbacks remain enabled. */
export function paymentProvider(): string {
  return (Deno.env.get('PAYMENT_PROVIDER') || 'grow').trim().toLowerCase();
}

export function inactivePaymentProvider(provider: string, cors: Record<string, string>): Response | null {
  const active = paymentProvider();
  if (active === provider) return null;
  if (active === 'disabled') {
    return new Response(JSON.stringify({
      error: 'הרכישה אינה זמינה כרגע. לרוכשים קיימים אפשר להיכנס לאזור האישי להורדת התוכנה.',
      code: 'CHECKOUT_PAUSED',
    }), { status: 503, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
  return new Response(JSON.stringify({
    error: 'עמוד התשלום השתנה. אפשר להמשיך לרכישה דרך עמוד התמחור.',
    code: 'PAYMENT_PROVIDER_INACTIVE',
    checkoutPath: '/pricing',
  }), { status: 410, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
