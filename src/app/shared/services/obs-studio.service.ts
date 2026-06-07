import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, DOCUMENT, inject } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ObsStudioService {
  public sceneChanged$: Subject<OBSSceneInfo> = new Subject();

  private obsstudio: typeof obsstudio;

  private document = inject(DOCUMENT);

  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.obsstudio = document.defaultView.obsstudio;
    if (isPlatformBrowser(this.platformId)) {
      document.defaultView.addEventListener('obsSceneChanged', (event) => {
        this.sceneChanged$.next(event.detail);
      });
    }
  }

  getCurrentScene() {
    this.obsstudio?.getCurrentScene((value) => {
      this.sceneChanged$.next(value);
    });
  }
}
