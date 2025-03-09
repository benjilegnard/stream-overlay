import {inject, NgZone} from '@angular/core';
import {BackgroundDrawer} from '../background-drawer.token';

const NUMBER_OF_POINTS = 256;
const SPEED = 1;
const CIRCLE_RADIUS = 3;
const MAX_DISTANCE = 175;
const LINE_WIDTH = 2;

export interface Point {
	x: number;
	y: number;
	// velocity
	v: {x: number; y: number};
}
export type Coords = Array<[number, number]>;
function distance(first: Point, last: Point) {
	const x = first.x - last.x;
	const y = first.y - last.y;
	return Math.sqrt(x * x + y * y);
}
export class ClosestNodeBackground implements BackgroundDrawer {
	public canvasWidth: number;
	public canvasHeight: number;

	private points: Point[];

	private context: CanvasRenderingContext2D;

	private zone = inject(NgZone);

	initialize(context: CanvasRenderingContext2D, width: number, height: number) {
		this.context = context;
		this.canvasWidth = width;
		this.canvasHeight = height;

		this.points = this.generateRandomPoints();

		this.zone.runOutsideAngular(() => {
			const animate = () => {
				this.move();
				this.draw();
				requestAnimationFrame(animate);
			};
			requestAnimationFrame(animate);
		});
	}

	resize(width: number, height: number) {
		this.canvasWidth = width;
		this.canvasHeight = height;
	}

	move() {
		this.points.forEach((point: Point) => {
			this.movePoint(point);
			this.detectCollisions(point);
		});
	}

	movePoint(point: Point) {
		point.x += point.v.x * SPEED;
		point.y += point.v.y * SPEED;
	}

	draw() {
		// reset canvas on each frame
		this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
		this.context.fillStyle = '#181825';
		this.context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
		this.points.forEach((point: Point) => {
			this.drawPoint(point);
			this.points
				.filter(currentPoint => distance(point, currentPoint) < MAX_DISTANCE)
				.forEach(destinationPoint => {
					const destDistance = distance(point, destinationPoint);
					if (destDistance < MAX_DISTANCE) {
						this.drawLine(
							point,
							destinationPoint,
							(MAX_DISTANCE - destDistance) / MAX_DISTANCE / 2,
						);
					}
				});
		});
	}

	drawPoint(point: Point) {
		this.context.beginPath();
		this.context.arc(point.x, point.y, CIRCLE_RADIUS, 0, 2 * Math.PI);
		this.context.fillStyle = 'white';
		this.context.fill();
	}

	drawLine(firstPoint: Point, lastPoint: Point, opacity: number) {
		this.context.strokeStyle = `rgba(255,255,255,${opacity})`;
		this.context.lineWidth = LINE_WIDTH;
		this.context.beginPath();
		this.context.moveTo(firstPoint.x, firstPoint.y);
		this.context.lineTo(lastPoint.x, lastPoint.y);
		this.context.stroke();
	}

	/**
	 * Change direction of a point when they reach screen limits
	 */
	detectCollisions(point: Point) {
		if (point.x < 0 || point.x > this.canvasWidth) {
			point.v.x = -point.v.x;
		}
		if (point.y < 0 || point.y > this.canvasHeight) {
			point.v.y = -point.v.y;
		}
	}

	generateRandomPoints(): Point[] {
		const points: Point[] = [];
		for (let i = 0; i <= NUMBER_OF_POINTS; i += 2) {
			const x = Math.floor(Math.random() * this.canvasWidth);
			const y = Math.floor(Math.random() * this.canvasHeight);
			points.push({
				x,
				y,
				// direction
				v: {
					x: Math.random() * 2 - 1,
					y: Math.random() * 2 - 1,
				},
			});
		}
		return points;
	}
}
