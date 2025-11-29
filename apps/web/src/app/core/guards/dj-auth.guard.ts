import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { DJAuthService } from '../services/dj-auth.service';

export const djAuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(DJAuthService);
  const router = inject(Router);

  // Vérifier si authentifié
  if (!authService.isAuthenticated()) {
    // Récupérer le eventCode de la route (ex: /dj/ABC123)
    const eventCode = route.paramMap.get('eventCode');

    // Rediriger vers la page de login DJ avec le code événement
    router.navigate(['/dj-login'], {
      queryParams: { eventCode: eventCode || '' }
    });
    return false;
  }

  // Vérifier que l'événement du token correspond à l'URL
  const currentEvent = authService.getCurrentEvent();
  const routeEventCode = route.paramMap.get('eventCode');

  if (currentEvent && routeEventCode && currentEvent.code !== routeEventCode.toUpperCase()) {
    // Code événement ne correspond pas au token
    console.warn('[DJ Guard] Event code mismatch:', currentEvent.code, '!=', routeEventCode);
    router.navigate(['/dj-login'], {
      queryParams: { eventCode: routeEventCode }
    });
    return false;
  }

  return true;
};
