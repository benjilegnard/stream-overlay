import { readFile, rename, writeFile } from 'node:fs/promises';

import type { TwitchConfig } from './twitch-config';

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
/** Refresh a bit before the real expiry to avoid racing a 401. */
const EXPIRY_SLACK_MS = 60_000;

/** Thrown when the refresh token is rejected — re-run the bootstrap script. */
export class TwitchAuthError extends Error {}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Holds the user access token and keeps it fresh from the rotating refresh
 * token. The refresh token is seeded from the persisted file (falling back to
 * the env value) and re-persisted whenever Twitch rotates it.
 */
export class TwitchTokenManager {
  private accessToken: string | null = null;
  private expiresAt = 0;
  private refreshToken: string;
  private refreshTokenLoaded = false;
  private inFlight: Promise<string> | null = null;

  constructor(private readonly config: TwitchConfig) {
    this.refreshToken = config.refreshToken;
  }

  /** Returns a valid access token, refreshing if it is missing or near expiry. */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.expiresAt - EXPIRY_SLACK_MS) {
      return this.accessToken;
    }
    return this.refresh();
  }

  /**
   * Performs an authenticated Helix request, injecting the bearer token and
   * client id. On a 401 it forces a single refresh and retries once.
   */
  async authedFetch(url: string, init: RequestInit = {}): Promise<Response> {
    const send = async () => {
      const token = await this.getAccessToken();
      return fetch(url, {
        ...init,
        headers: {
          ...init.headers,
          Authorization: `Bearer ${token}`,
          'Client-Id': this.config.clientId,
        },
      });
    };

    let response = await send();
    if (response.status === 401) {
      await this.refresh();
      response = await send();
    }
    return response;
  }

  /** Refreshes the access token, deduping concurrent callers. */
  private refresh(): Promise<string> {
    if (this.inFlight) {
      return this.inFlight;
    }
    this.inFlight = this.doRefresh().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async doRefresh(): Promise<string> {
    await this.loadPersistedRefreshToken();

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (response.status === 400 || response.status === 401) {
      throw new TwitchAuthError(
        'Twitch refresh token was rejected (invalid_grant). Re-run scripts/twitch-bootstrap.ts to obtain a new one.',
      );
    }
    if (!response.ok) {
      throw new Error(`Twitch token refresh failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as TokenResponse;
    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;

    if (data.refresh_token && data.refresh_token !== this.refreshToken) {
      this.refreshToken = data.refresh_token;
      await this.persistRefreshToken(data.refresh_token);
    }

    return this.accessToken;
  }

  /** Reads the persisted (rotated) refresh token once, preferring it over env. */
  private async loadPersistedRefreshToken(): Promise<void> {
    if (this.refreshTokenLoaded) {
      return;
    }
    this.refreshTokenLoaded = true;
    try {
      const persisted = (await readFile(this.config.refreshTokenFile, 'utf8')).trim();
      if (persisted) {
        this.refreshToken = persisted;
      }
    } catch {
      // No persisted token yet — the env seed value stands.
    }
  }

  /** Atomically persists the rotated refresh token (write temp + rename). */
  private async persistRefreshToken(token: string): Promise<void> {
    const tmp = `${this.config.refreshTokenFile}.tmp`;
    try {
      await writeFile(tmp, token, { mode: 0o600 });
      await rename(tmp, this.config.refreshTokenFile);
    } catch (err) {
      // Read-only FS (e.g. serverless): keep the rotated token in memory and log
      // it so it can be re-seeded manually.
      console.warn(
        `[twitch] could not persist rotated refresh token (${(err as Error).message}); new token: ${token}`,
      );
    }
  }
}
