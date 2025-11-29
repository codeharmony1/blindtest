import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { DJAuthService } from '../services/dj-auth.service';

export const djAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(DJAuthService);
  const token = authService.getToken();

  // Ajouter le token seulement si présent et pour les requêtes API
  if (token && req.url.startsWith('/api/')) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  return next(req);
};
