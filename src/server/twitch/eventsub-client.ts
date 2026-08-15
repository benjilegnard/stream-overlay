import type { SseBroadcaster } from './sse-broadcaster';
import { buildSubscriptions, type SubscriptionDef } from './subscriptions';
import { TwitchAuthError, type TwitchTokenManager } from './token-manager';

const EVENTSUB_URL = 'wss://eventsub.wss.twitch.tv/ws';
const HELIX_SUBSCRIPTIONS_URL = 'https://api.twitch.tv/helix/eventsub/subscriptions';
const MAX_BACKOFF_MS = 30_000;
/** Slack added to the server's keepalive timeout before we assume a dead socket. */
const KEEPALIVE_SLACK_MS = 10_000;
/** How many recent message ids to remember for dedupe. */
const SEEN_IDS_LIMIT = 200;

interface EventSubMessage {
  metadata: {
    message_id: string;
    message_type:
      | 'session_welcome'
      | 'session_keepalive'
      | 'notification'
      | 'session_reconnect'
      | 'revocation';
    subscription_type?: string;
  };
  payload: {
    session?: { id: string; keepalive_timeout_seconds: number; reconnect_url?: string };
    subscription?: { type: string };
    event?: Record<string, unknown>;
  };
}

/**
 * Connects to Twitch EventSub over a WebSocket, creates the channel
 * subscriptions for each session, and forwards normalized notifications to the
 * SSE broadcaster. Handles keepalive watchdog, session reconnect, and
 * reconnection with exponential backoff.
 */
export class EventSubClient {
  private socket: WebSocket | null = null;
  private sessionId: string | null = null;
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private backoffMs = 1_000;
  private intentionalClose = false;
  private stopped = false;
  private readonly seenIds = new Set<string>();
  private readonly subscriptions: SubscriptionDef[];
  private readonly byType: Map<string, SubscriptionDef>;

  constructor(
    private readonly tokens: TwitchTokenManager,
    private readonly broadcaster: SseBroadcaster,
    broadcasterUserId: string,
  ) {
    this.subscriptions = buildSubscriptions(broadcasterUserId);
    this.byType = new Map(this.subscriptions.map((sub) => [sub.type, sub]));
  }

  /** Opens the connection. Safe to call once. */
  start(): void {
    this.stopped = false;
    this.connect(EVENTSUB_URL);
  }

  /** Permanently stops the client (no further reconnects). */
  stop(): void {
    this.stopped = true;
    this.intentionalClose = true;
    this.clearWatchdog();
    this.socket?.close();
    this.socket = null;
  }

  private connect(url: string): void {
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.addEventListener('message', (event) => {
      this.handleMessage(socket, event.data as string);
    });
    socket.addEventListener('error', () => {
      // The 'close' handler drives reconnection.
    });
    socket.addEventListener('close', () => {
      if (this.socket === socket && !this.intentionalClose && !this.stopped) {
        this.scheduleReconnect();
      }
    });
  }

  private handleMessage(socket: WebSocket, raw: string): void {
    let message: EventSubMessage;
    try {
      message = JSON.parse(raw) as EventSubMessage;
    } catch {
      return;
    }

    // Drop redelivered messages.
    const id = message.metadata.message_id;
    if (id) {
      if (this.seenIds.has(id)) {
        return;
      }
      this.rememberId(id);
    }

    switch (message.metadata.message_type) {
      case 'session_welcome':
        this.onWelcome(socket, message);
        break;
      case 'session_keepalive':
        this.armWatchdog();
        break;
      case 'notification':
        this.armWatchdog();
        this.onNotification(message);
        break;
      case 'session_reconnect':
        this.onReconnect(message);
        break;
      case 'revocation':
        console.warn(
          `[twitch] subscription revoked: ${message.payload.subscription?.type ?? 'unknown'}`,
        );
        break;
    }
  }

  private onWelcome(socket: WebSocket, message: EventSubMessage): void {
    const session = message.payload.session;
    if (!session) {
      return;
    }
    this.sessionId = session.id;
    this.backoffMs = 1_000;
    this.armWatchdog(session.keepalive_timeout_seconds);

    // A reconnect-swap carries existing subscriptions over; only create them on
    // a brand-new session.
    if (this.intentionalClose) {
      this.intentionalClose = false;
      return;
    }
    void this.createSubscriptions(session.id);
  }

  private onReconnect(message: EventSubMessage): void {
    const reconnectUrl = message.payload.session?.reconnect_url;
    if (!reconnectUrl) {
      return;
    }
    const old = this.socket;
    // Flag so swapping sockets doesn't trigger the backoff path, and so the new
    // welcome skips re-creating subscriptions.
    this.intentionalClose = true;
    this.connect(reconnectUrl);
    old?.close();
  }

  private async createSubscriptions(sessionId: string): Promise<void> {
    for (const sub of this.subscriptions) {
      try {
        const response = await this.tokens.authedFetch(HELIX_SUBSCRIPTIONS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: sub.type,
            version: sub.version,
            condition: sub.condition,
            transport: { method: 'websocket', session_id: sessionId },
          }),
        });

        if (response.status === 202 || response.status === 409) {
          // 202 accepted; 409 duplicate (reconnect race) — both fine.
          continue;
        }
        if (response.status === 403) {
          console.error(
            `[twitch] missing scope for ${sub.type} (403). Re-run bootstrap with the required scope.`,
          );
          continue;
        }
        console.error(
          `[twitch] failed to create subscription ${sub.type}: ${response.status} ${await response.text()}`,
        );
      } catch (err) {
        if (err instanceof TwitchAuthError) {
          console.error(`[twitch] ${err.message}`);
          this.stop();
          return;
        }
        console.error(`[twitch] error creating subscription ${sub.type}:`, err);
      }
    }
  }

  private onNotification(message: EventSubMessage): void {
    const type = message.payload.subscription?.type;
    const event = message.payload.event;
    if (!type || !event) {
      return;
    }
    const def = this.byType.get(type);
    const normalized = def?.normalize(event);
    if (normalized) {
      this.broadcaster.broadcast(normalized);
    }
  }

  private scheduleReconnect(): void {
    this.clearWatchdog();
    this.sessionId = null;
    const jitter = this.backoffMs * 0.2;
    const delay = this.backoffMs - jitter / 2 + nextJitter(jitter);
    this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS);
    setTimeout(() => {
      if (!this.stopped) {
        this.connect(EVENTSUB_URL);
      }
    }, delay);
  }

  /** Keepalive timeout (ms) advertised by the current session. */
  private keepaliveMs = 10_000;

  /** Resets the keepalive watchdog; a timeout forces a reconnect. */
  private armWatchdog(timeoutSeconds?: number): void {
    this.clearWatchdog();
    if (timeoutSeconds) {
      this.keepaliveMs = timeoutSeconds * 1000;
    }
    this.watchdog = setTimeout(() => {
      this.socket?.close();
    }, this.keepaliveMs + KEEPALIVE_SLACK_MS);
    this.watchdog.unref?.();
  }

  private clearWatchdog(): void {
    if (this.watchdog) {
      clearTimeout(this.watchdog);
      this.watchdog = null;
    }
  }

  private rememberId(id: string): void {
    this.seenIds.add(id);
    if (this.seenIds.size > SEEN_IDS_LIMIT) {
      const first = this.seenIds.values().next().value;
      if (first !== undefined) {
        this.seenIds.delete(first);
      }
    }
  }
}

/**
 * Deterministic-free jitter helper. We intentionally avoid Math.random (banned
 * in some bundling/replay contexts is not a concern here, but keep it simple):
 * derive jitter from the high-resolution clock.
 */
function nextJitter(range: number): number {
  if (range <= 0) {
    return 0;
  }
  const frac = (Date.now() % 1000) / 1000;
  return frac * range;
}
