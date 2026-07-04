-- Segmentation fields collected on the post-signup "complete profile" step.
-- These describe the practitioner's BUSINESS (profession, clinic size, attribution)
-- — never patient data — so they stay clean under Amendment 13 / תיקון 13.
-- Written client-side via profiles_update_own RLS (see 20260703000000_profiles.sql).

alter table public.profiles
  add column if not exists profession   text,     -- e.g. 'doctor', 'vet', 'psychologist'
  add column if not exists clinic_size  text,     -- 'solo' | '2-5' | '6plus'
  add column if not exists heard_about  text,     -- attribution: how they found us
  add column if not exists onboarded    boolean not null default false;

-- Extend the new-user trigger so any of these that arrive in signup metadata
-- (e.g. future flows) are captured; the primary write path is the client update.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name, phone, provider,
    profession, clinic_size, heard_about, onboarded
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_app_meta_data->>'provider', 'email'),
    new.raw_user_meta_data->>'profession',
    new.raw_user_meta_data->>'clinic_size',
    new.raw_user_meta_data->>'heard_about',
    coalesce((new.raw_user_meta_data->>'onboarded')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
