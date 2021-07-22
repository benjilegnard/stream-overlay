import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EnvConfig, ENV_CONFIG } from 'src/app/core/model/env-config.model';

import TwitchJs, { Chat, GlobalUserStateMessage } from 'twitch-js';

@Injectable()
export class TwitchService {
  private chat: Chat;
  constructor(
    @Inject(ENV_CONFIG) private envConfig: EnvConfig,
    private httpClient: HttpClient
  ) {}
  public init(): Observable<void | GlobalUserStateMessage> {
    this.chat = new TwitchJs({
      username: this.envConfig.twitchUsername,
      clientId: this.envConfig.twitchClientID,
      onAuthenticationFailure: () =>
        new Promise((resolve, reject) => {
          console.error('auth failure');
          this.httpClient
            .post('https://id.twitch.tv/oauth2/token', {})
            .subscribe((response) => resolve((response as any).accessToken));
        }),
    }).chat;
    return from(this.chat.connect()).pipe(
      tap((value) => console.log('chat connected', value)),
    );
  }
}
