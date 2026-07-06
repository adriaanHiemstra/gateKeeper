-- =====================================================================
-- Phase 16: Make event_interactions actually append-only
-- Run in Supabase → SQL Editor. Safe to re-run.
--
-- phase2_rsvp.sql repurposed event_interactions into an append-only CLICKED
-- log once SAVED/GOING got their own idempotent tables, but never dropped
-- the original unique(user_id, event_id) constraint from when this table
-- also held toggle-state. Every repeat view of an event a user already
-- opened before now hits that constraint and fails with 23505 — trackEventInteraction
-- (app/lib/interactions.ts) just warns and drops it, so the click is silently
-- lost instead of being logged, and every repeat view pays for a doomed insert.
-- =====================================================================

alter table public.event_interactions
  drop constraint if exists event_interactions_user_id_event_id_key;

-- HomeScreen's feed builder filters this exact shape (user_id + intent) to
-- find events the user has already seen — didn't have a supporting index.
create index if not exists idx_event_interactions_user_intent
  on public.event_interactions(user_id, intent);

-- delete_past_event (phase14) deletes by event_id with no supporting index.
create index if not exists idx_event_interactions_event
  on public.event_interactions(event_id);
