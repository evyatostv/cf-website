const shekels = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPurchaseAmount(agorot: number | null | undefined): string {
  return typeof agorot === 'number' && Number.isSafeInteger(agorot)
    ? shekels.format(agorot / 100)
    : '—';
}
