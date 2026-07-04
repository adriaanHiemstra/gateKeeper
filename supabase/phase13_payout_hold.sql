-- =====================================================================
-- Phase 13: Payout hold — schema (see docs/payout-hold-spec.md)
-- ⚠️ DO NOT run until Paystack Transfers are confirmed + regulatory check done.
-- Safe to re-run. Deliberately INERT: payout_mode defaults to 'instant', so
-- applying this changes no behaviour until a host is flipped to 'held'.
-- =====================================================================

-- Host payout tier + transfer recipient (distinct from the split subaccount).
alter table public.profiles
  add column if not exists payout_mode text not null default 'instant',
  add column if not exists paystack_recipient_code text,
  add column if not exists events_completed integer not null default 0;

-- Per-event snapshot of the mode + lifecycle of the held money.
alter table public.events
  add column if not exists payout_mode text,
  add column if not exists payout_status text,   -- holding | released | refunded | frozen
  add column if not exists payout_released_at timestamptz;

-- What we owe the host per order, and how the order settled.
alter table public.transactions
  add column if not exists host_amount integer,
  add column if not exists settlement_mode text not null default 'split';

-- Release ledger: one row per (attempted) transfer to a host.
create table if not exists public.payouts (
  id                      uuid primary key default gen_random_uuid(),
  event_id                uuid not null references public.events(id),
  host_id                 uuid not null references auth.users(id),
  amount                  integer not null,               -- cents
  status                  text not null default 'pending', -- pending|processing|paid|failed
  paystack_transfer_code  text,
  trigger                 text,                            -- checkin|scheduled|manual
  created_at              timestamptz not null default now(),
  paid_at                 timestamptz
);

alter table public.payouts enable row level security;

-- Hosts may see their own payout history (earnings screen). Writes are
-- service-role only (release-event-payout) — no client policies.
drop policy if exists host_read_own_payouts on public.payouts;
create policy host_read_own_payouts on public.payouts
  for select to authenticated
  using (auth.uid() = host_id);
