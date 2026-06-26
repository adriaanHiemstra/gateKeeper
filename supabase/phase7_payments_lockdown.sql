-- =====================================================================
-- Phase 7: Payments hard lockdown (run AFTER phase 6)
-- Run in Supabase → SQL Editor. Safe to re-run.
--
-- Bulletproofs ticket + transaction security: the ONLY way a ticket can be
-- created is server-side, inside the verify-transaction / paystack-webhook
-- Edge Functions (which use the service role and bypass RLS). To be certain no
-- stray INSERT/ALL grant survives under some other name, we DROP EVERY policy
-- on each table and recreate exactly the safe set.
-- =====================================================================

-- ---------- TICKETS ----------
alter table public.tickets enable row level security;

-- Drop every existing policy on tickets, whatever it's called.
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'tickets'
  loop
    execute format('drop policy if exists %I on public.tickets', pol.policyname);
  end loop;
end $$;

-- Buyers may READ their own tickets (My Tickets). Nothing else.
create policy own_tickets_read on public.tickets
  for select to authenticated
  using (auth.uid() = user_id);

-- Hosts may READ tickets for events they own (guest list / scanning).
create policy host_read_event_tickets on public.tickets
  for select to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = tickets.event_id and e.host_id = auth.uid()
  ));

-- Hosts may UPDATE ticket status for their events (check-in at the door).
create policy host_update_event_tickets on public.tickets
  for update to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = tickets.event_id and e.host_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.events e
    where e.id = tickets.event_id and e.host_id = auth.uid()
  ));

-- 🔐 There is deliberately NO INSERT policy and NO user UPDATE/DELETE policy.
-- Ticket creation happens only in the Edge Functions via the service role.

-- ---------- TRANSACTIONS ----------
alter table public.transactions enable row level security;

do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'transactions'
  loop
    execute format('drop policy if exists %I on public.transactions', pol.policyname);
  end loop;
end $$;

-- Buyers may READ their own transactions (receipts / order status polling).
create policy own_transactions_read on public.transactions
  for select to authenticated
  using (auth.uid() = user_id);

-- 🔐 No client INSERT/UPDATE — only the Edge Functions (service role) write here.

-- ---------- Commission config sanity ----------
insert into public.platform_settings (id) values (1)
on conflict (id) do nothing;

-- ---------- Verify (optional): inspect the final policy set ----------
-- select tablename, policyname, cmd from pg_policies
-- where tablename in ('tickets','transactions') order by tablename, cmd;
