import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take, Observable } from 'rxjs';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';

/**
 * Interceptor HTTP pour gérer automatiquement le refresh des tokens expirés
 *
 * Fonctionnement :
 * 1. Détecte les erreurs 401 (Unauthorized)
 * 2. Tente de rafraîchir le token avec le refresh token stocké
 * 3. Rejoue la requête initiale avec le nouveau token
 * 4. Si échec du refresh, déconnecte l'utilisateur
 *
 * Amélioration : Évite les appels multiples simultanés au refresh endpoint
 * en utilisant un BehaviorSubject pour partager le statut de refresh
 */

// Variable globale pour gérer le refresh en cours
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const apiService = inject(ApiService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si erreur 401 et que ce n'est pas déjà une tentative de refresh/login
      if (error.status === 401 && !isExcludedUrl(req.url)) {

        const refreshToken = localStorage.getItem('bt_refresh_token');

        if (!refreshToken) {
          // Pas de refresh token, rediriger vers login
          handleLogout(router);
          return throwError(() => error);
        }

        // Si un refresh est déjà en cours, attendre qu'il se termine
        if (isRefreshing) {
          return waitForTokenRefresh(req, next);
        }

        // Sinon, commencer le refresh
        return handleTokenRefresh(req, next, refreshToken, apiService, router);
      }

      return throwError(() => error);
    })
  );
};

/**
 * Vérifie si l'URL doit être exclue du refresh automatique
 */
function isExcludedUrl(url: string): boolean {
  const excludedPaths = [
    '/auth/refresh',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password'
  ];

  return excludedPaths.some(path => url.includes(path));
}

/**
 * Attend la fin du refresh en cours et rejoue la requête
 */
function waitForTokenRefresh(req: any, next: any): Observable<any> {
  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap((token) => {
      // Rejouer la requête avec le nouveau token
      const clonedReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next(clonedReq);
    })
  );
}

/**
 * Gère le processus de refresh du token
 */
function handleTokenRefresh(
  req: any,
  next: any,
  refreshToken: string,
  apiService: ApiService,
  router: Router
): Observable<any> {
  isRefreshing = true;
  refreshTokenSubject.next(null);

  return apiService.refreshToken(refreshToken).pipe(
    switchMap((response) => {
      isRefreshing = false;

      // Sauvegarder les nouveaux tokens
      const newAccessToken = response.accessToken;
      localStorage.setItem('bt_access_token', newAccessToken);
      localStorage.setItem('bt_refresh_token', response.refreshToken);

      // Notifier les autres requêtes en attente
      refreshTokenSubject.next(newAccessToken);

      // Cloner et rejouer la requête avec le nouveau token
      const clonedReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${newAccessToken}`)
      });

      return next(clonedReq);
    }),
    catchError((refreshError) => {
      isRefreshing = false;
      refreshTokenSubject.next(null);

      // Échec du refresh, déconnecter l'utilisateur
      console.error('Token refresh failed:', refreshError);
      handleLogout(router);
      return throwError(() => refreshError);
    })
  );
}

/**
 * Déconnexion et nettoyage
 */
function handleLogout(router: Router): void {
  // Nettoyer tous les tokens
  localStorage.removeItem('bt_access_token');
  localStorage.removeItem('bt_refresh_token');
  localStorage.removeItem('bt_tenant_token');
  localStorage.removeItem('tenant_auth_token');
  localStorage.removeItem('bt_impersonation_token');
  localStorage.removeItem('bt_super_admin_token');

  // Rediriger vers la page de connexion
  router.navigate(['/auth/login'], {
    queryParams: { sessionExpired: 'true' }
  });
}
