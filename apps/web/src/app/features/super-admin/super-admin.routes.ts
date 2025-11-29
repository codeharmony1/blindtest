import { Routes } from '@angular/router';
import { superAdminGuard } from '../../core/guards/super-admin.guard';

export const SUPER_ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login.component').then((c) => c.SuperAdminLoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/super-admin-layout.component').then((c) => c.SuperAdminLayoutComponent),
    canActivate: [superAdminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard-enhanced.component').then(
            (c) => c.SuperAdminDashboardEnhancedComponent,
          ),
      },
      {
        path: 'organizations',
        loadComponent: () =>
          import('./organizations.component').then((c) => c.SuperAdminOrganizationsComponent),
      },
      {
        path: 'events',
        loadComponent: () => import('./events.component').then((c) => c.SuperAdminEventsComponent),
      },
      {
        path: 'logs',
        loadComponent: () => import('./logs.component').then((c) => c.SuperAdminLogsComponent),
      },
    ],
  },
];
