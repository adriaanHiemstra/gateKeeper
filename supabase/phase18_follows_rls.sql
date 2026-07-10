-- =====================================================================
-- Phase 18: Make host follower counts/follow-state actually readable
-- Run in Supabase → SQL Editor. Safe to re-run.
--
-- Why: `follows` had only ever been queried for your OWN following_id
-- (HostDashboard's "recent followers" list). EventHostProfileScreen now
-- needs to read an ARBITRARY host's follower count and whether the
-- current viewer follows them — a third-party read this table has never
-- had to support before. Follow counts are meant to be public-facing (like
-- any social app), so this opens SELECT to any signed-in user while still
-- restricting writes to your own follower_id.
-- =====================================================================

alter table public.follows enable row level security;

drop policy if exists public_read_follows on public.follows;
create policy public_read_follows on public.follows
  for select to authenticated
  using (true);

drop policy if exists own_follows_write on public.follows;
create policy own_follows_write on public.follows
  for insert to authenticated
  with check (auth.uid() = follower_id);

drop policy if exists own_follows_delete on public.follows;
create policy own_follows_delete on public.follows
  for delete to authenticated
  using (auth.uid() = follower_id);
