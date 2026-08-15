/**
 * Normalized Twitch event shapes broadcast over SSE to the overlay.
 *
 * This is the wire contract between the server proxy and the browser. A copy of
 * this union lives in `src/app/core/model/twitch-event.model.ts` for the client
 * — keep the two in sync by hand. This file has ZERO runtime imports so the
 * boundary with the browser bundle stays clean.
 */
export type NormalizedTwitchEvent =
  | { type: 'follow'; user: string }
  | { type: 'subscribe'; user: string; tier: string; isGift: boolean }
  | { type: 'cheer'; user: string | null; bits: number }
  | { type: 'raid'; from: string; viewers: number }
  | { type: 'stream.online' }
  | { type: 'stream.offline' };
