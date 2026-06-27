-- =====================================================================
-- Phase 8: QR scanning — integrity, speed, and an audit trail
-- Run in Supabase → SQL Editor AFTER phase 6 + phase 7. Safe to re-run.
--
-- The scanner looks a ticket up by qr_code and atomically flips
-- status 'valid' -> 'scanned'. This migration makes that lookup fast,
-- guarantees codes can never collide, and records WHEN / BY WHOM a
-- ticket was scanned (set server-side so the app can't spoof it).
-- =====================================================================

-- ---------- 1. qr_code must be unique + indexed ----------
-- Uniqueness is a security property: two rows can never share a code, so a
-- scan can never be ambiguous. The index also turns each scan lookup from a
-- full-table scan into an instant index hit.
--
-- If this errors with "could not create unique index", you have legacy
-- duplicate codes — find them first with:
--   select qr_code, count(*) from public.tickets
--   group by qr_code having count(*) > 1;
create unique index if not exists tickets_qr_code_key
  on public.tickets (qr_code);

-- ---------- 2. Supporting indexes for the hot paths ----------
-- Host guest-list / per-event scanning filters by event_id; My Tickets
-- filters by user_id. Postgres does NOT auto-index foreign keys.
create index if not exists tickets_event_id_idx on public.tickets (event_id);
create index if not exists tickets_user_id_idx  on public.tickets (user_id);

-- ---------- 3. Audit trail: when + who scanned ----------
alter table public.tickets
  add column if not exists scanned_at timestamptz,
  add column if not exists scanned_by uuid references auth.users (id);

-- Stamp scanned_at / scanned_by automatically the moment status becomes
-- 'scanned'. Doing it in a trigger (not the app) means the timestamp and the
-- scanning staff member are trustworthy — the client only ever sets status.
create or replace function public.stamp_ticket_scan()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'scanned' and old.status is distinct from 'scanned' then
    new.scanned_at := now();
    new.scanned_by := auth.uid();  -- the host/staff session doing the scan
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_ticket_scan on public.tickets;
create trigger trg_stamp_ticket_scan
  before update on public.tickets
  for each row
  execute function public.stamp_ticket_scan();

-- ---------- 4. (Optional) sanity: verify the final shape ----------
-- select indexname from pg_indexes
--   where tablename = 'tickets' order by indexname;
-- select column_name from information_schema.columns
--   where table_name = 'tickets' and column_name in ('scanned_at','scanned_by');
