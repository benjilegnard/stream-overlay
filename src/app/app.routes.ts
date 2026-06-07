import { Routes } from '@angular/router';
import { OverlayComponent } from './pages/overlay/overlay.component';
import { BackgroundComponent } from './pages/background/background.component';

import { BACKGROUND_DRAWER } from './shared/services/background-drawer.token';
import { ClosestNodeBackground } from './shared/services/backgrounds/closest-node-background.service';
import { DelaunayBackground } from './shared/services/backgrounds/delaunay-background.service';
import { HexagonBackground } from './shared/services/backgrounds/hexagon-background';

export const routes: Routes = [
  { path: '', redirectTo: 'overlay', pathMatch: 'full' },
  { path: 'overlay', component: OverlayComponent },
  {
    path: 'background',
    children: [
      { path: '', redirectTo: 'default', pathMatch: 'full' },
      {
        path: 'default',
        component: BackgroundComponent,
        providers: [
          {
            provide: BACKGROUND_DRAWER,
            useClass: ClosestNodeBackground,
          },
        ],
      },
      {
        path: 'delaunay',
        component: BackgroundComponent,
        providers: [{ provide: BACKGROUND_DRAWER, useClass: DelaunayBackground }],
      },
      {
        path: 'hexagon',
        component: BackgroundComponent,
        providers: [{ provide: BACKGROUND_DRAWER, useClass: HexagonBackground }],
      },
    ],
  },
];
