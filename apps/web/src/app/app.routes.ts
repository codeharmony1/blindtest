import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((c) => c.HomeComponent),
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then((c) => c.HomeComponent),
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: 'join/:eventCode',
    loadChildren: () => import('./features/player/player.routes').then((m) => m.PLAYER_ROUTES),
  },
  {
    path: 'dj/:eventCode',
    loadChildren: () => import('./features/dj/dj.routes').then((m) => m.DJ_ROUTES),
  },
  {
    path: 'display/:eventCode',
    loadChildren: () => import('./features/display/display.routes').then((m) => m.DISPLAY_ROUTES),
  },
  { path: '**', redirectTo: 'admin' },
];
