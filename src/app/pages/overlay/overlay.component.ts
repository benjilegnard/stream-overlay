import { Component, OnInit, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { ObsStudioService } from '../../shared/services/obs-studio.service';
import { TwitchEventsService } from '../../shared/services/twitch-events.service';

@Component({
  selector: 'app-overlay',
  template: `
    <h1 class="stream-title widget">{{ title }}</h1>
    <nav id="social-media-toolbar">
      <a href="https://twitter.com/benjilegnard">Twitter</a>
      <a href="https://facebook.com/benjilegnard">Facebook</a>
      <a href="https://youtube.com/benjilegnard">Youtube</a>
      <a href="https://github.com/benjilegnard">Github</a>
    </nav>

    <ul id="chat-view">
      <li class="chat-message">YOLO: test</li>
    </ul>

    <canvas id="avatar-view"></canvas>
    <div class="song-playing"></div>
    <div class="scene-name widget">
      {{ sceneName$ | async }}
    </div>

    <!-- Minimal debug display of incoming Twitch events; replace with real widgets later. -->
    <div class="twitch-debug widget">
      @if (lastFollow$ | async; as follow) {
        <span>follow: {{ follow.user }}</span>
      }
      @if (lastSubscribe$ | async; as sub) {
        <span>sub: {{ sub.user }} (tier {{ sub.tier }})</span>
      }
      @if (lastCheer$ | async; as cheer) {
        <span>cheer: {{ cheer.user }} {{ cheer.bits }} bits</span>
      }
      @if (lastRaid$ | async; as raid) {
        <span>raid: {{ raid.from }} ({{ raid.viewers }})</span>
      }
    </div>
  `,
  styles: [
    `
      :host {
        font-family: 'Hack', sans-serif;
        font-size: 14px;
        color: white;
        box-sizing: border-box;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        margin: 0;
        font-family: 'Poppins', sans-serif;
        text-transform: uppercase;
      }

      p {
        margin: 0;
      }

      .widget {
        background-color: var(--color-crust);
        opacity: 0.9;
        color: var(--color-text);
        padding: 0 0.5em;
        line-height: 2em;
        font-size: 2em;
      }

      .stream-title {
        width: auto;
        height: 2em;
        position: absolute;
        top: 0;
        margin: 0;
        z-index: 1;

        &::after {
          position: absolute;
          right: -2em;
          content: ' ';
          width: 0;
          height: 0;
          border: 1em solid black;
          border-color: var(--color-crust) transparent transparent var(--color-crust);
        }
      }

      .scene-name {
        font-family: 'Poppins', sans-serif;
        text-transform: uppercase;
        position: absolute;
        bottom: 0;
        right: 0;
        width: auto;
        color: var(--color-text);
        height: 2em;
        font-size: 1rem;
        &::after {
          position: absolute;
          left: -2em;
          content: ' ';
          width: 0;
          height: 0;
          border: 1em solid black;
          border-color: transparent var(--color-crust) var(--color-crust) transparent;
        }
      }
    `,
  ],
  imports: [AsyncPipe],
})
export class OverlayComponent implements OnInit {
  private obs = inject(ObsStudioService);
  private twitch = inject(TwitchEventsService);

  title = 'benjilegnard';

  sceneName$ = this.obs.sceneChanged$.pipe(map((value) => value.name));

  lastFollow$ = this.twitch.follow$;
  lastSubscribe$ = this.twitch.subscribe$;
  lastCheer$ = this.twitch.cheer$;
  lastRaid$ = this.twitch.raid$;

  ngOnInit(): void {
    this.obs.getCurrentScene();
  }
}
