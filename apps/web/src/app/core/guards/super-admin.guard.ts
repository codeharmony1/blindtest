import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SuperAdminService } from '../services/super-admin.service';

export const superAdminGuard: CanActivateFn = (route, state) => {
  const superAdminService = inject(SuperAdminService);
  const router = inject(Router);

  if (superAdminService.isAuthenticated()) {
    return true;
  }

  // Rediriger vers la page de login si non authentifié
  router.navigate(['/backstage/login']);
  return false;
};
