import {DOCUMENT, isPlatformBrowser} from '@angular/common';
import type Delaunator from 'delaunator';
import {
	AfterViewInit,
	Component,
	ElementRef,
	HostListener,
	Inject,
	NgZone,
	OnInit,
	PLATFORM_ID,
	ViewChild,
} from '@angular/core';

const MAIN_COLOR = 'rgba(255, 255, 255, 0.25)';
const NUMBER_OF_POINTS = 64;
const SPEED = 2;
const LINE_WIDTH = 0.25;
const CIRCLE_RADIUS = 6;

export interface Point {
	x: number;
	y: number;
	// velocity
	v: {x: number; y: number};
}
export type Coords = Array<[number, number]>;

@Component({
	selector: 'app-background',
	template: `
		<canvas
			#canvasElement
			[attr.width]="canvasWidth"
			[attr.height]="canvasHeight"
		></canvas>
	`,
	styles: [
		`
			canvas {
				display: flex;
			}
			:host {
				position: absolute;
				left: 0;
				right: 0;
				top: 0;
				bottom: 0;
				inset: 0 0 0 0;
				z-index: 0;
			}
		`,
	],
	standalone: true,
})
export class BackgroundComponent implements OnInit, AfterViewInit {
	public canvasWidth: number;
	public canvasHeight: number;

	private delaunator: Delaunator;
	private points: Point[];
	private coords: Coords;

	@ViewChild('canvasElement')
	private canvasRef: ElementRef;
	private canvas: HTMLCanvasElement;
	private context: CanvasRenderingContext2D;

	@HostListener('window:resize', ['$event'])
	public windowResize(event: Event) {
		const {innerWidth, innerHeight} = event.target as Window;

		this.canvasWidth = innerWidth;
		this.canvasHeight = innerHeight;
	}

	constructor(
		@Inject(PLATFORM_ID) private platformId: string,
		@Inject(DOCUMENT) private document: Document,
		private zone: NgZone,
	) {}

	ngAfterViewInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			import('delaunator').then(delaunatorModule => {
				const Delaunator = delaunatorModule.default;
				this.canvas = this.canvasRef.nativeElement;
				this.context = this.canvas.getContext('2d');
				this.zone.runOutsideAngular(() => {
					const animate = (frameStamp: number) => {
						this.move();
						this.draw(Delaunator);
						requestAnimationFrame(animate);
					};
					requestAnimationFrame(animate);
				});
			});
		}
	}

	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.canvasWidth = this.document.defaultView.innerWidth;
			this.canvasHeight = this.document.defaultView.innerHeight;
			this.points = this.generateRandomPoints();
			this.coords = this.pointsToCoordsArray(this.points);
		}
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

	draw(Delaunator: Delaunator) {
		// reset canvas on each frame
		this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

		const points = this.pointsToCoordsArray(this.points);
		this.delaunator = Delaunator.from(points);
		const {triangles} = this.delaunator;
		let j = 0;
		for (let i = 0; i < triangles.length; i += 3) {
			this.drawTriangle(
				points[triangles[i]],
				points[triangles[i + 1]],
				points[triangles[i + 2]],
			);
			j++;
		}
		this.points.forEach((point: Point) => {
			this.drawPoint(point);
		});
	}

	drawPoint(point: Point) {
		this.context.beginPath();
		this.context.arc(point.x, point.y, CIRCLE_RADIUS, 0, 2 * Math.PI);
		this.context.fillStyle = 'white';
		this.context.fill();
	}

	drawTriangle(
		firstPoint: [number, number],
		secondPoint: [number, number],
		thirdPoint: [number, number],
	) {
		this.context.strokeStyle = MAIN_COLOR;
		this.context.lineWidth = LINE_WIDTH;
		this.context.moveTo(firstPoint[0], firstPoint[1]);
		this.context.lineTo(secondPoint[0], secondPoint[1]);
		this.context.lineTo(thirdPoint[0], thirdPoint[1]);
		this.context.lineTo(firstPoint[0], firstPoint[1]);
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

	pointsToCoordsArray(points: Point[]): Array<[number, number]> {
		const coords: Array<[number, number]> = [];
		points.forEach((current: Point) => {
			coords.push([current.x, current.y]);
		});
		// add a point for each corner
		coords.push([0, 0]); // top left
		coords.push([this.canvasWidth, 0]);
		coords.push([this.canvasWidth, this.canvasHeight]); // bottom right
		coords.push([0, this.canvasHeight]);

		// add points to a third of vertical lines
		coords.push([0, (this.canvasHeight * 2) / 3]);
		coords.push([0, this.canvasHeight / 3]);

		coords.push([this.canvasWidth, (this.canvasHeight * 2) / 3]);
		coords.push([this.canvasWidth, this.canvasHeight / 3]);

		// add points to a fourth of horizontal lines
		coords.push([this.canvasWidth / 4, 0]);
		coords.push([this.canvasWidth / 2, 0]);
		coords.push([(this.canvasWidth * 3) / 4, 0]);

		coords.push([this.canvasWidth / 4, this.canvasHeight]);
		coords.push([this.canvasWidth / 2, this.canvasHeight]);
		coords.push([(this.canvasWidth * 3) / 4, this.canvasHeight]);
		return coords;
	}
}
