// app/lib/eventFilters.ts
//
// Shared "is this event still live" cutoff for the discovery feeds (Home,
// Search, Map). An event should stay discoverable — and therefore buyable —
// for its whole run, not just until its start time. Mirrors the per-row
// check HomeScreen already used for filtering event_updates: an event
// without an explicit end_date is assumed to run 24h from its start.
const IMPLIED_DURATION_MS = 24 * 60 * 60 * 1000;

// A PostgREST `.or()` filter string: true once end_date passes (if set),
// otherwise once 24h after the start (date) has passed.
export function notEndedFilter(now: Date = new Date()): string {
  const nowIso = now.toISOString();
  const impliedCutoffIso = new Date(now.getTime() - IMPLIED_DURATION_MS).toISOString();
  return `end_date.gte.${nowIso},and(end_date.is.null,date.gte.${impliedCutoffIso})`;
}
