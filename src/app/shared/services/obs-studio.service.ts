import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { fromEvent, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ObsStudioService {
  public sceneChanged$: Subject<OBSSceneInfo> = new Subject();

  private obsstudio: typeof obsstudio;

  constructor(@Inject(DOCUMENT) document: Document) {
    this.obsstudio = document.defaultView.obsstudio;
  }

  getCurrentScene() {
    this.obsstudio?.getCurrentScene((value) => {
      this.sceneChanged$.next(value);
    });
  }
}
