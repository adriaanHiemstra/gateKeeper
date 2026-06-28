-- =====================================================================
-- Phase 11: Clear the scan stamp when a check-in is reverted
-- Run in Supabase → SQL Editor (or applied via CLI). Safe to re-run.
--
-- phase 8 stamps scanned_at / scanned_by when status becomes 'scanned', but it
-- never cleared them if a host manually un-checks a guest in the Guest List —
-- leaving a stale "scanned at" time on a ticket that's valid again. This makes
-- the stamp track both directions. Self-contained: it (re)creates the columns
-- and trigger, so it's correct whether or not phase 8 was applied.
-- =====================================================================

alter table public.tickets
  add column if not exists scanned_at timestamptz,
  add column if not exists scanned_by uuid references auth.users (id);

create or replace function public.stamp_ticket_scan()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'scanned' and old.status is distinct from 'scanned' then
    -- checked in
    new.scanned_at := now();
    new.scanned_by := auth.uid();
  elsif new.status is distinct from 'scanned' and old.status = 'scanned' then
    -- reverted (manual un-check-in) → drop the stale stamp
    new.scanned_at := null;
    new.scanned_by := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_ticket_scan on public.tickets;
create trigger trg_stamp_ticket_scan
  before update on public.tickets
  for each row
  execute function public.stamp_ticket_scan();
