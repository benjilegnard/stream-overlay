import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { fromEvent, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ObsStudioService {
  public sceneChanged$: Subject<OBSSceneInfo> = new Subject();

  private obsstudio: typeof obsstudio;

  constructor(@Inject(DOCUMENT) document: Document, @Inject(PLATFORM_ID) platformId) {
    this.obsstudio = document.defaultView.obsstudio;
    if (isPlatformBrowser(platformId)) {
      document.defaultView.addEventListener("obsSceneChanged", (event) => {
        this.sceneChanged$.next(event.detail)
      })
    }
  }

  getCurrentScene() {
    this.obsstudio?.getCurrentScene((value) => {
      this.sceneChanged$.next(value);
    });
  }
}
