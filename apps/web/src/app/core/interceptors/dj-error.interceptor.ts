import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { catchError, EMPTY } from 'rxjs';

@Injectable()
export class DjErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // Intercepter seulement les requêtes vers les endpoints DJ
    if (this.isDjApiCall(req.url)) {
      return next.handle(req).pipe(
        catchError((error: HttpErrorResponse) => {
          // Empêcher l'affichage des erreurs 404/409 dans la console pour les opérations DJ
          if (error.status === 404 || error.status === 409) {
            // Log propre sans stack trace
            console.warn(
              `[DJ API] ${error.status} ${error.statusText} sur ${req.method} ${req.url}`,
            );
            // Retourner une erreur silencieuse que notre composant peut gérer
            throw error;
          }
          // Pour les autres erreurs, les laisser passer normalement
          throw error;
        }),
      );
    }

    return next.handle(req);
  }

  private isDjApiCall(url: string): boolean {
    return (
      (url.includes('/api/songs/') &&
        (url.includes('/open') ||
          url.includes('/close') ||
          url.includes('/grade') ||
          !!url.match(/\/api\/songs\/\d+$/))) || // PATCH /api/songs/{id}
      url.includes('/api/rounds/') && url.includes('/next') // POST /api/rounds/{id}/next
    );
  }
}
