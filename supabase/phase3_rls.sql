-- =====================================================================
-- Phase 3: Row Level Security policies
-- Run in Supabase → SQL Editor. Safe to re-run (drops same-named policies first).
--
-- Pattern: each user can read/write only their OWN rows in their data tables;
-- shared content (events, categories, profiles) is readable by any logged-in user.
-- Policies are PERMISSIVE (OR'd together), so these only ever GRANT access —
-- they won't remove policies you already created under different names.
-- =====================================================================

-- ---------- IMMEDIATE FIX (unblocks liking) ----------
alter table public.saved_events enable row level security;
drop policy if exists own_saved_events on public.saved_events;
create policy own_saved_events on public.saved_events
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- RSVPs ----------
alter table public.event_rsvps enable row level security;
drop policy if exists own_event_rsvps on public.event_rsvps;
create policy own_event_rsvps on public.event_rsvps
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- Analytics log (CLICKED) ----------
alter table public.event_interactions enable row level security;
drop policy if exists own_event_interactions on public.event_interactions;
create policy own_event_interactions on public.event_interactions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- Interests ----------
alter table public.user_interests enable row level security;
drop policy if exists own_user_interests on public.user_interests;
create policy own_user_interests on public.user_interests
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- Tickets (My Tickets screen) ----------
alter table public.tickets enable row level security;
drop policy if exists own_tickets on public.tickets;
create policy own_tickets on public.tickets
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- Blocking ----------
alter table public.blocked_users enable row level security;
drop policy if exists own_blocks on public.blocked_users;
create policy own_blocks on public.blocked_users
  for all to authenticated
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

-- ---------- Friendships (user is on either side) ----------
alter table public.friendships enable row level security;
drop policy if exists see_own_friendships on public.friendships;
create policy see_own_friendships on public.friendships
  for select to authenticated
  using (auth.uid() = user_id_1 or auth.uid() = user_id_2);
drop policy if exists create_friendships on public.friendships;
create policy create_friendships on public.friendships
  for insert to authenticated
  with check (auth.uid() = user_id_1);
drop policy if exists delete_own_friendships on public.friendships;
create policy delete_own_friendships on public.friendships
  for delete to authenticated
  using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

-- ---------- Let friends see each other's saves / RSVPs (for the feed counts) ----------
drop policy if exists see_friends_saved_events on public.saved_events;
create policy see_friends_saved_events on public.saved_events
  for select to authenticated
  using (exists (
    select 1 from public.friendships f
    where (f.user_id_1 = auth.uid() and f.user_id_2 = saved_events.user_id)
       or (f.user_id_2 = auth.uid() and f.user_id_1 = saved_events.user_id)
  ));
drop policy if exists see_friends_rsvps on public.event_rsvps;
create policy see_friends_rsvps on public.event_rsvps
  for select to authenticated
  using (exists (
    select 1 from public.friendships f
    where (f.user_id_1 = auth.uid() and f.user_id_2 = event_rsvps.user_id)
       or (f.user_id_2 = auth.uid() and f.user_id_1 = event_rsvps.user_id)
  ));

-- ---------- Profiles: everyone logged-in can read; you edit only your own ----------
alter table public.profiles enable row level security;
drop policy if exists read_profiles on public.profiles;
create policy read_profiles on public.profiles
  for select to authenticated using (true);
drop policy if exists update_own_profile on public.profiles;
create policy update_own_profile on public.profiles
  for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- Shared content: readable by any logged-in user ----------
alter table public.events enable row level security;
drop policy if exists read_events on public.events;
create policy read_events on public.events for select to authenticated using (true);
drop policy if exists host_manage_events on public.events;
create policy host_manage_events on public.events
  for all to authenticated
  using (auth.uid() = host_id) with check (auth.uid() = host_id);

alter table public.categories enable row level security;
drop policy if exists read_categories on public.categories;
create policy read_categories on public.categories for select to authenticated using (true);

alter table public.venues enable row level security;
drop policy if exists read_venues on public.venues;
create policy read_venues on public.venues for select to authenticated using (true);

alter table public.ticket_tiers enable row level security;
drop policy if exists read_ticket_tiers on public.ticket_tiers;
create policy read_ticket_tiers on public.ticket_tiers for select to authenticated using (true);

alter table public.event_updates enable row level security;
drop policy if exists read_event_updates on public.event_updates;
create policy read_event_updates on public.event_updates for select to authenticated using (true);

-- ---------- Make the friends RPC bypass RLS in a controlled way ----------
-- SECURITY DEFINER lets it read friends' RSVP/save rows regardless of policies,
-- while still only returning the current user's friends for one event.
create or replace function public.get_event_friends(p_event_id uuid, p_user_id uuid)
returns table (friend_id uuid, username text, avatar_url text, intent text)
language sql
stable
security definer
set search_path = public
as $$
  with my_friends as (
    select case when user_id_1 = p_user_id then user_id_2 else user_id_1 end as fid
    from public.friendships
    where user_id_1 = p_user_id or user_id_2 = p_user_id
  ),
  friend_intents as (
    select user_id, event_id, 'GOING' as intent from public.event_rsvps
    union
    select user_id, event_id, 'SAVED' as intent from public.saved_events
  )
  select distinct on (p.id) p.id, p.username, p.avatar_url, fi.intent
  from friend_intents fi
  join my_friends f on f.fid = fi.user_id
  join public.profiles p on p.id = fi.user_id
  where fi.event_id = p_event_id
  order by p.id, fi.intent;
$$;

-- NOTE: also make match_contacts SECURITY DEFINER (it searches all profiles by
-- phone during onboarding). Add `security definer set search_path = public` to it.
