-- Migration: claim_beta_access RPC function
-- Allows authorized beta testers with a secret passcode to immediately
-- receive an active 'full' plan in user_access without going through the paywall.

create or replace function public.claim_beta_access(passcode text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
  v_existing_id uuid;
  v_clean_code text;
begin
  -- 1. Ensure user is authenticated
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'משתמש לא מחובר. יש להירשם או להתחבר תחילה.');
  end if;

  -- 2. Verify beta passcode
  v_clean_code := upper(trim(coalesce(passcode, '')));
  if v_clean_code not in ('CLINICFLOWBETA', 'CLINIC-FLOW-BETA', 'CLINICFLOW-BETA', 'CLINIC-BETA-2026', 'CLINIC-BETA', 'CF-BETA') then
    return jsonb_build_object('ok', false, 'error', 'קוד גישה שגוי. אנא ודא/י את הקוד ונסה/י שוב.');
  end if;

  -- 3. Resolve user email
  select email into v_email from auth.users where id = v_user_id;

  -- 4. Upsert user_access with plan = 'full'
  select id into v_existing_id from public.user_access where user_id = v_user_id limit 1;

  if v_existing_id is not null then
    update public.user_access
    set plan = 'full',
        is_active = true,
        expires_at = null,
        notes = 'Beta Program Registration (Full License)',
        granted_at = now()
    where id = v_existing_id;
  else
    insert into public.user_access (
      user_id, email, plan, is_active, expires_at, notes, granted_at
    ) values (
      v_user_id, v_email, 'full', true, null, 'Beta Program Registration (Full License)', now()
    );
  end if;

  -- 5. Record 0 NIS purchase entry
  insert into public.purchases (
    user_id, email, version, plan, amount, payment_id, discount_eligible
  ) values (
    v_user_id, v_email, 'full', 'full', 0, 'BETA-' || substr(gen_random_uuid()::text, 1, 8), false
  );

  -- 6. Update profile to marked as onboarded
  update public.profiles
  set onboarded = true
  where id = v_user_id;

  return jsonb_build_object('ok', true, 'plan', 'full');
end;
$$;

-- Grant execution to authenticated users
grant execute on function public.claim_beta_access(text) to authenticated;
