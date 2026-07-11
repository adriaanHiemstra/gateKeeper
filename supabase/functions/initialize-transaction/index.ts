// =====================================================================
// initialize-transaction
// Starts a Paystack checkout for the signed-in buyer. Critically, it prices the
// order SERVER-SIDE from the database — the app only sends which tiers and how
// many, never the prices — then applies the platform fee (6% + R2/ticket) and
// splits the host's share to their subaccount. Returns a hosted checkout URL.
// =====================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. Who is buying?
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return reply({ ok: false, error: "Not signed in." });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return reply({ ok: false, error: "Session expired. Please log in again." });
    }

    const { eventId, cart } = await req.json();
    if (!eventId || !Array.isArray(cart) || cart.length === 0) {
      return reply({ ok: false, error: "Nothing to check out." });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 2. Event + its host's payout subaccount + any per-event fee override.
    const { data: event } = await admin
      .from("events")
      .select("id, host_id, commission_pct, commission_flat, date, end_date, requires_tickets")
      .eq("id", eventId)
      .single();
    if (!event) return reply({ ok: false, error: "Event not found." });

    // Reject stale checkouts authoritatively — a feed card left open past an
    // event's expiry (or a link someone still has bookmarked) must not be
    // able to reach payment just because the client-side state is stale.
    // Mirrors app/lib/eventFilters.ts's notEndedFilter/hasEventEnded rule:
    // ended once end_date passes (if set), else 24h after the start (date)
    // for ticketed events, or immediately at the start for info-only ones.
    const IMPLIED_DURATION_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const eventHasEnded = event.end_date
      ? new Date(event.end_date).getTime() < now
      : new Date(event.date).getTime() <
        now - ((event.requires_tickets ?? true) ? IMPLIED_DURATION_MS : 0);
    if (eventHasEnded) {
      return reply({
        ok: false,
        error: "This event has already ended, so tickets are no longer available.",
      });
    }

    if (event.host_id === user.id) {
      return reply({ ok: false, error: "You can't buy tickets to your own event." });
    }

    const { data: host } = await admin
      .from("profiles")
      .select("paystack_subaccount_code")
      .eq("id", event.host_id)
      .single();
    if (!host?.paystack_subaccount_code) {
      return reply({
        ok: false,
        error: "This event can't accept payments yet — the host hasn't set up payouts.",
      });
    }

    // 3. Authoritative prices straight from the DB (never trust the client).
    const tierIds = cart.map((c: { tier_id: string }) => c.tier_id);
    const { data: tiers } = await admin
      .from("ticket_tiers")
      .select("id, name, price")
      .eq("event_id", eventId)
      .in("id", tierIds);
    const tierById = new Map((tiers ?? []).map((t) => [t.id, t]));

    let subtotalCents = 0;
    let ticketCount = 0;
    const safeCart: Array<{ tier_id: string; name: string; price: number; quantity: number }> = [];
    for (const line of cart) {
      const tier = tierById.get(line.tier_id);
      const qty = Math.max(0, parseInt(line.quantity, 10) || 0);
      if (!tier || qty === 0) continue;
      subtotalCents += Math.round(Number(tier.price) * 100) * qty;
      ticketCount += qty;
      safeCart.push({ tier_id: tier.id, name: tier.name, price: tier.price, quantity: qty });
    }
    if (ticketCount === 0) return reply({ ok: false, error: "No valid tickets selected." });

    // 3b. Free up capacity held by checkouts that were started but never paid
    //     (browser closed, app killed). Anything still 'pending' after 20 min is
    //     treated as abandoned so its seats go back on sale.
    const staleCutoff = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const { data: stale } = await admin
      .from("transactions")
      .select("id, cart")
      .eq("event_id", eventId)
      .eq("status", "pending")
      .lt("created_at", staleCutoff);
    for (const s of stale ?? []) {
      for (const item of s.cart as Array<{ tier_id: string; quantity: number }>) {
        await admin.rpc("release_tier", { p_tier_id: item.tier_id, p_qty: item.quantity });
      }
      await admin.from("transactions").update({ status: "expired" }).eq("id", s.id);
    }

    // 3c. Reserve the seats NOW (atomic per tier) so nothing oversells while the
    //     buyer is on the Paystack page. Roll back if any tier is short.
    const reserved: Array<{ tier_id: string; quantity: number }> = [];
    const releaseReserved = async () => {
      for (const r of reserved) {
        await admin.rpc("release_tier", { p_tier_id: r.tier_id, p_qty: r.quantity });
      }
    };
    for (const line of safeCart) {
      const { data: ok, error: rpcErr } = await admin.rpc("reserve_tier", {
        p_tier_id: line.tier_id,
        p_qty: line.quantity,
      });
      // If the capacity functions aren't installed yet (phase 10 not run),
      // don't block sales — enforcement switches on automatically once they are.
      if (rpcErr) break;
      if (!ok) {
        await releaseReserved();
        return reply({
          ok: false,
          error: `Sorry — "${line.name}" doesn't have ${line.quantity} ticket(s) left.`,
        });
      }
      reserved.push({ tier_id: line.tier_id, quantity: line.quantity });
    }

    // 4. Commission = pct + flat-per-ticket (event override → platform default).
    const { data: settings } = await admin
      .from("platform_settings")
      .select("default_commission_pct, default_commission_flat")
      .eq("id", 1)
      .single();
    const pct = Number(event.commission_pct ?? settings?.default_commission_pct ?? 6);
    const flat = Number(event.commission_flat ?? settings?.default_commission_flat ?? 200);
    const feeCents = Math.round(subtotalCents * (pct / 100)) + flat * ticketCount;
    const totalCents = subtotalCents + feeCents;

    // 5. Record the pending transaction (the source of truth for fulfillment).
    const reference = `gk_${crypto.randomUUID().replace(/-/g, "")}`;
    const { error: txnErr } = await admin.from("transactions").insert({
      reference,
      user_id: user.id,
      event_id: eventId,
      status: "pending",
      amount: totalCents,
      platform_fee: feeCents,
      subaccount_code: host.paystack_subaccount_code,
      cart: safeCart,
    });
    if (txnErr) {
      await releaseReserved();
      return reply({ ok: false, error: "Couldn't start checkout. Try again." });
    }

    // 6. Initialize the Paystack transaction with the split.
    //    transaction_charge = our flat cut off the top; bearer "account" means the
    //    platform absorbs Paystack's processing fee, so the host keeps face value.
    const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: totalCents,
        currency: "ZAR",
        reference,
        subaccount: host.paystack_subaccount_code,
        transaction_charge: feeCents,
        bearer: "account",
        metadata: { user_id: user.id, event_id: eventId },
      }),
    });
    const psData = await psRes.json();
    if (!psRes.ok || !psData.status) {
      await releaseReserved();
      await admin.from("transactions").update({ status: "failed" }).eq("reference", reference);
      return reply({ ok: false, error: psData.message ?? "Could not start payment." });
    }

    return reply({
      ok: true,
      authorization_url: psData.data.authorization_url,
      reference,
      amount: totalCents,
    });
  } catch (err) {
    return reply({ ok: false, error: (err as Error).message ?? "Unexpected error." });
  }
});

function reply(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
