// =====================================================================
// verify-transaction
// The app calls this right after the user returns from the Paystack checkout.
// It asks Paystack for the REAL status (never trusts the client) and, if the
// charge succeeded, mints the tickets via the shared idempotent fulfiller.
// =====================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { fulfillTransaction } from "../_shared/fulfill.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { reference } = await req.json();
    if (!reference) return reply({ ok: false, error: "Missing reference." });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Ask Paystack the real outcome of this transaction.
    const psRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } },
    );
    const psData = await psRes.json();
    const status: string | undefined = psData?.data?.status; // success | failed | abandoned ...

    if (status === "success") {
      await fulfillTransaction(admin, reference);
      return reply({ ok: true, status: "success" });
    }

    // Confirmed NOT successful → hand the reserved seats back (once, only while
    // still pending) so a declined/abandoned attempt doesn't keep tickets off sale.
    if (status === "failed" || status === "abandoned") {
      const { data: txn } = await admin
        .from("transactions")
        .select("id, status, cart")
        .eq("reference", reference)
        .maybeSingle();
      if (txn && txn.status === "pending") {
        for (const item of txn.cart as Array<{ tier_id: string; quantity: number }>) {
          await admin.rpc("release_tier", { p_tier_id: item.tier_id, p_qty: item.quantity });
        }
        await admin.from("transactions").update({ status }).eq("id", txn.id);
      }
    }

    return reply({ ok: true, status: status ?? "pending" });
  } catch (err) {
    return reply({ ok: false, error: (err as Error).message ?? "Unexpected error." });
  }
});

function reply(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
