import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { TwitchService } from 'src/app/shared/services/twitch.service';

@Component({
  selector: 'app-chat-view',
  templateUrl: './chat-view.component.html',
  styleUrls: ['./chat-view.component.scss'],
})
export class ChatViewComponent implements OnInit {
  constructor(private twitchService: TwitchService, @Inject(PLATFORM_ID) private platformId: string) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.twitchService.init().subscribe();
    }
  }
}
