import { Routes } from '@angular/router';
import { tenantAuthGuard } from './core/guards/tenant-auth.guard';

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
    path: 'pricing',
    loadComponent: () => import('./features/pricing/pricing.component').then((c) => c.PricingComponent),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
    canActivate: [tenantAuthGuard],
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
  {
    path: 'backstage',
    loadChildren: () => import('./features/super-admin/super-admin.routes').then((m) => m.SUPER_ADMIN_ROUTES),
  },
  { path: '**', redirectTo: 'admin' },
];
