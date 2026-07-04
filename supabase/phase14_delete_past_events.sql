-- =====================================================================
-- Phase 14: Let a host delete their own past events
-- Run in Supabase → SQL Editor. Safe to re-run.
--
-- A host can only delete an event from the app's Past tab, and only if it
-- never sold a ticket — deleting one that did would silently erase buyers'
-- "My Tickets" entries and any refund/audit trail. All of that is enforced
-- HERE, not just in the client, so it holds even if called directly.
--
-- SECURITY DEFINER because cleaning up related rows (event_updates,
-- staff_codes, ...) touches tables whose RLS only lets the *owning user*
-- (not the host) delete their own row — e.g. own_event_rsvps. The function
-- does its own host/ownership check up front instead of relying on RLS.
--
-- saved_events, event_rsvps and transactions already cascade on event_id
-- (phase2_rsvp.sql, phase6_payments.sql), so they're left to that; the
-- others below don't have a known cascade and are cleaned up explicitly.
-- =====================================================================

create or replace function public.delete_past_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_id uuid;
  v_date timestamptz;
  v_ticket_count int;
begin
  select host_id, date into v_host_id, v_date
  from public.events
  where id = p_event_id;

  if v_host_id is null then
    raise exception 'Event not found.';
  end if;

  if v_host_id <> auth.uid() then
    raise exception 'You do not host this event.';
  end if;

  if v_date >= now() then
    raise exception 'Only past events can be deleted.';
  end if;

  select count(*) into v_ticket_count
  from public.tickets
  where event_id = p_event_id;

  if v_ticket_count > 0 then
    raise exception 'This event has % ticket(s) sold and can''t be deleted.', v_ticket_count;
  end if;

  delete from public.ticket_tiers       where event_id = p_event_id;
  delete from public.event_updates      where event_id = p_event_id;
  delete from public.event_interactions where event_id = p_event_id;
  delete from public.staff_codes        where event_id = p_event_id;
  delete from public.events             where id = p_event_id;
end;
$$;

-- Any signed-in host may call it; the checks above are what actually gate it.
revoke all on function public.delete_past_event(uuid) from public, anon;
grant execute on function public.delete_past_event(uuid) to authenticated;
