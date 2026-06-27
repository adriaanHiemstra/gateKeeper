-- =====================================================================
-- Phase 9: Door-staff scanning — fast, collision-free staff codes
-- Run in Supabase → SQL Editor AFTER phase 8. Safe to re-run.
--
-- Door staff log in with a 6-digit code and every scan re-checks that code,
-- so the lookup must be fast, and two ACTIVE codes must never share a value
-- (otherwise a code couldn't be resolved to a single event).
-- =====================================================================

-- Fast lookups: the staff-login and scan-ticket Edge Functions both filter
-- staff_codes by `code` (and the Team Access list filters by event_id).
create index if not exists staff_codes_code_idx     on public.staff_codes (code);
create index if not exists staff_codes_event_id_idx on public.staff_codes (event_id);

-- No two *active* codes may collide. A revoked/old code can reuse a value, but
-- at any moment a given code maps to exactly one event. If this errors, you
-- have two active codes with the same value — revoke one and re-run:
--   select code, count(*) from public.staff_codes
--   where is_active group by code having count(*) > 1;
create unique index if not exists staff_codes_active_code_uniq
  on public.staff_codes (code)
  where is_active;

-- Note: staff scanning is performed by the scan-ticket Edge Function using the
-- service role, so it intentionally does NOT need (and must not get) a ticket
-- RLS policy for unauthenticated staff. The host's own scanning still relies on
-- host_update_event_tickets from phase 4/7.
