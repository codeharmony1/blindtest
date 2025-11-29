import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantAuthService } from '../services/tenant-auth.service';

export const tenantAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(TenantAuthService);

  // Ne pas injecter le token tenant sur les routes super-admin
  // afin de ne pas écraser le token SUPER ADMIN attendu par le backend
  if (req.url.includes('/api/backstage')) {
    return next(req);
  }

  // Ne pas injecter le token tenant sur les routes qui nécessitent un token player
  // (les requêtes player passent leur propre token via le service API)
  // Uniquement pour POST /api/songs/:id/answers (soumission de réponses)
  if (req.url.includes('/api/songs/') && req.url.includes('/answers')) {
    return next(req);
  }

  // Vérifier si on est en mode impersonation (prioritaire)
  const impersonationToken = localStorage.getItem('bt_impersonation_token');

  const token = impersonationToken || authService.getToken();

  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
    return next(authReq);
  }

  return next(req);
};
