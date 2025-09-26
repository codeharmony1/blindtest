import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'rounds',
        loadComponent: () =>
          import('./rounds/rounds-hub.component').then((m) => m.RoundsHubComponent),
      },
      {
        path: 'events',
        loadComponent: () =>
          import('./events/events-list.component').then((m) => m.EventsListComponent),
      },
      {
        path: 'events/new',
        loadComponent: () =>
          import('./events/event-form.component').then((m) => m.EventFormComponent),
      },
      {
        path: 'events/:id',
        loadComponent: () =>
          import('./events/event-detail.component').then((m) => m.EventDetailComponent),
      },
      {
        path: 'events/:id/edit',
        loadComponent: () =>
          import('./events/event-form.component').then((m) => m.EventFormComponent),
      },
      {
        path: 'events/:eventId/rounds',
        loadComponent: () =>
          import('./rounds/rounds-list.component').then((m) => m.RoundsListComponent),
      },
      {
        path: 'events/:eventId/rounds/new',
        loadComponent: () =>
          import('./rounds/round-form.component').then((m) => m.RoundFormComponent),
      },
      {
        path: 'events/:eventId/rounds/:roundId',
        loadComponent: () =>
          import('./rounds/songs-manager.component').then((m) => m.SongsManagerComponent),
      },
      {
        path: 'events/:eventId/rounds/:roundId/edit',
        loadComponent: () =>
          import('./rounds/round-form.component').then((m) => m.RoundFormComponent),
      },
      {
        path: 'rounds/:id/edit',
        loadComponent: () =>
          import('./rounds/round-form.component').then((m) => m.RoundFormComponent),
      },
      {
        path: 'rounds/:id/songs',
        loadComponent: () =>
          import('./rounds/songs-manager.component').then((m) => m.SongsManagerComponent),
      },
      {
        path: 'events/:code/themes',
        loadComponent: () =>
          import('./theme-selector.component').then((m) => m.ThemeSelectorComponent),
      },
      {
        path: 'events/:code/settings',
        loadComponent: () =>
          import('./event-settings.component').then((m) => m.EventSettingsComponent),
      },
      {
        path: 'import-export',
        loadComponent: () =>
          import('./import-export.component').then((m) => m.ImportExportComponent),
      },
    ],
  },
];
