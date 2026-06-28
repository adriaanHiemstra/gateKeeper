-- =====================================================================
-- Phase 12: Drop redundant duplicate indexes on tickets
-- Run in Supabase → SQL Editor (or via CLI). Safe to re-run.
--
-- Earlier work created indexes on tickets(event_id) and tickets(user_id) under
-- ad-hoc names; phase 8 then added its own (…_idx) versions, leaving two
-- indexes on event_id and three on user_id. Duplicate indexes only cost write
-- time + storage, so we keep the phase-8 names and drop the rest.
-- =====================================================================

drop index if exists public.idx_tickets_event_id;  -- dup of tickets_event_id_idx
drop index if exists public.idx_tickets_user;       -- dup of tickets_user_id_idx
drop index if exists public.idx_tickets_user_id;     -- dup of tickets_user_id_idx

-- Kept: tickets_event_id_idx, tickets_user_id_idx, tickets_qr_code_key (unique),
--       tickets_payment_ref_idx, tickets_pkey.
