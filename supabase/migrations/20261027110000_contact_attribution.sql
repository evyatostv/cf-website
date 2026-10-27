alter table public.contact_messages
  add column if not exists source text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text;

drop policy if exists contact_messages_admin_select on public.contact_messages;
create policy contact_messages_admin_select on public.contact_messages
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'evyatar.druyan@gmail.com');

comment on column public.contact_messages.utm_content is
  'Unique outreach content key used to attribute a demo request to a recipient and A/B variant.';
