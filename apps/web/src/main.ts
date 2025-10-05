import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { DjErrorInterceptor } from './app/core/interceptors/dj-error.interceptor';
import { tenantAuthInterceptor } from './app/core/interceptors/tenant-auth.interceptor';
import { superAdminAuthInterceptor } from './app/core/interceptors/super-admin-auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      // Super-admin interceptor en PREMIER pour traiter /api/backstage avant tenant
      withInterceptors([superAdminAuthInterceptor, tenantAuthInterceptor]),
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: DjErrorInterceptor,
      multi: true,
    },
  ],
}).catch((err) => console.error(err));
