-- All paths are relative to this file. Production functions and triggers are
-- installed from repository migrations before the SQL scenarios run.
\ir baseline.sql
\ir ../../supabase/migrations/20260604000000_deletion_requests.sql
grant select,insert,update on public.deletion_requests to authenticated;
\ir ../../supabase/migrations/20260702000000_license_keys.sql
\ir ../../supabase/migrations/20261025090000_email_campaign_tracking.sql
\ir ../../supabase/migrations/20261027110000_contact_attribution.sql
\ir ../../supabase/migrations/20261029120000_grow_orders.sql
\ir ../../supabase/migrations/20261104150000_grow_checkout_integrity.sql
\ir ../../supabase/migrations/20261126000000_grow_full_entitlement.sql
\ir ../../supabase/migrations/20261126001000_purchase_trigger_schema.sql
-- The production installation already has this legacy trigger binding.
create trigger on_purchase_sync_access after insert on public.purchases
for each row execute function public.sync_user_access_on_purchase();
\ir ../../supabase/migrations/20261126010000_additional_grow_seats.sql
\ir ../../supabase/migrations/20261126020000_grow_receipt_delivery.sql
\ir ../../supabase/migrations/20261126040000_paid_device_claims.sql
\ir ../../supabase/migrations/20261126050000_support_grow_reversal.sql
\ir ../../supabase/migrations/20261126060000_atomic_account_archive.sql
\ir ../../supabase/migrations/20261126061000_active_marketing_admin.sql
\ir ../../supabase/migrations/20261126062000_stored_contact_delivery.sql
