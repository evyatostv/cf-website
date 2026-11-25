/** Server-only checkout selection. Historical provider callbacks remain enabled. */
export function paymentProvider(): string {
  return (Deno.env.get('PAYMENT_PROVIDER') || 'grow').trim().toLowerCase();
}

export function inactivePaymentProvider(provider: string, cors: Record<string, string>): Response | null {
  if (paymentProvider() === provider) return null;
  return new Response(JSON.stringify({
    error: 'עמוד התשלום השתנה. אפשר להמשיך לרכישה דרך עמוד התמחור.',
    code: 'PAYMENT_PROVIDER_INACTIVE',
    checkoutPath: '/pricing',
  }), { status: 410, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
