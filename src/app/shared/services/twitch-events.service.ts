import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, DOCUMENT, inject } from '@angular/core';
import { Subject } from 'rxjs';

import type { NormalizedTwitchEvent } from '../../core/model/twitch-event.model';

/**
 * Subscribes to the server-side Twitch proxy over SSE and exposes each event
 * type as an RxJS stream. Mirrors {@link ObsStudioService}: browser-only,
 * guarded by `isPlatformBrowser`, streams suffixed with `$`.
 *
 * Native `EventSource` reconnects automatically, so there is no manual retry.
 */
@Injectable({
  providedIn: 'root',
})
export class TwitchEventsService {
  public follow$: Subject<{ user: string }> = new Subject();
  public subscribe$: Subject<{ user: string; tier: string; isGift: boolean }> = new Subject();
  public cheer$: Subject<{ user: string | null; bits: number }> = new Subject();
  public raid$: Subject<{ from: string; viewers: number }> = new Subject();
  public streamOnline$: Subject<void> = new Subject();
  public streamOffline$: Subject<void> = new Subject();

  private document = inject(DOCUMENT);

  private platformId = inject(PLATFORM_ID);

  private source?: EventSource;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const view = this.document.defaultView;
      if (view?.EventSource) {
        this.source = new view.EventSource('/api/twitch/events');
        this.source.onmessage = (event) => this.dispatch(JSON.parse(event.data));
      }
    }
  }

  private dispatch(event: NormalizedTwitchEvent): void {
    switch (event.type) {
      case 'follow':
        this.follow$.next(event);
        break;
      case 'subscribe':
        this.subscribe$.next(event);
        break;
      case 'cheer':
        this.cheer$.next(event);
        break;
      case 'raid':
        this.raid$.next(event);
        break;
      case 'stream.online':
        this.streamOnline$.next();
        break;
      case 'stream.offline':
        this.streamOffline$.next();
        break;
    }
  }
}
