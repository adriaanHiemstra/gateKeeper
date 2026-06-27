// =====================================================================
// staff-login
// Door staff don't have Supabase accounts — they log in with a 6-digit code
// the host generated for one event (Team Access). This validates that code
// server-side (service role, so staff_codes is never exposed to the client)
// and returns which event the code unlocks, so the app can scope the scanner
// and show the event name. Deploy with --no-verify-jwt (staff have no token).
// =====================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { code } = await req.json();
    const cleanCode = String(code ?? "").replace(/\D/g, ""); // digits only
    if (cleanCode.length === 0) return reply({ ok: false, error: "Enter a code." });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Match an ACTIVE code and pull the event it belongs to.
    const { data: sc } = await admin
      .from("staff_codes")
      .select("id, role, event_id, events ( title )")
      .eq("code", cleanCode)
      .eq("is_active", true)
      .maybeSingle();

    if (!sc) return reply({ ok: false, error: "Invalid or revoked code." });

    return reply({
      ok: true,
      eventId: sc.event_id,
      eventName: (sc.events as any)?.title ?? "Your Event",
      role: sc.role ?? "door",
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
