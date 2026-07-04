-- =====================================================================
-- Phase 13: Lock past events from being edited (server-side)
-- Run in Supabase → SQL Editor. Safe to re-run.
--
-- The app already hides "Edit Details" once an event's date has passed
-- (ManageEventScreen / EditEventsScreen), but that was a client-side guard
-- only — any host's authenticated session could still call the API directly
-- and rewrite a finished event's title/date/tiers, including pushing the
-- date into the future to "revive" it. These triggers enforce the same rule
-- in the database, so it holds regardless of which client is asking.
-- =====================================================================

-- 1. events — once OLD.date is in the past, reject changes to the "content"
--    columns EditEventsScreen saves in one update (title, description,
--    location, date, media, categories, visibility). Operational columns
--    (is_boosted, boosted_until, commission overrides, ...) are left alone,
--    so boosting/admin flows keep working on events that have ended.
create or replace function public.prevent_past_event_edits()
returns trigger
language plpgsql
as $$
begin
  if OLD.date < now() and (
    NEW.title         is distinct from OLD.title or
    NEW.description   is distinct from OLD.description or
    NEW.location_text is distinct from OLD.location_text or
    NEW.lat           is distinct from OLD.lat or
    NEW.lng           is distinct from OLD.lng or
    NEW.date          is distinct from OLD.date or
    NEW.end_date      is distinct from OLD.end_date or
    NEW.categories    is distinct from OLD.categories or
    NEW.images        is distinct from OLD.images or
    NEW.banner_url    is distinct from OLD.banner_url or
    NEW.is_public     is distinct from OLD.is_public
  ) then
    raise exception 'This event has already happened and can no longer be edited.';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_prevent_past_event_edits on public.events;
create trigger trg_prevent_past_event_edits
  before update on public.events
  for each row
  execute function public.prevent_past_event_edits();

-- 2. ticket_tiers — same rule for the tier list a host edits alongside the
--    event (name/price/quantity/active). Insert, update and delete are all
--    blocked once the parent event's date has passed, since EditEventsScreen
--    upserts changed tiers and deletes removed ones in the same save.
create or replace function public.prevent_past_event_tier_edits()
returns trigger
language plpgsql
as $$
declare
  target_event_id uuid;
  event_date timestamptz;
begin
  target_event_id := case when TG_OP = 'DELETE' then OLD.event_id else NEW.event_id end;
  select date into event_date from public.events where id = target_event_id;

  if event_date is not null and event_date < now() then
    raise exception 'This event has already happened, so its ticket tiers can no longer be edited.';
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_prevent_past_event_tier_edits on public.ticket_tiers;
create trigger trg_prevent_past_event_tier_edits
  before insert or update or delete on public.ticket_tiers
  for each row
  execute function public.prevent_past_event_tier_edits();

-- ---------- Verify (optional) ----------
-- Try editing a past event's title/date as its host — both should now fail:
--   update public.events set title = 'x' where id = '<a past event id>';
--   update public.ticket_tiers set price = 1 where event_id = '<a past event id>';
