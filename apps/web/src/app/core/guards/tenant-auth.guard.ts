import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantAuthService } from '../services/tenant-auth.service';

export const tenantAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(TenantAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Rediriger vers la page de connexion avec l'URL de retour
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};