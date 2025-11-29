import { Routes } from '@angular/router';
import { LiveControlComponent } from './live-control.component';
import { djAuthGuard } from '../../core/guards/dj-auth.guard';

export const DJ_ROUTES: Routes = [
  {
    path: '',
    component: LiveControlComponent,
    canActivate: [djAuthGuard]
  }
];
