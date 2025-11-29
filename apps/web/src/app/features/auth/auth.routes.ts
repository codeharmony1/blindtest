import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(c => c.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then(c => c.ResetPasswordComponent)
  },
  {
    path: 'reset-password-sent',
    loadComponent: () => import('./reset-password-sent/reset-password-sent.component').then(c => c.ResetPasswordSentComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];