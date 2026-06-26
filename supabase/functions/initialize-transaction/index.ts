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
      .select("id, host_id, commission_pct, commission_flat")
      .eq("id", eventId)
      .single();
    if (!event) return reply({ ok: false, error: "Event not found." });

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
    if (txnErr) return reply({ ok: false, error: "Couldn't start checkout. Try again." });

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
