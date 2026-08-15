import type { Request, Response } from 'express';

import type { NormalizedTwitchEvent } from './events';

const HEARTBEAT_MS = 25_000;

/**
 * Fan-out of normalized Twitch events to connected overlay clients over SSE.
 *
 * Each client is a long-lived `text/event-stream` response. A periodic heartbeat
 * comment keeps the connection alive through OBS's CEF / proxies, which drop
 * idle streams.
 */
export class SseBroadcaster {
  private readonly clients = new Set<Response>();
  private heartbeat: ReturnType<typeof setInterval> | null = null;

  /** Registers a new SSE client and tears it down when the request closes. */
  addClient(req: Request, res: Response): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
    res.write(': connected\n\n');

    this.clients.add(res);
    this.ensureHeartbeat();

    req.on('close', () => {
      this.clients.delete(res);
      this.stopHeartbeatIfIdle();
    });
  }

  /** Sends a normalized event to every connected client. */
  broadcast(event: NormalizedTwitchEvent): void {
    const frame = `data: ${JSON.stringify(event)}\n\n`;
    for (const res of this.clients) {
      try {
        res.write(frame);
      } catch {
        this.clients.delete(res);
      }
    }
  }

  private ensureHeartbeat(): void {
    if (this.heartbeat) {
      return;
    }
    this.heartbeat = setInterval(() => {
      for (const res of this.clients) {
        try {
          res.write(': ping\n\n');
        } catch {
          this.clients.delete(res);
        }
      }
    }, HEARTBEAT_MS);
    // Don't keep the process alive just for the heartbeat.
    this.heartbeat.unref?.();
  }

  private stopHeartbeatIfIdle(): void {
    if (this.clients.size === 0 && this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
  }
}
