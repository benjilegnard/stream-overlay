import {
  BrowserModule,
  BrowserTransferStateModule,
  makeStateKey,
  TransferState,
} from '@angular/platform-browser';
import { NgModule, PLATFORM_ID } from '@angular/core';

import { AppComponent } from './app.component';
import { EnvConfig, ENV_CONFIG } from './core/model/env-config.model';
import { isPlatformServer } from '@angular/common';
import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserTransferStateModule,
    SharedModule,
  ],
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
  bootstrap: [AppComponent],
})
export class AppModule {}
