import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { ObsStudioService } from './obs-studio.service';

describe('ObsStudioService', () => {
  let service: ObsStudioService;
  let window: Partial<Window>;

  let obsMock: Partial<typeof obsstudio>;

  describe('when obsstudio is undefined', () => {
    beforeEach(() => {
      window = {};
      TestBed.configureTestingModule({});
      window = TestBed.inject(DOCUMENT).defaultView;
      service = TestBed.inject(ObsStudioService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });
    it('then getScene should not fail', () => {
      expect(() => service.getCurrentScene()).not.toThrow();
    });
  });
  describe('when obsstudio is defined', () => {
    beforeEach(() => {
      obsMock = {
        getCurrentScene: jest
          .fn()
          .mockImplementation((callback: (value: OBSSceneInfo) => void) => {
            callback({
              width: 1920,
              height: 1080,
              name: 'full screen with chat',
            } as OBSSceneInfo);
          }),
      } as Partial<typeof obsstudio>;
      TestBed.configureTestingModule({});
      window = TestBed.inject(DOCUMENT).defaultView;
      window['obsstudio'] = obsMock;
      service = TestBed.inject(ObsStudioService);
    });
    it('then getScene should return empty', (done: jest.DoneCallback) => {
      // prepare
      service.sceneChanged$.subscribe((value) => {
        expect(value).toBeDefined();
        done();
      });
      // execute
      service.getCurrentScene();
    });
  });
});
