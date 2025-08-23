import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideCanActivate } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { AuthGuard } from './auth.guard';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideCanActivate(() => AuthGuard)
  ],
});
