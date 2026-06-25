// app/lib/feedAlgorithm.ts
//
// Client-side ranking for the Home feed.
// We pull a pool of upcoming events from Supabase, then score each one for THIS
// user so the most relevant events float to the top of the TikTok-style feed.
//
// This runs on the phone (no extra database setup needed). If the app grows to
// thousands of events, this same scoring logic can be moved into a Postgres RPC
// function later (like the `get_event_friends` function the cards already use).

export type ScoreContext = {
  // Category names the user follows, lower-cased (from profiles.interests).
  interests: string[];
  // eventId -> number of the user's friends who are GOING / interested.
  friendIntentByEvent: Record<string, number>;
  // Events the user has already opened — used to keep the feed feeling fresh.
  seenEventIds: Set<string>;
};

// How much each signal is worth. Tweak these to change the feed's "personality".
const WEIGHTS = {
  interestMatch: 12, // per category the event shares with the user's interests
  friendGoing: 20, // per friend attending (capped below)
  maxFriends: 5, // stop counting friends past this many
  boosted: 15, // paid promotion, while still active
  soon: 8, // happening within 7 days
  upcoming: 4, // happening within 30 days
  alreadySeen: -6, // gently demote events the user already opened
};

export const scoreEvent = (event: any, ctx: ScoreContext): number => {
  let score = 0;
  const now = Date.now();

  // 1. Interest match — the strongest "would this user like it?" signal.
  const cats: string[] = Array.isArray(event.categories) ? event.categories : [];
  const matches = cats.filter((c) =>
    ctx.interests.includes(String(c).toLowerCase()),
  );
  score += matches.length * WEIGHTS.interestMatch;

  // 2. Friends going — social proof. Capped so one viral event doesn't dominate.
  const friendCount = ctx.friendIntentByEvent[event.id] || 0;
  score += Math.min(friendCount, WEIGHTS.maxFriends) * WEIGHTS.friendGoing;

  // 3. Boosted events (paid) — but only while the boost is still active.
  const boostActive =
    event.is_boosted &&
    (!event.boosted_until ||
      new Date(event.boosted_until).getTime() > now);
  if (boostActive) score += WEIGHTS.boosted;

  // 4. Recency — nudge events that are happening soon.
  const daysAway = (new Date(event.date).getTime() - now) / (1000 * 60 * 60 * 24);
  if (daysAway >= 0 && daysAway <= 7) score += WEIGHTS.soon;
  else if (daysAway > 7 && daysAway <= 30) score += WEIGHTS.upcoming;

  // 5. Freshness — slightly demote events the user has already tapped into.
  if (ctx.seenEventIds.has(event.id)) score += WEIGHTS.alreadySeen;

  // 6. Tiny jitter so equally-scored events don't always appear in the same order.
  score += Math.random() * 2;

  return score;
};

// Returns a NEW array of events sorted from most to least relevant.
export const rankEvents = (events: any[], ctx: ScoreContext): any[] => {
  return [...events]
    .map((e) => ({ ...e, _score: scoreEvent(e, ctx) }))
    .sort((a, b) => b._score - a._score);
};
