import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { EnvConfig } from './core/model/env-config.model';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    {
      provide: 'ENV_CONFIG_SSR',
      useFactory: () => {
        return {
          twitchUsername: process.env.TWITCH_USERNAME,
          twitchClientID: process.env.TWITCH_CLIENT_ID,
        } as EnvConfig;
      },
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
