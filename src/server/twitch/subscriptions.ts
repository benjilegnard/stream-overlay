import type { NormalizedTwitchEvent } from './events';

/**
 * An EventSub subscription to create, plus how to normalize its notifications.
 *
 * `condition` is built from the broadcaster id. `normalize` maps Twitch's raw
 * `event` payload to our minimal wire shape (or null to drop it).
 */
export interface SubscriptionDef {
  type: string;
  version: string;
  condition: Record<string, string>;
  normalize: (event: Record<string, unknown>) => NormalizedTwitchEvent | null;
}

const str = (event: Record<string, unknown>, key: string): string => String(event[key] ?? '');
const num = (event: Record<string, unknown>, key: string): number => Number(event[key] ?? 0);

/**
 * The subscriptions we create on every session. Required OAuth scopes (granted
 * once via the bootstrap script):
 *   - moderator:read:followers   → channel.follow
 *   - channel:read:subscriptions → channel.subscribe / .subscription.message / .gift
 *   - bits:read                  → channel.cheer
 *   - (none)                     → channel.raid, stream.online/offline
 */
export function buildSubscriptions(broadcasterUserId: string): SubscriptionDef[] {
  const broadcaster = { broadcaster_user_id: broadcasterUserId };
  return [
    {
      type: 'stream.online',
      version: '1',
      condition: { ...broadcaster },
      normalize: () => ({ type: 'stream.online' }),
    },
    {
      type: 'stream.offline',
      version: '1',
      condition: { ...broadcaster },
      normalize: () => ({ type: 'stream.offline' }),
    },
    {
      type: 'channel.raid',
      version: '1',
      condition: { to_broadcaster_user_id: broadcasterUserId },
      normalize: (event) => ({
        type: 'raid',
        from: str(event, 'from_broadcaster_user_name'),
        viewers: num(event, 'viewers'),
      }),
    },
    {
      type: 'channel.follow',
      version: '2',
      // channel.follow v2 requires the moderator_user_id in the condition.
      condition: { ...broadcaster, moderator_user_id: broadcasterUserId },
      normalize: (event) => ({ type: 'follow', user: str(event, 'user_name') }),
    },
    {
      type: 'channel.subscribe',
      version: '1',
      condition: { ...broadcaster },
      normalize: (event) => ({
        type: 'subscribe',
        user: str(event, 'user_name'),
        tier: str(event, 'tier'),
        isGift: Boolean(event['is_gift']),
      }),
    },
    {
      type: 'channel.subscription.message',
      version: '1',
      condition: { ...broadcaster },
      normalize: (event) => ({
        type: 'subscribe',
        user: str(event, 'user_name'),
        tier: str(event, 'tier'),
        isGift: false,
      }),
    },
    {
      type: 'channel.subscription.gift',
      version: '1',
      condition: { ...broadcaster },
      normalize: (event) => ({
        type: 'subscribe',
        user: event['is_anonymous'] ? 'Anonymous' : str(event, 'user_name'),
        tier: str(event, 'tier'),
        isGift: true,
      }),
    },
    {
      type: 'channel.cheer',
      version: '1',
      condition: { ...broadcaster },
      normalize: (event) => ({
        type: 'cheer',
        user: event['is_anonymous'] ? null : str(event, 'user_name'),
        bits: num(event, 'bits'),
      }),
    },
  ];
}
