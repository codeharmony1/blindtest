import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SuperAdminService } from '../services/super-admin.service';

export const superAdminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const superAdminService = inject(SuperAdminService);

  // N'ajouter le token que pour les requêtes vers /api/backstage
  if (req.url.includes('/api/backstage')) {
    const token = superAdminService.getToken();
    console.log(
      '🔐 Super-admin interceptor - Token:',
      token ? 'PRESENT' : 'ABSENT',
      'URL:',
      req.url,
    );

    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('✅ Authorization header added for', req.url);
      return next(cloned);
    } else {
      console.warn('⚠️ No super-admin token found for', req.url);
    }
  }

  return next(req);
};
