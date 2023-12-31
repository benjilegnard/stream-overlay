import { DOCUMENT } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type Delaunator from 'delaunator';

import { BackgroundComponent, Point } from './background.component';

describe('BackgroundComponent', () => {
  let component: BackgroundComponent;
  let fixture: ComponentFixture<BackgroundComponent>;
  let window: Partial<Window>;
  let context: Partial<CanvasRenderingContext2D>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackgroundComponent],
    }).compileComponents();
    window = TestBed.inject(DOCUMENT).defaultView;
    context = {
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      clearRect: jest.fn(),
    };
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('when the window is resized', () => {
    it('should assign window width to canvas width', () => {
      // execute
      component.windowResize({
        target: { innerWidth: 640, innerHeight: 480 } as unknown as EventTarget,
      } as Event);
      // verify
      expect(component.canvasWidth).toBe(640);
      expect(component.canvasHeight).toBe(480);
    });
  });
  describe('movePoint', () => {
    it('should apply spped per velocity on coordinates', () => {
      // prepare
      const point: Point = { x: 0, y: 0, v: { x: 1, y: 0 } };
      // execute
      component.movePoint(point);
      // verify
      expect(point.x).toBe(2);
      expect(point.y).toBe(0);
    });
  });
  describe('drawPoint', () => {
    it('should draw an ellipse around position', () => {
      // prepare
      const point: Point = { x: 50, y: 50, v: { x: 0, y: 0 } };
      component['context'] = context as CanvasRenderingContext2D;
      // execute
      component.drawPoint(point);
      // verify
      expect(context.arc).toHaveBeenCalled();
    });
  });
  describe('move', () => {
    it('should move all points according to velocity', () => {
      // prepare
      const point: Point = { x: 50, y: 50, v: { x: 0, y: 0 } };
      component['points'] = [point];
      const movePointSpy = jest.spyOn(component, 'movePoint');
      const detectCollisionsSpy = jest.spyOn(component, 'detectCollisions');
      // execute
      component.move();
      // verify
      expect(movePointSpy).toHaveBeenCalled();
      expect(detectCollisionsSpy).toHaveBeenCalled();
    });
  });
  describe('draw', () => {
    it('should compute triangles and draw all points', () => {
      // prepare
      jest.spyOn(component, 'pointsToCoordsArray').mockReturnValue([
        [0, 0],
        [10, 0],
        [0, 10],
      ]);
      const drawTriangleSpy = jest.spyOn(component, 'drawTriangle');
      component['context'] = context as CanvasRenderingContext2D;
      const delaunatorMock: Delaunator = {
        from: jest.fn().mockReturnValue({ triangles: [0, 1, 2] }),
      };
      // execute
      component.draw(delaunatorMock);
      // expect
      expect(context.clearRect).toHaveBeenCalledTimes(1);
      expect(drawTriangleSpy).toHaveBeenCalledWith([0, 0], [10, 0], [0, 10]);
    });
  });
  describe('drawTriangle()', () => {
    it('should draw points and triangles', () => {
      // prepare
      const points: [number, number][] = [
        [0, 0],
        [10, 0],
        [0, 10],
      ];
      component['context'] = context as CanvasRenderingContext2D;
      // execute
      component.drawTriangle(points[0], points[1], points[2]);
      // verify
      expect(context.moveTo).toHaveBeenNthCalledWith(1, 0, 0);
      expect(context.lineTo).toHaveBeenNthCalledWith(1, 10, 0);
      expect(context.lineTo).toHaveBeenNthCalledWith(2, 0, 10);
      expect(context.lineTo).toHaveBeenNthCalledWith(3, 0, 0);
      expect(context.stroke).toHaveBeenCalledTimes(1);
    });
  });
  describe('detectCollision()', () => {
    beforeEach(() => {
      component.canvasWidth = 640;
      component.canvasHeight = 480;
    });
    describe('should reverse horizontal direction', () => {
      it('when x position is below zero', () => {
        // prepare
        const point: Point = { x: -1, y: 0, v: { x: -1, y: 0 } };
        // execute
        component.detectCollisions(point);
        // verify
        expect(point.v.x).toEqual(1);
      });
      it('when x position is above width', () => {
        // prepare
        const point: Point = { x: 641, y: 0, v: { x: 1, y: 0 } };
        // execute
        component.detectCollisions(point);
        // verify
        expect(point.v.x).toEqual(-1);
      });
    });
    describe('should reverse vertical direction', () => {
      it('when y position is below zero', () => {
        // prepare
        const point: Point = { x: 0, y: -1, v: { x: 0, y: -1 } };
        // execute
        component.detectCollisions(point);
        // verify
        expect(point.v.y).toEqual(1);
      });
      it('when y position is above height', () => {
        // prepare
        const point: Point = { x: 0, y: 481, v: { x: 0, y: 1 } };
        // execute
        component.detectCollisions(point);
        // verify
        expect(point.v.y).toEqual(-1);
      });
    });
  });
});
