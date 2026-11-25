export type OrderStatus = 'loading' | 'pending' | 'paid' | 'failed' | 'review' | 'reversed' | 'unavailable' | 'connection';

export function watchOrderStatus(
  read: () => PromiseLike<{ data: { status: string } | null; error: unknown }>,
  show: (status: OrderStatus) => void,
) {
  let stopped = false;
  let timer: number | undefined;
  let delay = 4000;
  async function check() {
    if (stopped || document.hidden) return;
    let status: OrderStatus = 'connection';
    if (navigator.onLine) {
      try {
        const { data, error } = await read();
        if (!error) {
          switch (data?.status) {
            case 'PAID': status = 'paid'; break;
            case 'FAILED': case 'CANCELLED': status = 'failed'; break;
            case 'MANUAL_REVIEW': status = 'review'; break;
            case 'REFUNDED': case 'CHARGED_BACK': status = 'reversed'; break;
            case 'PENDING': status = 'pending'; break;
            default: status = 'unavailable';
          }
        }
      } catch { /* An interrupted request is retried when connectivity returns. */ }
    }
    if (stopped) return;
    show(status);
    if ((status === 'connection' || status === 'pending') && navigator.onLine && !document.hidden) {
      timer = window.setTimeout(check, delay);
      delay = Math.min(delay * 2, 30000);
    }
  }
  void check();
  return () => {
    stopped = true;
    window.clearTimeout(timer);
  };
}
