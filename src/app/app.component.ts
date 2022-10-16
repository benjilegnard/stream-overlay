import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { ObsStudioService } from './shared/services/obs-studio.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'benjilegnard';

  sceneName$ =  this.obs.sceneChanged$.pipe(map(value => value.name));

  constructor(private obs: ObsStudioService) {
  }

  ngOnInit(): void {
    this.obs.getCurrentScene();
  }
}
