export interface SeatQuote {
  quantity: number;
  amount: number;
  currency: 'ILS';
  paidSeats: number;
  targetSeat: number;
}

export function formatSeatPrice(amount: number) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 }).format(amount / 100);
}

export function parseQuote(data: unknown, quantity: number): SeatQuote | null {
  if (!data || typeof data !== 'object') return null;
  const row = data as Record<string, unknown>;
  // Older single-seat quotes omit quantity. An explicit bulk quantity must always match.
  const count = row.quantity ?? 1;
  if (count !== quantity) return null;
  const { amount, currency, paidSeats, targetSeat } = row;
  if (currency !== 'ILS' || typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount <= 0 ||
      typeof paidSeats !== 'number' || !Number.isSafeInteger(paidSeats) || paidSeats < 0 ||
      typeof targetSeat !== 'number' || targetSeat !== paidSeats + 1) return null;
  return { amount, currency, paidSeats, targetSeat, quantity };
}

export function matchesQuotedOrder(quote: SeatQuote, order: { amount?: number; currency?: string; quantity?: number }) {
  return order.amount === quote.amount && order.currency === quote.currency && (order.quantity ?? 1) === quote.quantity;
}
