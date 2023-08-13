import { Component, OnInit, PLATFORM_ID, makeStateKey } from '@angular/core';
import { map } from 'rxjs/operators';
import { ObsStudioService } from './shared/services/obs-studio.service';
import { BackgroundComponent } from './shared/components/background/background.component';
import { AsyncPipe, isPlatformServer } from '@angular/common';
import { TransferState } from '@angular/core';
import { ENV_CONFIG, EnvConfig } from './core/model/env-config.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [BackgroundComponent, AsyncPipe],
  standalone: true,
  providers: [
    {
      provide: ENV_CONFIG,
      useFactory: (
        envConfigSSR: EnvConfig,
        platformId: string,
        transferState: TransferState
      ) => {
        const stateKey = makeStateKey<EnvConfig>('envConfig');
        if (isPlatformServer(platformId)) {
          transferState.set(stateKey, envConfigSSR);
          return envConfigSSR;
        }
        return transferState.get<EnvConfig>(stateKey, {});
      },
      deps: ['ENV_CONFIG_SSR', PLATFORM_ID, TransferState],
    },
  ],
})
export class AppComponent implements OnInit {
  title = 'benjilegnard';

  sceneName$ = this.obs.sceneChanged$.pipe(map((value) => value.name));

  constructor(private obs: ObsStudioService) {}

  ngOnInit(): void {
    this.obs.getCurrentScene();
  }
}
