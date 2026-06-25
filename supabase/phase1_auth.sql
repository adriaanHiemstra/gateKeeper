-- =====================================================================
-- Phase 1: Auth & session flow — database prerequisites
-- Run this in the Supabase dashboard → SQL Editor.
-- =====================================================================

-- 1. Track whether a user has finished onboarding (interests / contact sync).
--    The app routes users with onboarded = false to the Onboarding screen.
alter table public.profiles
  add column if not exists onboarded boolean not null default false;

-- Existing users already in the table shouldn't be forced back through
-- onboarding, so mark them complete. (New signups default to false.)
update public.profiles set onboarded = true where onboarded = false;

-- 2. Auto-create a profiles row when a new auth user signs up, copying the
--    metadata SignUp.tsx passes (full_name, username, gender, dob).
--    Verify this trigger exists — if profiles rows aren't appearing on signup,
--    this is why. Safe to re-run.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, username, gender, dob, onboarded)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'gender',
    nullif(new.raw_user_meta_data ->> 'dob', '')::date,
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
