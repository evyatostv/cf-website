# Delivery retry timer

The database wakes both delivery workers every ten minutes. Existing immediate events and GitHub Actions can also wake them. Each worker claims durable jobs under a lease and uses its existing stable provider idempotency key. A timer run can wake each worker only once per slot. Each invocation receives a fresh random proof valid for three minutes. Only its digest persists in the application table. The HTTPS transport queue temporarily holds the single-use proof. The existing worker secret stays in Edge environment settings. Its normal rotation must also update the GitHub fallback secret.

As database operator, install pg_cron on a supported project and apply the timer migration. Deploy retry-deliveries with gateway JWT verification disabled. Confirm that contact_wake_config targets this same project. Schedule the read-only check first.

```sql
create extension if not exists pg_cron;
select cron.schedule('clinicflow-delivery-retry','4,14,24,34,44,54 * * * *','select public.enqueue_delivery_retry(true)');
```

Wait for an actual scheduled invocation. This aggregate query inspects responses for the last hour; it never reads contact records, requests or proofs.

```sql
select count(*) as requested, count(r.redeemed_at) as redeemed,
  count(*) filter(where h.status_code=200) as both_workers_ok,
  count(*) filter(where h.status_code>=400 or h.timed_out) as errors
from public.delivery_retry_runs r left join net._http_response h on h.id=r.request_id
where r.slot >= now()-interval '1 hour';
```

A missing response after three minutes needs investigation. The HTTP queue runs after commit. HTTP response history defaults to six hours. The application retains slot and redemption metadata for seven days. To enable delivery after a successful scheduled dry run, reschedule the same name with the fixed command `select public.enqueue_delivery_retry(false)`. To stop this timer, run `select cron.unschedule('clinicflow-delivery-retry')`. Existing per-channel delivery records retain their retry state when the timer stops.

[Supabase Cron](https://supabase.com/docs/guides/cron) · [Postgres asynchronous networking](https://supabase.com/docs/guides/database/extensions/pg_net) · [GitHub scheduled events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
