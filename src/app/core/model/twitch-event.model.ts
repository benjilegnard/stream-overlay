/**
 * Normalized Twitch events the overlay receives over SSE from the server proxy.
 *
 * This mirrors `src/server/twitch/events.ts` (the server's wire shape) — keep
 * the two in sync by hand.
 */
export type NormalizedTwitchEvent =
  | { type: 'follow'; user: string }
  | { type: 'subscribe'; user: string; tier: string; isGift: boolean }
  | { type: 'cheer'; user: string | null; bits: number }
  | { type: 'raid'; from: string; viewers: number }
  | { type: 'stream.online' }
  | { type: 'stream.offline' };
