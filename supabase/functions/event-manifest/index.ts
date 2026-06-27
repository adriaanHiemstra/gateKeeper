// =====================================================================
// event-manifest
// Returns the ticket list the scanner caches for OFFLINE check-in: every
// ticket's code + current status for one event. Works for an authenticated
// host (their own event) or for door staff presenting their code. The scanner
// downloads this when it opens (and on reconnect) so it can validate at the
// door with no signal. Deploy with --no-verify-jwt (staff have no token).
//
// Returns: { ok, eventId, tickets: [{ qr_code, status, tier }] }
// =====================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { code, eventId } = await req.json();
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Resolve which event we're allowed to read.
    let authorizedEventId: string | null = null;

    if (code) {
      const cleanCode = String(code).replace(/\D/g, "");
      const { data: sc } = await admin
        .from("staff_codes")
        .select("event_id")
        .eq("code", cleanCode)
        .eq("is_active", true)
        .maybeSingle();
      if (!sc) return reply({ ok: false, error: "Invalid or revoked code." });
      authorizedEventId = sc.event_id;
    } else {
      // Host path: verify their token and that they own the event.
      const authHeader = req.headers.get("Authorization") ?? "";
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (!user || !eventId) return reply({ ok: false, error: "Not authorized." });

      const { data: ev } = await admin
        .from("events")
        .select("id")
        .eq("id", eventId)
        .eq("host_id", user.id)
        .maybeSingle();
      if (!ev) return reply({ ok: false, error: "Not authorized." });
      authorizedEventId = eventId;
    }

    // 2. Pull every ticket for that event.
    const { data: rows, error } = await admin
      .from("tickets")
      .select("qr_code, status, ticket_tiers ( name )")
      .eq("event_id", authorizedEventId);
    if (error) return reply({ ok: false, error: "Could not load tickets." });

    const tickets = (rows ?? []).map((t) => ({
      qr_code: t.qr_code,
      status: t.status,
      tier: (t.ticket_tiers as any)?.name ?? "Event Ticket",
    }));

    return reply({ ok: true, eventId: authorizedEventId, tickets });
  } catch (err) {
    return reply({ ok: false, error: (err as Error).message ?? "Unexpected error." });
  }
});

function reply(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
