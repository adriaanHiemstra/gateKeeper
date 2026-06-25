-- =====================================================================
-- Phase 4: Host-side RLS policies
-- Run in Supabase → SQL Editor. Safe to re-run.
--
-- Fixes the RLS errors when a host writes rows in tables keyed to an event
-- they own — Create/Edit Event (ticket_tiers), Post Update (event_updates),
-- and Team Access (staff_codes). Phase 3 gave these tables READ access only.
--
-- The rule everywhere below: you may write a child row only if its event_id
-- belongs to an event whose host_id is you.
-- =====================================================================

-- 1. ticket_tiers — host creates / edits / deletes tiers for their own events.
--    (The read_ticket_tiers SELECT policy from phase 3 stays as-is.)
drop policy if exists host_manage_ticket_tiers on public.ticket_tiers;
create policy host_manage_ticket_tiers on public.ticket_tiers
  for all to authenticated
  using (
    exists (select 1 from public.events e
            where e.id = ticket_tiers.event_id and e.host_id = auth.uid())
  )
  with check (
    exists (select 1 from public.events e
            where e.id = ticket_tiers.event_id and e.host_id = auth.uid())
  );

-- 2. event_updates — host posts updates for their own events.
drop policy if exists host_manage_event_updates on public.event_updates;
create policy host_manage_event_updates on public.event_updates
  for all to authenticated
  using (
    exists (select 1 from public.events e
            where e.id = event_updates.event_id and e.host_id = auth.uid())
  )
  with check (
    exists (select 1 from public.events e
            where e.id = event_updates.event_id and e.host_id = auth.uid())
  );

-- 3. staff_codes — host manages scanner / staff codes for their own events.
alter table public.staff_codes enable row level security;
drop policy if exists host_manage_staff_codes on public.staff_codes;
create policy host_manage_staff_codes on public.staff_codes
  for all to authenticated
  using (
    exists (select 1 from public.events e
            where e.id = staff_codes.event_id and e.host_id = auth.uid())
  )
  with check (
    exists (select 1 from public.events e
            where e.id = staff_codes.event_id and e.host_id = auth.uid())
  );

-- 4. tickets — a host can READ tickets for events they own (guest list / stats /
--    scanning), on top of seeing their own purchased tickets (own_tickets, phase 3).
drop policy if exists host_read_event_tickets on public.tickets;
create policy host_read_event_tickets on public.tickets
  for select to authenticated
  using (
    exists (select 1 from public.events e
            where e.id = tickets.event_id and e.host_id = auth.uid())
  );

-- 5. tickets — a host can UPDATE ticket status (e.g. check-in) for their events.
drop policy if exists host_update_event_tickets on public.tickets;
create policy host_update_event_tickets on public.tickets
  for update to authenticated
  using (
    exists (select 1 from public.events e
            where e.id = tickets.event_id and e.host_id = auth.uid())
  )
  with check (
    exists (select 1 from public.events e
            where e.id = tickets.event_id and e.host_id = auth.uid())
  );
