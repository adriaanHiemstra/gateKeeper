# Spec: Payout Hold + Check-in-Triggered Release

> Status: **draft — awaiting Paystack's reply** (Transfers availability / automation,
> and their guidance on collect-then-payout models) and a regulatory sanity check.
> Nothing in this spec is deployed. Code lives on the `feature/payout-hold` branch.

## Principle
Hold an unproven host's ticket revenue in the platform's Paystack account until
there's **evidence the event actually happened**, then release it automatically via
Paystack Transfers. If the event never happens, the money is still in the platform
account and buyers can be refunded. Trusted hosts keep today's instant split.

This flips the exit-scam economics: a fraudster can't sell tickets, get settled at
purchase time, and vanish before the event date.

## How the money moves — before vs after

| | Today (instant split) | Held mode (new) |
|---|---|---|
| Where funds settle | Host's share → **host's subaccount**; platform keeps `transaction_charge` | **Entire amount → platform account** |
| Host paid | At Paystack settlement (~T+1), *before* the event | *After* the event, via **Paystack Transfer** |
| Refund if no-show | ❌ money already left | ✅ money is held; platform refunds buyers |

The switch is small: for held events, `initialize-transaction` **omits
`subaccount` / `transaction_charge` / `bearer`** from the Paystack init call, so
nothing auto-splits — the platform collects 100% and *owes* the host their share.

## Data model (phase13_payout_hold.sql — written, NOT applied)

**`profiles`** (host):
- `payout_mode text default 'instant'` — `'held' | 'instant'`. *(Spec target is
  default `'held'` for new hosts; shipped as `'instant'` so applying the SQL
  changes nothing until we consciously flip the default / individual hosts.)*
- `paystack_recipient_code text` — Paystack **Transfer recipient** (created once
  from the host's bank details; distinct from the subaccount).
- `events_completed int default 0` — for later auto-tiering to instant.

**`events`**:
- `payout_mode text` — snapshot of the host's mode at event creation (tier changes
  don't affect in-flight events).
- `payout_status text` — `'holding' | 'released' | 'refunded' | 'frozen'` (null for
  instant-mode events).
- `payout_released_at timestamptz`.

**`transactions`**:
- `host_amount integer` — cents owed to the host = `amount − platform_fee`.
- `settlement_mode text default 'split'` — `'split' | 'held'`.

**New `payouts` table** (release ledger):
`id, event_id, host_id, amount (cents), status ('pending'|'processing'|'paid'|'failed'),
paystack_transfer_code, trigger ('checkin'|'scheduled'|'manual'), created_at, paid_at`

## Who's held vs instant
- Target policy: **every new host starts `held`**; move to `instant` via manual
  admin approval, or (Phase 3) automatically after N completed events (e.g. 3) with
  no unresolved disputes + verification.
- Phase 1 ships with everyone `instant` (no behaviour change) and we flip hosts /
  the default deliberately.

## Release logic (the core — Phase 2 evaluator)
A scheduled job (Supabase `pg_cron` or scheduled Edge Function) runs daily over
events in `payout_status = 'holding'` whose date has passed:

```
sold    = successful, non-refunded tickets for the event
scanned = tickets with status 'scanned'          ← existing check-in data

1. Open reports/disputes above threshold      → FREEZE  (manual review)
2. scanned / sold >= 30%                      → RELEASE (check-in proves it happened)
3. now >= event.date + 3 days AND no complaints → RELEASE (legit hosts who don't scan)
4. otherwise                                  → keep holding / manual review
```

Why this works: **hosts who scan get paid within ~a day of the event** (and are
nudged to use the scanner), non-scanning legit hosts get paid at T+3, and ghost
events (0 scans + complaints) stay held and refundable.

Thresholds to tune: check-in ratio (30%?), fallback window (T+3?), dispute threshold.

## Payout execution (Edge Function `release-event-payout` — written, NOT deployed)
Admin-triggered in Phase 1 (manual "Release now"), evaluator-triggered in Phase 2.

1. Sum `host_amount` over the event's `success` (non-refunded) transactions.
2. Ensure the host has a `paystack_recipient_code` (create via `POST /transferrecipient`
   from their bank details, store it).
3. `POST /transfer` for the total; record a `payouts` row; set event
   `payout_status = 'released'`.
4. Handle `transfer.success / transfer.failed / transfer.reversed` webhooks →
   update `payouts` + event status. (Webhook handling = Phase 2; Phase 1 treats an
   accepted transfer as processing and checks the dashboard.)

**Requires from Paystack** (this is what the email is about):
- Transfers enabled on the account, with **automated (no-OTP) transfers**.
- Confirmation that collect-in-full → transfer-later is acceptable on our account
  type for ZAR.
- Transfer fee schedule (factor into unit economics: net from commission or absorb).

## No-show → buyer refunds
Because funds are held, buyer protection becomes real: extend the existing
`refund-transaction` into a platform **bulk refund** for a whole event (ghost event
→ refund every buyer from the held pot; host gets nothing; `payout_status = 'refunded'`).

## UX
- **Host:** per-event payout status (Holding → Released → Paid) in an earnings view
  (this also fills the missing host-earnings-dashboard gap); copy: *"Payouts are
  released after your event — scan tickets at the door to get paid faster."* Show
  the path to instant payouts (verification + track record).
- **Buyer:** event-page trust badge: *"Protected checkout — the host is only paid
  after the event. Full refund if it's cancelled."* Trust + conversion.

## Risks / open questions
- 🔴 **Regulatory (gating):** holding third-party funds may trigger SA
  payment-services / e-money rules. Needs legal advice before enabling. This is the
  go/no-go.
- **Paystack reply pending** — Transfers availability/automation/fees (see above).
- **Host cash-flow friction** — mitigated by the instant tier and, if needed, a
  partial-reserve variant (hold only X%, split the rest at purchase).
- **Edge cases:** pre-event refunds reduce the held balance; multi-day events need
  an end date; free events skip entirely; disputed event dates need a host path.
- Subaccount vs recipient: held-mode hosts technically don't need a subaccount, but
  PayoutsSetup already collects bank details — reuse them to create the transfer
  recipient.

## Phased rollout
- **Phase 1 (this branch):** schema (`phase13`, inert defaults) + held branch in
  `initialize-transaction` (only activates for `payout_mode='held'` hosts; fail-open
  if schema absent) + `payouts` table + manual admin `release-event-payout`.
  **Not deployed / not applied** until Paystack + legal are green.
- **Phase 2:** automated evaluator (check-in ratio + T+N + disputes), transfer
  webhooks, host payout dashboard.
- **Phase 3:** trust tiers + auto-instant, buyer-protection messaging on event
  pages, report/dispute flow, partial reserve.

## Decisions needed
1. Full hold or partial reserve (%)?
2. Release thresholds: check-in % (default 30%) and fallback window (default T+3)?
3. Held-by-default from day one, or manual per-host flag to start?
4. Regulatory posture — confirm we may hold funds (legal check).
5. Paystack Transfers confirmed on our account (awaiting reply).
