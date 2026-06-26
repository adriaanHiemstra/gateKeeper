-- =====================================================================
-- Phase 6: Payments (Paystack split-at-payment)
-- Run in Supabase → SQL Editor. Safe to re-run.
--
-- Sets up the schema + security for paid ticketing:
--   1. platform_settings — tunable commission (6% + R2/ticket by default)
--   2. host subaccount   — where a host's split is paid out (filled in Phase B)
--   3. transactions      — one row per checkout attempt (Paystack reference)
--   4. payment_reference — links each minted ticket back to its transaction
--   5. tickets lockdown  — clients can NO LONGER mint tickets; only the
--                          paystack-webhook Edge Function (service role) can.
--
-- 🔐 The service_role key used by Edge Functions BYPASSES RLS entirely, so we
-- deliberately do NOT create any INSERT policy on tickets / transactions for
-- normal users. That single fact is what stops free-ticket minting.
--
-- ⚠️  AFTER you run this, the current PurchaseTicketScreen (which inserts tickets
-- straight from the app) will start failing on checkout — that is the security
-- hole closing. Ticket creation gets rebuilt server-side in Phase C.
-- =====================================================================

-- ---------- 1. Commission config (tunable without redeploying functions) ----------
-- Amounts in cents. Buyer-pays model: this fee is ADDED on top of the ticket
-- face value at checkout, so hosts keep 100% of their ticket price.
create table if not exists public.platform_settings (
  id                       int primary key default 1,
  default_commission_pct   numeric(5,2) not null default 6.00,   -- 6%
  default_commission_flat  integer      not null default 200,    -- R2.00 per ticket
  updated_at               timestamptz  not null default now(),
  constraint single_row check (id = 1)
);

insert into public.platform_settings (id) values (1)
on conflict (id) do nothing;

-- Per-event overrides (e.g. a 0% launch promo, or a custom rate for a big
-- promoter). NULL = fall back to the platform default above.
alter table public.events
  add column if not exists commission_pct  numeric(5,2),
  add column if not exists commission_flat integer;

-- Anyone logged in may READ the settings (the app shows the buyer the fee);
-- nobody writes them from the client — change them in the SQL editor.
alter table public.platform_settings enable row level security;
drop policy if exists read_platform_settings on public.platform_settings;
create policy read_platform_settings on public.platform_settings
  for select to authenticated using (true);

-- ---------- 2. Where a host gets paid (set by the create-subaccount fn in Phase B) ----------
alter table public.profiles
  add column if not exists paystack_subaccount_code text;

-- ---------- 3. Transactions: one row per checkout ----------
create table if not exists public.transactions (
  id               uuid primary key default gen_random_uuid(),
  reference        text unique not null,              -- Paystack transaction reference
  user_id          uuid not null references auth.users(id) on delete cascade,
  event_id         uuid not null references public.events(id) on delete cascade,
  status           text not null default 'pending',   -- pending | success | failed
  amount           integer not null,                  -- total charged, in cents (ZAR)
  platform_fee     integer,                           -- our commission, in cents
  subaccount_code  text,                              -- host subaccount the split went to
  cart             jsonb  not null,                   -- [{ tier_id, name, price, quantity }]
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists transactions_user_idx  on public.transactions (user_id);
create index if not exists transactions_event_idx on public.transactions (event_id);

-- A buyer can read their OWN transactions (order history / receipts). INSERT and
-- UPDATE happen only inside Edge Functions via the service role (which bypasses
-- RLS), so there is intentionally no client write policy here.
alter table public.transactions enable row level security;
drop policy if exists own_transactions_read on public.transactions;
create policy own_transactions_read on public.transactions
  for select to authenticated
  using (auth.uid() = user_id);

-- ---------- 4. Tickets: link each ticket to the transaction that paid for it ----------
alter table public.tickets
  add column if not exists payment_reference text;

create index if not exists tickets_payment_ref_idx on public.tickets (payment_reference);

-- ---------- 5. 🔐 Tickets lockdown — remove the client INSERT (free-ticket hole) ----------
-- Phase 3 granted users `own_tickets` FOR ALL, which let anyone INSERT a valid
-- ticket for free. Replace it with READ-ONLY: users still SEE their tickets
-- (My Tickets), but creation now happens only server-side in the webhook.
-- (The host read + host check-in/update policies from Phase 4 stay as-is.)
drop policy if exists own_tickets on public.tickets;
create policy own_tickets_read on public.tickets
  for select to authenticated
  using (auth.uid() = user_id);
