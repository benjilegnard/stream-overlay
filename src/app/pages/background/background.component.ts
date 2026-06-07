import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  PLATFORM_ID,
  viewChild,
  DOCUMENT,
} from '@angular/core';
import { BACKGROUND_DRAWER } from '../../shared/services/background-drawer.token';
import { DelaunayBackground } from '../../shared/services/backgrounds/delaunay-background.service';
import { HexagonBackground } from '../../shared/services/backgrounds/hexagon-background';
import { ClosestNodeBackground } from '../../shared/services/backgrounds/closest-node-background.service';

@Component({
  selector: 'app-background',
  template: `
    <canvas #canvasElement [attr.width]="canvasWidth" [attr.height]="canvasHeight"></canvas>
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
})
export class BackgroundComponent implements OnInit, AfterViewInit {
  public canvasWidth: number;
  public canvasHeight: number;

  private canvasRef = viewChild('canvasElement', {
    read: ElementRef,
  });

  @HostListener('window:resize', ['$event'])
  public windowResize(event: Event) {
    const { innerWidth, innerHeight } = event.target as Window;
    this.backgroundDrawer.resize(innerWidth, innerHeight);
  }

  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  private backgroundDrawer = inject(BACKGROUND_DRAWER);

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const { innerWidth, innerHeight } = this.document.defaultView;

      const context = this.canvasRef().nativeElement.getContext('2d');
      this.backgroundDrawer.initialize(context, innerWidth, innerHeight);
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.canvasWidth = this.document.defaultView.innerWidth;
      this.canvasHeight = this.document.defaultView.innerHeight;
    }
  }
}
