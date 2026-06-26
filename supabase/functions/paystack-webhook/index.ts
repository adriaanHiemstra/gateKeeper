// =====================================================================
// paystack-webhook
// Server-to-server safety net. Paystack POSTs here the moment a charge
// succeeds, so tickets get minted even if the buyer closed the app before the
// verify step ran. Must be deployed with --no-verify-jwt (Paystack has no
// Supabase token); instead we authenticate the request by verifying Paystack's
// HMAC-SHA512 signature against the raw body.
// =====================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";
import { fulfillTransaction } from "../_shared/fulfill.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

Deno.serve(async (req) => {
  try {
    const raw = await req.text();

    // 1. Prove the request really came from Paystack.
    const signature = req.headers.get("x-paystack-signature");
    const expected = createHmac("sha512", PAYSTACK_SECRET).update(raw).digest("hex");
    if (!signature || signature !== expected) {
      return new Response("Invalid signature", { status: 401 });
    }

    // 2. Mint tickets on a successful charge (idempotent — safe on retries).
    const event = JSON.parse(raw);
    if (event?.event === "charge.success") {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await fulfillTransaction(admin, event.data.reference);
    }

    // Always 200 quickly so Paystack doesn't keep retrying.
    return new Response("ok", { status: 200 });
  } catch {
    return new Response("error", { status: 200 });
  }
});
