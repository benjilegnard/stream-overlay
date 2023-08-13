import { ApplicationConfig } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: 'ENV_CONFIG_SSR',
      useValue: undefined,
    },
  ],
};
