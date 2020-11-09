import { NgModule } from '@angular/core';
import { ServerModule, ServerTransferStateModule } from '@angular/platform-server';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { EnvConfig } from './core/model/env-config.model';

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    ServerTransferStateModule,
  ],
  providers: [
    {
      provide: 'ENV_CONFIG_SSR',
      useValue: { twitchUsername: process.env.TWITCH_USERNAME } as EnvConfig,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
