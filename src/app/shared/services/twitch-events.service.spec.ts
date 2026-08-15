import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { TwitchEventsService } from './twitch-events.service';

describe('TwitchEventsService', () => {
  let service: TwitchEventsService;
  let window: Window;

  describe('when EventSource is undefined', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({});
      window = TestBed.inject(DOCUMENT).defaultView as Window;
      delete (window as unknown as { EventSource?: unknown }).EventSource;
      service = TestBed.inject(TwitchEventsService);
    });

    it('should be created without opening a connection', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('when EventSource is defined', () => {
    let lastInstance: { onmessage: ((event: { data: string }) => void) | null };

    beforeEach(() => {
      lastInstance = { onmessage: null };
      class EventSourceMock {
        onmessage: ((event: { data: string }) => void) | null = null;
        constructor() {
          lastInstance = this;
        }
      }
      TestBed.configureTestingModule({});
      window = TestBed.inject(DOCUMENT).defaultView as Window;
      (window as unknown as { EventSource: unknown }).EventSource = EventSourceMock;
      service = TestBed.inject(TwitchEventsService);
    });

    it('should emit on follow$ when a follow event arrives', () =>
      new Promise<void>((resolve) => {
        // prepare
        service.follow$.subscribe((value) => {
          expect(value.user).toBe('yolo');
          resolve();
        });
        // execute
        lastInstance.onmessage?.({ data: JSON.stringify({ type: 'follow', user: 'yolo' }) });
      }));

    it('should emit on streamOnline$ when a stream.online event arrives', () =>
      new Promise<void>((resolve) => {
        // prepare
        service.streamOnline$.subscribe(() => resolve());
        // execute
        lastInstance.onmessage?.({ data: JSON.stringify({ type: 'stream.online' }) });
      }));
  });
});
