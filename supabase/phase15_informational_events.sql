-- =====================================================================
-- Phase 15: Informational-only events (no ticketing)
-- Run in Supabase → SQL Editor. Safe to re-run.
--
-- Hosts can now publish an event with no ticket tiers at all — just details,
-- optionally with a link out to a website / external ticket page. This is
-- the exact same shape the WebScrapers pipeline already produces for scraped
-- events (an events row with zero ticket_tiers, ticket_url set), just made a
-- deliberate, explicit choice instead of an implicit side effect of skipping
-- tier creation.
-- =====================================================================

alter table public.events
  add column if not exists requires_tickets boolean not null default true;

-- Backfill: every existing event with zero ticket_tiers rows was already
-- "informational" in practice — this app has always inserted a tier
-- alongside a real ticketed event in the same publish flow, and scraped
-- events never get tiers. Align the new flag with that reality so
-- EventProfileScreen's ticket-vs-info branching is correct for old rows too.
update public.events e
set requires_tickets = false
where not exists (
  select 1 from public.ticket_tiers t where t.event_id = e.id
);
