import { Component, PLATFORM_ID, makeStateKey } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { TransferState } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ENV_CONFIG, EnvConfig } from './core/model/env-config.model';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`,
  imports: [RouterOutlet],
  providers: [
    {
      provide: ENV_CONFIG,
      useFactory: (envConfigSSR: EnvConfig, platformId: string, transferState: TransferState) => {
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
export class AppComponent {}
