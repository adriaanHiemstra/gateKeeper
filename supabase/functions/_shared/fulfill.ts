import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Marks a transaction paid and mints its tickets — exactly once.
// Called by BOTH verify-transaction (when the app returns from checkout) and
// paystack-webhook (server-to-server), so it must be safe to run twice for the
// same reference. The transaction row we wrote at checkout is the source of
// truth for who bought what — we never trust amounts coming back from outside.
export async function fulfillTransaction(
  admin: SupabaseClient,
  reference: string,
) {
  // 1. Find the pending transaction we created when checkout started.
  const { data: txn, error: txnErr } = await admin
    .from("transactions")
    .select("id, user_id, event_id, status, cart")
    .eq("reference", reference)
    .single();

  if (txnErr || !txn) return { ok: false, error: "Unknown transaction reference." };

  // 2. Already fulfilled? Nothing to do (idempotent).
  if (txn.status === "success") return { ok: true, already: true };

  // 3. Guard against a double-mint if tickets already exist for this reference.
  const { count } = await admin
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("payment_reference", reference);

  if (!count) {
    // 4. One ticket row per quantity, across every line in the cart.
    const rows: Record<string, unknown>[] = [];
    let n = 0;
    for (const item of txn.cart as Array<{ tier_id: string; quantity: number }>) {
      for (let i = 0; i < item.quantity; i++) {
        rows.push({
          event_id: txn.event_id,
          user_id: txn.user_id,
          tier_id: item.tier_id,
          qr_code: `GK-${reference}-${n++}`,
          status: "valid",
          purchased_at: new Date().toISOString(),
          payment_reference: reference,
        });
      }
    }
    if (rows.length) {
      const { error: insErr } = await admin.from("tickets").insert(rows);
      if (insErr) return { ok: false, error: "Failed to create tickets." };
    }
  }

  // 5. Flip the transaction to success.
  await admin
    .from("transactions")
    .update({ status: "success", updated_at: new Date().toISOString() })
    .eq("id", txn.id);

  return { ok: true };
}
