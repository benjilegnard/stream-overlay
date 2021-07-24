import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import Delaunator from 'delaunator';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  NgZone,
  OnChanges,
  OnInit,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

const MAIN_COLOR = 'rgba(255, 255, 255, 0.25)';
const NUMBER_OF_POINTS = 48;
const SPEED = 2;
const LINE_WIDTH = 0.5;
const CIRCLE_RADIUS = 6;

export interface Point {
  x: number;
  y: number;
  // velocity
  v: { x: number; y: number };
}
export type Coords = Array<[number, number]>;

@Component({
  selector: 'app-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.css'],
})
export class BackgroundComponent implements OnInit, AfterViewInit, OnChanges {
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
    const { innerWidth, innerHeight } = event.target as Window;

    this.canvasWidth = innerWidth;
    this.canvasHeight = innerHeight;
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: string,
    private zone: NgZone
  ) {}
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      console.log('ngAfterViewInit');
      this.canvas = this.canvasRef.nativeElement;
      this.context = this.canvas.getContext('2d');
      this.zone.runOutsideAngular(() => {
        const animate = (frameStamp: number) => {
          this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
          this.points.forEach((point: Point) => {
            this.movePoint(point);
            this.drawPoint(point);
            this.collisionDetector(point);
          });
          const points = this.pointsToCoordsArray(this.points);
          const delaunator = Delaunator.from(points);
          const { triangles } = delaunator;
          for (let i = 0; i < triangles.length; i += 3) {
            this.drawTriangle(
              points[triangles[i]],
              points[triangles[i + 1]],
              points[triangles[i + 2]]
            );
          }
          console.log("triangles", triangles.length)
          requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      });
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    console.log('onChanges');
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.canvasWidth = window.innerWidth;
      this.canvasHeight = window.innerHeight;
      this.points = this.generateRandomPoints();
      this.coords = this.pointsToCoordsArray(this.points);
      this.delaunator = Delaunator.from(this.coords);
    }
  }

  movePoint(point: Point) {
    point.x += point.v.x * SPEED;
    point.y += point.v.y * SPEED;
  }

  drawPoint(point: Point) {
    this.context.beginPath();
    this.context.arc(point.x, point.y, CIRCLE_RADIUS, 0, 2 * Math.PI);
    this.context.fillStyle = MAIN_COLOR;
    this.context.fill();
  }

  drawTriangle(
    firstPoint: [number, number],
    secondPoint: [number, number],
    thirdPoint: [number, number]
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
  collisionDetector(point: Point) {
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
    // top left
    coords.push([0,0])
    coords.push([this.canvasWidth, 0])
    coords.push([this.canvasWidth, this.canvasHeight])
    coords.push([0, this.canvasHeight])
    return coords;
  }
}
