# Website inquiry delivery

Saving a contact form commits the inquiry and its delivery jobs together. The browser returns success once that transaction succeeds. Each saved row has its own UUID. Distinct form submissions intentionally create separate inquiries. The migration queues newly inserted rows only.

## Email

Apply the migration first. Deploy `notify-contact` with its existing gateway setting (`verify_jwt=false`), then publish the website. The function accepts either the existing `NOTIFY_CONTACT_SECRET` from an INSERT webhook on `public.contact_messages` or `CRON_SECRET` from the scheduled worker. It reads the contact by UUID with the service role. Keep `RESEND_API_KEY`, a verified `NOTIFY_FROM`, the internal `NOTIFY_EMAIL`, and the service-role credentials in Edge secrets. GitHub Actions needs the matching `CRON_SECRET` and `SUPABASE_URL`. The webhook wakes delivery immediately; the ten-minute schedule also covers missed webhooks.

Internal notification and customer acknowledgement complete independently. Each uses a stable provider key for its channel and inquiry. If acceptance is uncertain for 23 hours, automatic retries stop before the provider's deduplication window expires. Check the provider by key before deciding whether to resend. To locate those cases without reading customer text:

```sql
select contact_id, channel, first_attempt from public.contact_deliveries
where completed_at is null and channel in ('internal','reply')
  and first_attempt <= now() - interval '23 hours';
```

## Optional Google Sheet

Replace the old public browser mirror with a new deployment of `integrations/contact-sheet.gs`. Set `CONTACT_SHEET_SECRET` and `SPREADSHEET_ID` in Apps Script properties. Set the matching `CONTACT_SHEET_SECRET` and Apps Script execution URL as `CONTACT_SHEET_URL` in Edge secrets. The integration writes a dedicated tab, checks the saved UUID under a lock, and acknowledges the same UUID on retry. Retire the previous unauthenticated Apps Script deployment separately. Until configured, sheet jobs stay pending while email proceeds. Enabling the mirror later processes its pending inquiries. This change does not remove historical copies from Sheets.

## Immediate wake-up

An AFTER INSERT trigger wakes the worker by posting a saved contact UUID and a short-lived, single-use proof through PostgreSQL's pg_net extension. The queue and outbound request commit together. The worker redeems the proof for that UUID before it can claim any deliveries. The long-lived worker credentials and inquiry contents stay out of HTTP webhook configuration. The ten-minute schedule remains the fallback during outages.

Deploy the migration and worker before setting the private `contact_wake_config.project_ref` for a project with pg_net installed. Development and CI have no target configured by default. Retire the old Dashboard webhook only after the new path passes a no-send check. A database operator can call `select public.enqueue_contact_wake(gen_random_uuid(),true)` and verify its pg_net response is HTTP 200 with `{"dryRun":true}`. This generates an independent diagnostic UUID, sends no customer data and returns before delivery jobs can be claimed.

## Reviewing a stalled email

Scheduled runs report aggregate counts `review.internal` and `review.reply`. A nonzero count fails the run even if all new deliveries succeeded. An authenticated scheduled request with `?dryRun=true` checks those counts without claiming jobs, sending email, or writing to Sheets. A manual run of the GitHub delivery workflow always uses this no-send mode. Individual inquiry wake-ups report only their own delivery result.

For mail only, locate the affected UUID and channel using the query above. Check the provider's acceptance history for the exact channel and idempotency key (`contact-internal:<UUID>` or `contact-reply:<UUID>`). A missing inbox message or an expired provider log is insufficient evidence to send again. If the result cannot be established, keep the job under review. Use a provider reference or support case ID, without contact details, for the following operator-only preview:

```sql
select public.review_contact_email('<contact-uuid>','reply','accepted','<provider-reference>');
```

If acceptance is confirmed, apply the `accepted` decision to complete the channel without resending. Only if the provider confirms the message was **never accepted**, use `not_accepted` to allow the worker to retry. Apply a `READY` preview by adding a fifth argument `true`. The same decision and reference are idempotent. An active lease must expire first. Closing the account's inquiry removes its review records along with the delivery jobs.

The Sheet mirror uses the saved inquiry UUID under an Apps Script lock and continues retrying beyond the mail window when configured. It does not require a mail review decision.
