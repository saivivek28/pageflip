import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideClientHydration } from '@angular/platform-browser';

export const config: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideClientHydration()
  ]
};
