import { EventSubClient } from './eventsub-client';
import { SseBroadcaster } from './sse-broadcaster';
import { TwitchTokenManager } from './token-manager';
import { isTwitchConfigured, readTwitchConfig } from './twitch-config';

let broadcaster: SseBroadcaster | null = null;

/**
 * Boots the Twitch integration once and returns the SSE broadcaster the SSE
 * route writes through. Idempotent — repeated calls return the same broadcaster.
 *
 * Any failure here only disables the Twitch feature; it must never break SSR
 * rendering, so the broadcaster is always returned (it simply stays silent if
 * Twitch can't connect).
 */
export function startTwitch(): SseBroadcaster {
  if (broadcaster) {
    return broadcaster;
  }
  broadcaster = new SseBroadcaster();

  try {
    const config = readTwitchConfig();
    if (!isTwitchConfigured(config)) {
      console.warn(
        '[twitch] integration disabled: missing TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET / TWITCH_BROADCASTER_ID / TWITCH_REFRESH_TOKEN.',
      );
      return broadcaster;
    }

    const tokens = new TwitchTokenManager(config);
    const client = new EventSubClient(tokens, broadcaster, config.broadcasterUserId);
    client.start();
    console.log('[twitch] EventSub client started.');
  } catch (err) {
    console.error('[twitch] failed to start integration:', err);
  }

  return broadcaster;
}
