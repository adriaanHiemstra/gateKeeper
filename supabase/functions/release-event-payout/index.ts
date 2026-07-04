// =====================================================================
// release-event-payout  (Phase 1: manual admin release — see docs/payout-hold-spec.md)
// Pays a held event's host their share AFTER the event, via Paystack Transfers.
// ⚠️ NOT deployed until Paystack Transfers are confirmed on the account and the
// regulatory check clears. Deploy with default verify_jwt (admin is signed in).
//
// Flow: admin calls with { eventId } (optionally bank details for first-time
// recipients) → we sum host_amount over the event's successful held orders,
// ensure a transfer recipient exists, POST /transfer, and record the ledger row.
// Idempotent: an event already released/refunded/frozen is refused.
// =====================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
// Comma-separated auth.users ids allowed to trigger releases (platform admins).
const ADMIN_IDS = (Deno.env.get("PAYOUT_ADMIN_IDS") ?? "").split(",").map((s) => s.trim());

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. Only a platform admin may move held money.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return reply({ ok: false, error: "Not signed in." });
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || !ADMIN_IDS.includes(user.id)) {
      return reply({ ok: false, error: "Not authorized." });
    }

    const { eventId, bank } = await req.json(); // bank?: { account_number, bank_code, name }
    if (!eventId) return reply({ ok: false, error: "Missing eventId." });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 2. Load the event; it must be in the holding lifecycle.
    const { data: event } = await admin
      .from("events")
      .select("id, host_id, title, payout_status")
      .eq("id", eventId)
      .single();
    if (!event) return reply({ ok: false, error: "Event not found." });
    if (event.payout_status !== "holding") {
      return reply({ ok: false, error: `Event is '${event.payout_status}', not 'holding'.` });
    }

    // 3. What we owe: face value of every successful, non-refunded held order.
    const { data: orders } = await admin
      .from("transactions")
      .select("host_amount")
      .eq("event_id", eventId)
      .eq("settlement_mode", "held")
      .eq("status", "success");
    const totalCents = (orders ?? []).reduce((s, o) => s + (o.host_amount ?? 0), 0);
    if (totalCents <= 0) return reply({ ok: false, error: "Nothing to release." });

    // 4. Ensure the host has a Paystack transfer recipient.
    const { data: host } = await admin
      .from("profiles")
      .select("paystack_recipient_code, full_name")
      .eq("id", event.host_id)
      .single();
    let recipient = host?.paystack_recipient_code;
    if (!recipient) {
      if (!bank?.account_number || !bank?.bank_code) {
        return reply({
          ok: false,
          error: "Host has no transfer recipient yet — pass bank { account_number, bank_code, name }.",
        });
      }
      const rcRes = await fetch("https://api.paystack.co/transferrecipient", {
        method: "POST",
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "basa", // South African bank account
          name: bank.name ?? host?.full_name ?? "GateKeeper host",
          account_number: bank.account_number,
          bank_code: bank.bank_code,
          currency: "ZAR",
        }),
      });
      const rcData = await rcRes.json();
      recipient = rcData?.data?.recipient_code;
      if (!rcRes.ok || !recipient) {
        return reply({ ok: false, error: rcData.message ?? "Couldn't create transfer recipient." });
      }
      await admin.from("profiles")
        .update({ paystack_recipient_code: recipient })
        .eq("id", event.host_id);
    }

    // 5. Ledger first (status pending), then initiate the transfer.
    const { data: payout, error: payErr } = await admin
      .from("payouts")
      .insert({
        event_id: eventId,
        host_id: event.host_id,
        amount: totalCents,
        status: "pending",
        trigger: "manual",
      })
      .select("id")
      .single();
    if (payErr || !payout) return reply({ ok: false, error: "Couldn't record the payout." });

    const trRes = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "balance",
        amount: totalCents,
        currency: "ZAR",
        recipient,
        reason: `GateKeeper payout: ${event.title}`,
        reference: `gkpo_${payout.id}`,
      }),
    });
    const trData = await trRes.json();
    if (!trRes.ok || !trData.status) {
      await admin.from("payouts").update({ status: "failed" }).eq("id", payout.id);
      return reply({ ok: false, error: trData.message ?? "Paystack refused the transfer." });
    }

    // 6. Mark processing (Phase 2 webhooks flip it to paid) + release the event.
    await admin.from("payouts")
      .update({ status: "processing", paystack_transfer_code: trData.data?.transfer_code ?? null })
      .eq("id", payout.id);
    await admin.from("events")
      .update({ payout_status: "released", payout_released_at: new Date().toISOString() })
      .eq("id", eventId);

    return reply({ ok: true, amount: totalCents, transfer_code: trData.data?.transfer_code });
  } catch (err) {
    return reply({ ok: false, error: (err as Error).message ?? "Unexpected error." });
  }
});

function reply(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
