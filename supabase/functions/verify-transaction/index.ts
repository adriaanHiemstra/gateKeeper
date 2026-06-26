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

    // Ask Paystack the real outcome of this transaction.
    const psRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } },
    );
    const psData = await psRes.json();
    const status: string | undefined = psData?.data?.status; // success | failed | abandoned ...

    if (status === "success") {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await fulfillTransaction(admin, reference);
      return reply({ ok: true, status: "success" });
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
