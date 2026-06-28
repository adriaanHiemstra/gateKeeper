// =====================================================================
// scan-ticket  (staff door check-in)
// Door staff have no Supabase session, so they can't satisfy the RLS that
// lets a host update tickets. Instead they present their event code with each
// scan and we do the work here with the service role — but ONLY for the event
// that code unlocks, so a code for one event can never admit another's tickets.
//
// The host's own scanning goes straight to the DB (RLS covers them); this
// function is the staff equivalent. Deploy with --no-verify-jwt.
//
// Returns: { result: 'valid' | 'duplicate' | 'wrong_event' | 'unauthorized'
//                   | 'invalid', tier? }
// =====================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { qr_code, code } = await req.json();
    const cleanQr = String(qr_code ?? "").trim().replace(/^#/, "");
    const cleanCode = String(code ?? "").replace(/\D/g, "");
    if (!cleanQr) return reply({ result: "invalid" });
    if (!cleanCode) return reply({ result: "unauthorized" });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Authorize: the code must be active, and it scopes us to ONE event.
    const { data: sc } = await admin
      .from("staff_codes")
      .select("event_id, is_active")
      .eq("code", cleanCode)
      .eq("is_active", true)
      .maybeSingle();
    if (!sc) return reply({ result: "unauthorized" });

    // 2. Find the ticket by its code (with the buyer's name for the door).
    const { data: ticket } = await admin
      .from("tickets")
      .select("id, event_id, status, ticket_tiers ( name ), profiles ( full_name, username )")
      .eq("qr_code", cleanQr)
      .maybeSingle();
    if (!ticket) return reply({ result: "invalid" });

    const tier = (ticket.ticket_tiers as any)?.name ?? "Event Ticket";
    const name =
      (ticket.profiles as any)?.full_name ?? (ticket.profiles as any)?.username ?? "Guest";

    // 3. The ticket must belong to the event this code is for.
    if (ticket.event_id !== sc.event_id) return reply({ result: "wrong_event", tier, name });

    // 4. Atomically claim it: flip 'valid' -> 'scanned'. A row comes back only
    //    if we won the flip, so two doors can't both admit the same ticket.
    const { data: claimed } = await admin
      .from("tickets")
      .update({ status: "scanned" })
      .eq("id", ticket.id)
      .eq("status", "valid")
      .select("id");

    if (claimed && claimed.length > 0) return reply({ result: "valid", tier, name });

    // 5. Didn't claim it — say why.
    if (ticket.status === "scanned" || ticket.status === "used") {
      return reply({ result: "duplicate", tier, name });
    }
    return reply({ result: "invalid", tier, name }); // refunded / cancelled / etc.
  } catch (err) {
    return reply({ result: "error", error: (err as Error).message ?? "Unexpected error." });
  }
});

function reply(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
