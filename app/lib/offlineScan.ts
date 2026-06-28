// =====================================================================
// offlineScan — local cache + write-queue for door check-in
//
// The scanner downloads an event's ticket "manifest" (every code + status)
// when it opens and stores it in AsyncStorage. If the door loses signal, scans
// are validated and claimed against this local copy, and each claim is appended
// to a per-event queue. When connectivity returns, flushQueue() replays the
// queued claims through the normal online scan path so the server catches up.
//
// AsyncStorage (not SQLite) keeps this Expo Go-safe; an event's ticket set is
// small enough to hold in a single JSON blob and look up via an object map.
// =====================================================================
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ScanOutcome =
  | "valid"
  | "duplicate"
  | "invalid"
  | "wrong_event"
  | "unauthorized";

export interface ManifestRow {
  qr_code: string;
  status: string; // 'valid' | 'scanned' | 'refunded' | ...
  tier?: string;
  name?: string;
}

type TicketMap = Record<string, { status: string; tier?: string; name?: string }>;
interface QueuedScan {
  qr_code: string;
  scanned_at: string;
}

const ticketsKey = (eventId: string) => `offline:tickets:${eventId}`;
const queueKey = (eventId: string) => `offline:queue:${eventId}`;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// Save the freshly-downloaded manifest. Any scans still waiting in the queue are
// overlaid as 'scanned' so we don't "forget" an un-synced check-in when we
// refresh from the server.
export async function cacheManifest(eventId: string, rows: ManifestRow[]): Promise<void> {
  const map: TicketMap = {};
  for (const r of rows) map[r.qr_code] = { status: r.status, tier: r.tier, name: r.name };

  const queue = await readJson<QueuedScan[]>(queueKey(eventId), []);
  for (const q of queue) {
    if (map[q.qr_code]) map[q.qr_code].status = "scanned";
  }

  await AsyncStorage.setItem(ticketsKey(eventId), JSON.stringify(map));
}

export async function hasManifest(eventId: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(ticketsKey(eventId));
  return !!raw;
}

// Validate + claim a scan entirely from the local cache (offline path).
export async function validateOffline(
  eventId: string,
  qrRaw: string
): Promise<{ result: ScanOutcome; tier?: string; name?: string }> {
  const qr = qrRaw.trim().replace(/^#/, "");
  const map = await readJson<TicketMap>(ticketsKey(eventId), {});
  const entry = map[qr];

  // Not in this event's manifest → we can't vouch for it offline.
  if (!entry) return { result: "invalid" };
  if (entry.status === "refunded") return { result: "invalid", tier: entry.tier, name: entry.name };
  if (entry.status === "scanned" || entry.status === "used") {
    return { result: "duplicate", tier: entry.tier, name: entry.name };
  }

  // Claim it locally and queue the check-in for sync.
  entry.status = "scanned";
  map[qr] = entry;
  await AsyncStorage.setItem(ticketsKey(eventId), JSON.stringify(map));

  const queue = await readJson<QueuedScan[]>(queueKey(eventId), []);
  queue.push({ qr_code: qr, scanned_at: new Date().toISOString() });
  await AsyncStorage.setItem(queueKey(eventId), JSON.stringify(queue));

  return { result: "valid", tier: entry.tier, name: entry.name };
}

export async function getQueueCount(eventId: string): Promise<number> {
  const queue = await readJson<QueuedScan[]>(queueKey(eventId), []);
  return queue.length;
}

// Replay queued check-ins through the real online scan. `scanFn` performs one
// online scan and resolves with the server's result (or throws on a network
// error, which stops the flush so we retry later). A server 'duplicate' is
// treated as applied — it just means the server already had it.
export async function flushQueue(
  eventId: string,
  scanFn: (qr: string) => Promise<{ result?: string } | void>
): Promise<{ synced: number; remaining: number }> {
  let queue = await readJson<QueuedScan[]>(queueKey(eventId), []);
  if (queue.length === 0) return { synced: 0, remaining: 0 };

  let synced = 0;
  const stillPending: QueuedScan[] = [];

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    try {
      await scanFn(item.qr_code);
      synced++; // applied (valid OR server-side duplicate both count as done)
    } catch {
      // Network error — assume we're offline again; keep this and the rest.
      stillPending.push(...queue.slice(i));
      break;
    }
  }

  await AsyncStorage.setItem(queueKey(eventId), JSON.stringify(stillPending));
  return { synced, remaining: stillPending.length };
}
