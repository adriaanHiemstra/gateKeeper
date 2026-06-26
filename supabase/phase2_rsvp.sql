-- =====================================================================
-- Phase 2: separate saved / RSVP state from the analytics log
-- Run this in the Supabase dashboard → SQL Editor.
--
-- Why: event_interactions was doing two jobs at once — an append-only log of
-- CLICKED events AND the toggle-state for SAVED / GOING. That's why the
-- "I'm Going" upsert couldn't work (no unique key it could conflict on).
-- After this, each concern has its own table:
--   saved_events       = wishlist (hearts)     — idempotent (PK user+event)
--   event_rsvps        = "I'm going" RSVPs      — idempotent (PK user+event)
--   event_interactions = analytics log (CLICKED) — append-only, for the algorithm
-- =====================================================================

-- 1. Wishlist (hearts). Composite PK means a save can never duplicate.
create table if not exists public.saved_events (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  event_id   uuid not null references public.events(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, event_id)
);

-- 2. RSVP ("I'm going"). Same idempotent shape — this is what makes the
--    handleConfirmGoing upsert in EventProfileScreen actually persist.
create table if not exists public.event_rsvps (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  event_id   uuid not null references public.events(id) on delete cascade,
  status     text not null default 'going',
  created_at timestamptz default now(),
  primary key (user_id, event_id)
);

-- 3. Backfill from the old rows so existing saves / RSVPs carry over.
insert into public.saved_events (user_id, event_id)
select distinct user_id, event_id
from public.event_interactions
where intent = 'SAVED'
on conflict do nothing;

insert into public.event_rsvps (user_id, event_id, status)
select distinct user_id, event_id, 'going'
from public.event_interactions
where intent = 'GOING'
on conflict do nothing;

-- 4. Indexes for the feed / friends lookups.
create index if not exists idx_saved_events_event on public.saved_events(event_id);
create index if not exists idx_event_rsvps_event on public.event_rsvps(event_id);

-- 5. Point get_event_friends at the new tables (friends who are GOING or SAVED).
create or replace function public.get_event_friends(p_event_id uuid, p_user_id uuid)
returns table (friend_id uuid, username text, avatar_url text, intent text)
language sql
stable
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
  order by p.id, fi.intent;  -- 'GOING' sorts before 'SAVED', so it wins on ties
$$;
