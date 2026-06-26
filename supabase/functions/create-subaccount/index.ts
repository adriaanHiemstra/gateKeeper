// =====================================================================
// create-subaccount
// Creates a Paystack subaccount for the signed-in host and saves the resulting
// subaccount code onto their profile. That subaccount is where this host's
// share of every ticket sale settles — the "payout" half of split-at-payment.
//
// percentage_charge is 0 on purpose: the real platform cut (6% + R2) is applied
// per-transaction in the initialize-transaction function (Phase C), because a
// flat-plus-percentage fee can't be expressed as a single subaccount percentage.
//
// Returns 200 with { ok, subaccount_code } on success or { ok:false, error }
// on any handled failure, so the app only ever has to read the JSON body.
// =====================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Identify the caller from their Supabase JWT.
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
    if (!user) {
      return reply({ ok: false, error: "Session expired. Please log in again." });
    }

    // 2. Validate the bank details from the request body.
    const { business_name, settlement_bank, account_number } = await req.json();
    if (!business_name || !settlement_bank || !account_number) {
      return reply({
        ok: false,
        error: "Enter your business name, bank and account number.",
      });
    }

    // 3. Ask Paystack to create the subaccount.
    const psRes = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name,
        settlement_bank,
        account_number,
        percentage_charge: 0, // real cut is set per-transaction in Phase C
      }),
    });

    const psData = await psRes.json();
    if (!psRes.ok || !psData.status) {
      return reply({
        ok: false,
        error: psData.message ?? "Paystack rejected those bank details.",
      });
    }

    const subaccountCode: string = psData.data.subaccount_code;

    // 4. Save the code to the host's profile using the service role (bypasses RLS).
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error: updateError } = await admin
      .from("profiles")
      .update({ paystack_subaccount_code: subaccountCode })
      .eq("id", user.id);

    if (updateError) {
      return reply({
        ok: false,
        error: "Linked on Paystack but couldn't save to your profile. Try again.",
      });
    }

    return reply({ ok: true, subaccount_code: subaccountCode });
  } catch (err) {
    return reply({ ok: false, error: (err as Error).message ?? "Unexpected error." });
  }
});

function reply(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
