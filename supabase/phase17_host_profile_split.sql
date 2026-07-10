-- =====================================================================
-- Phase 17: Separate host identity from personal identity
-- Run in Supabase → SQL Editor. Safe to re-run.
--
-- Why: HostProfileEditScreen and EditUserProfile both read/wrote the same
-- profiles columns (full_name, username, bio, avatar_url), so editing your
-- host profile silently overwrote your personal profile and vice versa.
-- This gives hosts their own name/handle/bio/avatar, independent of the
-- personal ones. `website` already only lived on the host side and
-- `location`/`interests` already only lived on the personal side, so
-- those don't need splitting.
-- =====================================================================

alter table public.profiles
  add column if not exists host_full_name text,
  add column if not exists host_username text,
  add column if not exists host_bio text,
  add column if not exists host_avatar_url text;

-- host_username needs its own uniqueness, same as username already has.
-- Partial index so multiple rows can still have it null (never set up as a host).
create unique index if not exists profiles_host_username_key
  on public.profiles (host_username)
  where host_username is not null;

-- Backfill: every existing host's "host identity" WAS these personal fields
-- (that's the whole bug) — carry it forward once so nobody's public host
-- profile appears blank after this migration runs.
update public.profiles
set host_full_name = full_name,
    host_username = username,
    host_bio = bio,
    host_avatar_url = avatar_url
where host_full_name is null
  and host_username is null
  and host_bio is null
  and host_avatar_url is null;
