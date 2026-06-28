-- =====================================================================
-- Phase 10: Ticket capacity (no more overselling) + readable fee config
-- Run in Supabase → SQL Editor. Safe to re-run.
--
-- ticket_tiers already has quantity_total / quantity_sold, but nothing ever
-- enforced or incremented them. These two functions let the checkout Edge
-- Functions reserve and release capacity ATOMICALLY, so a tier can never sell
-- past its limit even when two people buy the last ticket at once.
--
-- 🔐 They're locked to the service role (the Edge Functions). A normal client
-- must NOT be able to call them, or it could inflate quantity_sold and fake a
-- sell-out, so we revoke execute from anon/authenticated.
-- =====================================================================

-- Reserve p_qty seats on a tier. Returns true only if there was room; the
-- increment and the check happen in one statement so concurrent buyers can't
-- both grab the last seat. quantity_total NULL = unlimited.
create or replace function public.reserve_tier(p_tier_id uuid, p_qty int)
returns boolean
language plpgsql
as $$
begin
  update public.ticket_tiers
     set quantity_sold = coalesce(quantity_sold, 0) + p_qty
   where id = p_tier_id
     and (quantity_total is null
          or coalesce(quantity_sold, 0) + p_qty <= quantity_total);
  return found;
end;
$$;

-- Give seats back when a checkout fails, is abandoned, or expires.
create or replace function public.release_tier(p_tier_id uuid, p_qty int)
returns void
language plpgsql
as $$
begin
  update public.ticket_tiers
     set quantity_sold = greatest(0, coalesce(quantity_sold, 0) - p_qty)
   where id = p_tier_id;
end;
$$;

-- Only the Edge Functions (service role) may move capacity.
revoke execute on function public.reserve_tier(uuid, int)  from public, anon, authenticated;
revoke execute on function public.release_tier(uuid, int)  from public, anon, authenticated;
grant  execute on function public.reserve_tier(uuid, int)  to service_role;
grant  execute on function public.release_tier(uuid, int)  to service_role;

-- ---------- Readable fee config ----------
-- The purchase screen needs the commission rates to show a total that matches
-- what it will actually be charged. The defaults are non-sensitive config, so
-- let any signed-in user read them. (Per-event overrides already live on the
-- events row, which is readable.)
alter table public.platform_settings enable row level security;
drop policy if exists read_platform_settings on public.platform_settings;
create policy read_platform_settings on public.platform_settings
  for select to authenticated
  using (true);
