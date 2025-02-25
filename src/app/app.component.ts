import {Component, OnInit, PLATFORM_ID, makeStateKey} from '@angular/core';
import {map} from 'rxjs/operators';
import {ObsStudioService} from './shared/services/obs-studio.service';
import {BackgroundComponent} from './shared/components/background/background.component';
import {AsyncPipe, isPlatformServer} from '@angular/common';
import {TransferState} from '@angular/core';
import {ENV_CONFIG, EnvConfig} from './core/model/env-config.model';

@Component({
	selector: 'app-root',
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
		<app-background></app-background>
		<div class="scene-name widget">
			{{ sceneName$ | async }}
		</div>
	`,
	styles: [
		`
			:host {
				font-family: 'Open Sans', sans-serif;
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
				background-color: black;
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
					border-color: black transparent transparent black;
				}
			}

			.scene-name {
				font-family: 'Poppins', sans-serif;
				text-transform: uppercase;
				position: absolute;
				bottom: 0;
				right: 0;
				width: auto;
				color: white;
				height: 2em;
				font-size: 1rem;
				&::after {
					position: absolute;
					left: -2em;
					content: ' ';
					width: 0;
					height: 0;
					border: 1em solid black;
					border-color: transparent black black transparent;
				}
			}
		`,
	],
	styleUrls: ['./app.component.scss'],
	imports: [BackgroundComponent, AsyncPipe],
	providers: [
		{
			provide: ENV_CONFIG,
			useFactory: (
				envConfigSSR: EnvConfig,
				platformId: string,
				transferState: TransferState,
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
})
export class AppComponent implements OnInit {
	title = 'benjilegnard';

	sceneName$ = this.obs.sceneChanged$.pipe(map(value => value.name));

	constructor(private obs: ObsStudioService) {}

	ngOnInit(): void {
		this.obs.getCurrentScene();
	}
}
