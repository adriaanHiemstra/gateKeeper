# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

GateKeeper — a South African social event-ticketing app (discover events, see which
friends are going, buy tickets, QR check-in at the door; hosts create/sell/promote
events and scan tickets). React Native + **Expo SDK 54, running in Expo Go** — do not
add libraries that require a custom native build (no `expo-notifications` push, no
advanced `react-native-maps` features) until the planned dev-build migration.

Backend is **Supabase** (project ref `dkhwiqdpbnubllcfvfgm`): Postgres + RLS, Auth,
and Deno Edge Functions in `supabase/functions/`. Payments are **Paystack**
(test mode; secrets in `.env` and in Supabase function secrets — never hardcode).

## Commands

```bash
npm install                # deps (fixes most "module not found" VS Code errors)
npx expo start -c          # run in Expo Go; -c clears stale bundles (often needed)
npx tsc --noEmit           # typecheck — the only "test" this repo has; keep it at 0 errors

# Edge Functions (CLI is linked + authed):
supabase functions deploy <name> --project-ref dkhwiqdpbnubllcfvfgm
#   add --no-verify-jwt ONLY for: paystack-webhook, staff-login, scan-ticket, event-manifest
supabase functions list --project-ref dkhwiqdpbnubllcfvfgm

# Apply SQL phases to the remote DB (no dashboard needed):
supabase db query --linked -f supabase/phaseN_*.sql
supabase db query --linked "select ..."   # ad-hoc queries / verification
```

There is no test suite, linter config, or CI. Verification = `tsc`, manual runs in
Expo Go, and curl smoke-tests against deployed functions (`set -a; source .env` then
curl `$SUPABASE_URL/...` with `$SUPABASE_SERVICE_KEY`).

**Gotcha:** Edge Function deploys are global, not git-branch-scoped — deploying from
a feature branch changes production behaviour immediately. Schema/function changes on
unmerged branches must stay undeployed/unapplied (see `feature/payout-hold`).

## Architecture

### Money flow (the core invariant chain)
1. `PurchaseTicketScreen` sends only `{ tier_id, quantity }` — **never prices**.
2. `initialize-transaction` (Edge Fn) prices the cart from `ticket_tiers` server-side,
   applies the buyer-pays commission (default **6% + R2/ticket** from
   `platform_settings`, overridable per-event via `events.commission_pct/_flat`),
   atomically reserves capacity via the `reserve_tier`/`release_tier` RPCs
   (service-role-only; fail-open if absent), inserts a `pending` row in
   `transactions` (the source of truth: `cart` jsonb, amounts in **cents**), and
   starts a Paystack checkout with split-at-payment (`subaccount` +
   `transaction_charge`, `bearer: "account"` → host keeps face value).
3. Buyer pays on Paystack's hosted page (opened with `expo-web-browser`; test mode
   shows a Success/Decline simulator, not a card form).
4. Fulfillment is **idempotent and server-side only**: both `verify-transaction`
   (app calls on return) and `paystack-webhook` (HMAC-SHA512-verified) call
   `_shared/fulfill.ts`, which mints tickets (`qr_code = GK-<reference>-<n>`) exactly
   once per `payment_reference`. Failed/abandoned checkouts release reserved seats;
   stale pending holds are swept after 20 min.
5. `refund-transaction` (host-authenticated, ownership-checked) issues full Paystack
   refunds and flips the order + its tickets to `refunded`.

**Security invariant: there is NO client INSERT policy on `tickets` or
`transactions`.** Only Edge Functions (service role) write them. Never re-add a
client-side ticket insert or a permissive RLS policy — that reopens the free-ticket
hole this design closed.

### Scanning / check-in
Two auth paths converge in `ScanTicketsScreen`:
- **Host** (signed in): atomic claim directly on the DB —
  `update tickets set status='scanned' where qr_code=? and status='valid'` +
  `.select()` — only a returned row means "admit" (kills double-scan races and
  RLS-blocked false positives). QR codes contain lowercase UUIDs: **never uppercase
  scanned input**.
- **Door staff** (no Supabase account): log in with a 6-digit code from
  `staff_codes` (Team Access screen); `staff-login` resolves the code to one event,
  `scan-ticket` authorizes each scan server-side, scoped to that event.

Offline check-in (`app/lib/offlineScan.ts`): `event-manifest` pre-downloads the
event's tickets into AsyncStorage; offline scans validate/claim locally and queue;
NetInfo reconnect replays the queue through the normal online path. Works only for
event-scoped scans. A DB trigger stamps `scanned_at`/`scanned_by` (and clears them
on un-check-in).

### Database migrations
`supabase/phase1..N_*.sql` — sequential, idempotent (safe to re-run), applied
manually via `supabase db query --linked -f`. There is no migration tracking: check
`pg_policies` / `pg_indexes` / column existence to see what's applied. New schema
work = next `phaseN` file. **Ordering gotcha:** later phases can redefine earlier
triggers/functions (phase8 vs phase11) — re-apply the newest definition last.
Phase13 (payout hold) exists but is deliberately **unapplied** pending Paystack/legal
(spec: `docs/payout-hold-spec.md`).

### App structure
- `app/navigation/AppNavigator.tsx` + `app/types/types.ts` (`RootStackParamList`) —
  every screen/param; buyer screens in `app/screens/`, host screens in
  `app/screens/HostScreens/` (fire-orange vs electric-purple theming from
  `app/styles/colours.ts`, gradients over `#121212`, NativeWind classes + `Jost` font).
- `app/lib/supabase.ts` — the client (anon key, AsyncStorage sessions).
- Feed ranking and friends features are client-side over Supabase queries/RPC.
- `tsconfig.json` **excludes `supabase/functions`** (Deno code) — don't "fix" Deno
  imports to satisfy the RN typechecker.
- `website/` — static one-page marketing site (plain HTML/CSS, deployed to Vercel);
  unrelated to the Expo bundle.

### Branch workflow
Feature branches off `main` (`fix/...`, `feature/...`), merged with `--no-ff` after
`tsc` passes. A collaborator (Suhayl) works on `Suhayl-N` branches — coordinate
merges; his PRs have previously conflicted in `PurchaseTicketScreen.tsx` (keep the
server-side checkout flow).
