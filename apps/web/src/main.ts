import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { DjErrorInterceptor } from './app/core/interceptors/dj-error.interceptor';
import { tenantAuthInterceptor } from './app/core/interceptors/tenant-auth.interceptor';
import { superAdminAuthInterceptor } from './app/core/interceptors/super-admin-auth.interceptor';
import { tokenRefreshInterceptor } from './app/core/interceptors/token-refresh.interceptor';
import { djAuthInterceptor } from './app/core/interceptors/dj-auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      // Token refresh interceptor en PREMIER pour gérer les 401 avant tout
      // Super-admin interceptor en SECOND pour traiter /api/backstage avant tenant
      // DJ auth interceptor en TROISIEME pour traiter l'auth DJ par PIN
      // Tenant interceptor en DERNIER pour injecter le token sur les routes normales
      withInterceptors([tokenRefreshInterceptor, superAdminAuthInterceptor, djAuthInterceptor, tenantAuthInterceptor]),
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: DjErrorInterceptor,
      multi: true,
    },
  ],
}).catch((err) => console.error(err));
