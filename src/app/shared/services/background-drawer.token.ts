import {InjectionToken} from '@angular/core';

export interface BackgroundDrawer {
	initialize(
		context: CanvasRenderingContext2D,
		width: number,
		height: number,
	): void;
	resize(width: number, height: number): void;
}

export const BACKGROUND_DRAWER = new InjectionToken<BackgroundDrawer>(
	'BACKGROUND_DRAWER',
);
