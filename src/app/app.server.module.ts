import { NgModule } from '@angular/core';
import {
  ServerModule,
  ServerTransferStateModule,
} from '@angular/platform-server';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { EnvConfig } from './core/model/env-config.model';

@NgModule({
  imports: [AppModule, ServerModule, ServerTransferStateModule],
  providers: [
    {
      provide: 'ENV_CONFIG_SSR',
      useFactory: () => {
        return {
          twitchUsername: process.env.TWITCH_USERNAME,
          twitchClientID: process.env.TWITCH_CLIENT_ID,
          twitchClientSecret: process.env.TWITCH_CLIENT_SECRET,
        } as EnvConfig;
      },
    },
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
