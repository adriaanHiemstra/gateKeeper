-- =====================================================================
-- Phase 14: Friend requests + block/privacy enforcement + event intent
-- ⚠️ NOT applied to the live DB yet — branch feature/friend-requests. Applying
-- this changes friend behaviour (and the app on main still does the old direct
-- insert), so apply + merge together. Safe to re-run.
--
-- Model (decided with the user):
--  • Approve-to-see: your activity is visible only to ACCEPTED friends; blocked
--    and non-friends see nothing. Contact sync sends REQUESTS, never auto-adds
--    (this is what fixes the cross-account befriending bug).
--  • Event badges: friends show BOUGHT (has a ticket) vs INTERESTED (saved).
-- =====================================================================

-- 1. friendships: a relationship now has a status + who asked ------------
alter table public.friendships
  add column if not exists status text not null default 'accepted',  -- existing rows = accepted
  add column if not exists requester_id uuid references auth.users(id);

-- One relationship per pair regardless of column order — blocks duplicate /
-- reverse rows (A→B and B→A can't both exist).
create unique index if not exists friendships_pair_uniq
  on public.friendships (least(user_id_1, user_id_2), greatest(user_id_1, user_id_2));

-- 2. All writes go through the RPCs below — remove the permissive (null-check)
--    client INSERT policy so nobody can forge a friendship. SELECT/DELETE for
--    the owner stay (see_own_friendships / delete_own_friendships).
drop policy if exists create_friendships on public.friendships;

-- 3. Helpers -------------------------------------------------------------
create or replace function public.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from blocked_users
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from friendships f
    where f.status = 'accepted'
      and ((f.user_id_1 = a and f.user_id_2 = b)
        or (f.user_id_1 = b and f.user_id_2 = a))
  ) and not public.is_blocked(a, b);
$$;

-- 4. Visibility RLS: accepted friend + not blocked + target allows activity
drop policy if exists see_friends_rsvps on public.event_rsvps;
create policy see_friends_rsvps on public.event_rsvps for select to authenticated
using (
  public.are_friends(auth.uid(), event_rsvps.user_id)
  and coalesce((select show_activity from profiles where id = event_rsvps.user_id), true)
);

drop policy if exists see_friends_saved_events on public.saved_events;
create policy see_friends_saved_events on public.saved_events for select to authenticated
using (
  public.are_friends(auth.uid(), saved_events.user_id)
  and coalesce((select show_activity from profiles where id = saved_events.user_id), true)
);

-- 5. Request lifecycle (SECURITY DEFINER, always act as the caller) -------
-- request_friend: create a pending request; if they already requested me,
-- accept it (mutual). Returns a status string the app can surface.
create or replace function public.request_friend(target uuid)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); existing record; allowed boolean;
begin
  if me is null then return 'unauthenticated'; end if;
  if target = me then return 'self'; end if;
  if public.is_blocked(me, target) then return 'blocked'; end if;

  select coalesce(allow_friend_requests, true) into allowed from profiles where id = target;
  if not found then return 'not_found'; end if;
  if not allowed then return 'not_allowed'; end if;

  select * into existing from friendships f
   where (f.user_id_1 = me and f.user_id_2 = target)
      or (f.user_id_1 = target and f.user_id_2 = me);

  if found then
    if existing.status = 'accepted' then return 'already_friends'; end if;
    if existing.requester_id = target then       -- they asked first → accept
      update friendships set status = 'accepted' where id = existing.id;
      return 'accepted';
    end if;
    return 'already_requested';
  end if;

  insert into friendships (user_id_1, user_id_2, requester_id, status)
  values (me, target, me, 'pending');
  return 'requested';
end;
$$;

-- accept_friend: only the person who was requested can accept.
create or replace function public.accept_friend(other uuid)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then return 'unauthenticated'; end if;
  update friendships set status = 'accepted'
   where status = 'pending' and requester_id = other
     and ((user_id_1 = me and user_id_2 = other) or (user_id_1 = other and user_id_2 = me));
  if not found then return 'no_request'; end if;
  return 'accepted';
end;
$$;

-- remove_friend: decline a request, cancel one you sent, or unfriend.
create or replace function public.remove_friend(other uuid)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then return 'unauthenticated'; end if;
  delete from friendships
   where (user_id_1 = me and user_id_2 = other) or (user_id_1 = other and user_id_2 = me);
  return 'removed';
end;
$$;

-- 6. Blocking severs any friendship / pending request both ways ----------
create or replace function public.sever_friendship_on_block()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from friendships
   where (user_id_1 = new.blocker_id and user_id_2 = new.blocked_id)
      or (user_id_1 = new.blocked_id and user_id_2 = new.blocker_id);
  return new;
end;
$$;
drop trigger if exists trg_sever_friendship_on_block on public.blocked_users;
create trigger trg_sever_friendship_on_block
  after insert on public.blocked_users
  for each row execute function public.sever_friendship_on_block();

-- 7. get_event_friends: accepted+not-blocked+show_activity friends, with
--    BOUGHT (has a ticket) winning over INTERESTED (saved). Uses auth.uid()
--    internally (p_user_id is ignored) so a caller can't probe someone else.
create or replace function public.get_event_friends(p_event_id uuid, p_user_id uuid)
returns table(friend_id uuid, username text, avatar_url text, intent text)
language sql stable security definer set search_path = public as $$
  with my_friends as (
    select case when f.user_id_1 = auth.uid() then f.user_id_2 else f.user_id_1 end as fid
    from friendships f
    where f.status = 'accepted'
      and (f.user_id_1 = auth.uid() or f.user_id_2 = auth.uid())
  ),
  visible as (
    select mf.fid from my_friends mf
    join profiles p on p.id = mf.fid
    where coalesce(p.show_activity, true)
      and not public.is_blocked(auth.uid(), mf.fid)
  ),
  intents as (
    select t.user_id as uid, 'BOUGHT' as intent, 1 as rank
      from tickets t where t.event_id = p_event_id and t.status in ('valid','scanned')
    union all
    select s.user_id as uid, 'INTERESTED' as intent, 2 as rank
      from saved_events s where s.event_id = p_event_id
  )
  select distinct on (p.id) p.id, p.username, p.avatar_url, i.intent
  from intents i
  join visible v on v.fid = i.uid
  join profiles p on p.id = i.uid
  order by p.id, i.rank;
$$;

-- 8. Pending requests waiting for the current user to accept/decline.
create or replace function public.get_friend_requests()
returns table(requester_id uuid, username text, full_name text,
              avatar_url text, avatar_color text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select f.requester_id, p.username, p.full_name, p.avatar_url, p.avatar_color, f.created_at
  from friendships f
  join profiles p on p.id = f.requester_id
  where f.status = 'pending'
    and f.requester_id <> auth.uid()
    and (f.user_id_1 = auth.uid() or f.user_id_2 = auth.uid());
$$;
