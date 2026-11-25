-- A short-lived signed JWT can outlive account closure or logout. Sensitive
-- outreach records also require the same live account and session.
create function public.is_active_outreach_admin() returns boolean
language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from auth.users u join auth.sessions s on s.user_id=u.id
    where u.id=auth.uid() and s.id::text=auth.jwt()->>'session_id'
      and u.email='evyatar.druyan@gmail.com' and u.email=auth.jwt()->>'email'
      and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<now())
      and (s.not_after is null or s.not_after>now())
  );
$$;
revoke all on function public.is_active_outreach_admin() from public,anon;
grant execute on function public.is_active_outreach_admin() to authenticated;

drop policy if exists "Authenticated can read" on public.contact_messages;
alter policy contact_messages_admin_select on public.contact_messages
  using ((select public.is_active_outreach_admin()));
alter policy email_campaigns_admin_all on public.email_campaigns
  using ((select public.is_active_outreach_admin())) with check ((select public.is_active_outreach_admin()));
alter policy email_campaign_contacts_admin_all on public.email_campaign_contacts
  using ((select public.is_active_outreach_admin())) with check ((select public.is_active_outreach_admin()));
alter policy email_campaign_events_admin_all on public.email_campaign_events
  using ((select public.is_active_outreach_admin())) with check ((select public.is_active_outreach_admin()));
