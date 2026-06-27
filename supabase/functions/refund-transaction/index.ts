// =====================================================================
// refund-transaction  (host-initiated full refund)
// A host refunds a whole order (one Paystack transaction = one purchase, which
// may hold several tickets). We verify the caller actually owns the event,
// issue a FULL refund through Paystack, then flip the transaction and all its
// tickets to 'refunded' — which the scanner already rejects. Idempotent.
//
// Authenticated host call → deploy with default verify_jwt (true).
// =====================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. Who's asking?
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return reply({ ok: false, error: "Not signed in." });

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return reply({ ok: false, error: "Session expired. Please log in again." });

    const { reference } = await req.json();
    if (!reference) return reply({ ok: false, error: "Missing order reference." });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 2. Load the order and prove this host owns its event.
    const { data: txn } = await admin
      .from("transactions")
      .select("id, reference, event_id, status, events ( host_id )")
      .eq("reference", reference)
      .single();
    if (!txn) return reply({ ok: false, error: "Order not found." });
    if ((txn.events as any)?.host_id !== user.id) {
      return reply({ ok: false, error: "You don't have permission to refund this order." });
    }

    // 3. Already refunded? Nothing to do (idempotent).
    if (txn.status === "refunded") return reply({ ok: true, status: "refunded", already: true });
    if (txn.status !== "success") {
      return reply({ ok: false, error: "Only a paid order can be refunded." });
    }

    // 4. Issue a FULL refund through Paystack (omit amount = full).
    const psRes = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transaction: reference }),
    });
    const psData = await psRes.json();
    if (!psRes.ok || !psData.status) {
      return reply({ ok: false, error: psData.message ?? "Paystack refused the refund." });
    }

    // 5. Reflect it locally: the order and every ticket on it become 'refunded'.
    //    (Paystack settles the money asynchronously; our records flip now so the
    //    tickets stop working immediately.)
    await admin.from("transactions")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("id", txn.id);
    await admin.from("tickets")
      .update({ status: "refunded" })
      .eq("payment_reference", reference);

    return reply({ ok: true, status: "refunded" });
  } catch (err) {
    return reply({ ok: false, error: (err as Error).message ?? "Unexpected error." });
  }
});

function reply(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
