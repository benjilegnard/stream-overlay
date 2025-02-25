import {inject, Injectable, NgZone} from '@angular/core';
import {BackgroundDrawer} from '../background-drawer.token';

const TAU = Math.PI * 2;

const HEX_ANGLE = TAU / 6;

const HEX_EDGES = 6;

const HEX_AMOUNT = 192;

const BACKGROUND_COLOR = '#1e1e2e';

const HEXAGON_COLOR = 'rgba(255,255,255,0.15)';

const SPEED = 0.4;

let BOUNDARIES = {
	x: window.innerWidth,
	y: window.innerHeight,
	z: window.innerWidth,
};
const hexagons: Hex[] = [];

interface Vector3 {
	x: number;
	y: number;
	z: number;
}

interface Hex {
	center: Vector3;
	direction: Vector3;
	radius: number;
}

/**
 * get the coordinates of one of the edges of the hexagon
 */
function getPoint(hex: Hex, i: number) {
	let currentAngle = HEX_ANGLE + (i * TAU) / HEX_EDGES;
	return {
		x:
			hex.center.x +
			(Math.cos(currentAngle) * hex.radius * hex.center.z) / BOUNDARIES.z,
		y:
			hex.center.y +
			(Math.sin(currentAngle) * hex.radius * hex.center.z) / BOUNDARIES.z,
		z: hex.center.z,
	};
}
/**
 * Gets the path of an hexagon
 */
function getPath(hex: Hex) {
	let path = new Path2D();
	path.moveTo(getPoint(hex, 0).x, getPoint(hex, 0).y);
	for (let i = 1; i < HEX_EDGES; i++) {
		path.lineTo(getPoint(hex, i).x, getPoint(hex, i).y);
	}
	path.closePath();
	return path;
}

/**
 * Draws an hexagon on the canvas context
 */
function draw(hex: Hex, context: CanvasRenderingContext2D) {
	context.fillStyle = HEXAGON_COLOR;
	context.fill(getPath(hex));
}
function move(hex: Hex) {
	hex.center.x += hex.direction.x * SPEED;
	hex.center.y += hex.direction.y * SPEED;
	hex.center.z += hex.direction.z * SPEED;
}
//reverse direction if we reach the border
function collide(hex: Hex) {
	if (hex.center.x < 0 || hex.center.x > BOUNDARIES.x) {
		hex.direction.x = -hex.direction.x;
	}
	if (hex.center.y < 0 || hex.center.y > BOUNDARIES.y) {
		hex.direction.y = -hex.direction.y;
	}
	if (hex.center.z < 0 || hex.center.z > BOUNDARIES.z) {
		hex.direction.z = -hex.direction.z;
	}
}

function render(
	hexagons: Hex[],
	context: CanvasRenderingContext2D,
	width: number,
	height: number,
) {
	context.clearRect(0, 0, width, height);
	context.fillStyle = BACKGROUND_COLOR;
	context.fillRect(0, 0, width, height);
	hexagons.forEach(h => {
		draw(h, context);
		collide(h);
	});
}

function animate(
	context: CanvasRenderingContext2D,
	width: number,
	height: number,
) {
	hexagons.forEach(h => {
		move(h);
	});
	render(hexagons, context, width, height);
	requestAnimationFrame(() => animate(context, width, height));
}

export function initialize(
	context: CanvasRenderingContext2D,
	width: number,
	height: number,
) {
	let radius = 100;
	for (let i = 0; i < HEX_AMOUNT; i++) {
		let x = Math.random() * window.innerWidth;
		let y = Math.random() * window.innerHeight;
		let z = Math.random() * window.innerWidth;

		hexagons.push({
			center: {
				x: x,
				y: y,
				z: z,
			},
			radius: radius,
			direction: {
				x: Math.random() * 2 - 1,
				y: Math.random() * 2 - 1,
				z: Math.random() * 2 - 1,
			},
		});
	}
	animate(context, width, height);
}

export function resize() {
	BOUNDARIES = {
		x: window.innerWidth,
		y: window.innerHeight,
		z: window.innerWidth,
	};
}

@Injectable()
export class HexagonBackground implements BackgroundDrawer {
	private context: CanvasRenderingContext2D;
	private width: number;
	private height: number;

	private zone = inject(NgZone);
	initialize(context: CanvasRenderingContext2D, width: number, height: number) {
		this.zone.runOutsideAngular(() => {
			initialize(context, width, height);
		});
		this.context = context;
	}

	resize(width: number, height: number) {
		this.width = width;
		this.height = height;
	}
}
