import { InjectionToken } from '@angular/core';

export interface EnvConfig {
  twitchUsername?: string;
  twitchClientID?: string;
  twitchClientSecret?: string;
}
export const ENV_CONFIG = new InjectionToken<EnvConfig>('ENV_CONFIG');
