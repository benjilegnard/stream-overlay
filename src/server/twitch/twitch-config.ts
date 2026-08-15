/**
 * Server-only Twitch configuration. Reads secrets from `process.env`.
 *
 * NOTHING here may ever be imported (transitively) from `src/main.ts` — these
 * values (client secret, refresh token) must never reach the browser bundle.
 */
export interface TwitchConfig {
  clientId: string;
  clientSecret: string;
  /** Numeric Twitch user id of the broadcaster (NOT the login name). */
  broadcasterUserId: string;
  /** Seed refresh token from env; the rotated one is persisted to a file. */
  refreshToken: string;
  /** Path where the rotated refresh token is persisted between restarts. */
  refreshTokenFile: string;
}

/** Reads the Twitch config from the environment. */
export function readTwitchConfig(): TwitchConfig {
  return {
    clientId: process.env['TWITCH_CLIENT_ID'] ?? '',
    clientSecret: process.env['TWITCH_CLIENT_SECRET'] ?? '',
    broadcasterUserId: process.env['TWITCH_BROADCASTER_ID'] ?? '',
    refreshToken: process.env['TWITCH_REFRESH_TOKEN'] ?? '',
    refreshTokenFile: process.env['TWITCH_REFRESH_TOKEN_FILE'] ?? '.twitch-refresh-token',
  };
}

/** True only when every value needed to talk to Twitch is present. */
export function isTwitchConfigured(config: TwitchConfig): boolean {
  return Boolean(
    config.clientId && config.clientSecret && config.broadcasterUserId && config.refreshToken,
  );
}
