import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {
    PreloadAllModules,
    provideRouter,
    withInMemoryScrolling,
    withPreloading,
} from '@angular/router';

import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideFuse } from '@fuse/fuse.provider';
import { provideApollo } from './apollo.provider';
import { routes } from './app.routes';
import { provideAuth } from './core/auth/auth.provider';
import { provideIcons } from './core/icons/icons.provider';
import { mockApiServices } from './mock-api';

export const appConfig: ApplicationConfig = {
    providers: [
        provideAnimations(),
        provideHttpClient(),
        provideApollo(),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(
            routes,
            withPreloading(PreloadAllModules),
            withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
        ),
        provideAuth(),
        provideIcons(),

        provideFuse({
            mockApi: {
                delay: 0,
                services: mockApiServices,
            },
            fuse: {
                layout: 'classy',
                scheme: 'light',
                screens: {
                    sm: '600px',
                    md: '960px',
                    lg: '1280px',
                    xl: '1440px',
                },
                theme: 'theme-default',
                themes: [
                    {
                        id: 'theme-default',
                        name: 'Default',
                    },
                    {
                        id: 'theme-brand',
                        name: 'Brand',
                    },
                    {
                        id: 'theme-teal',
                        name: 'Teal',
                    },
                    {
                        id: 'theme-rose',
                        name: 'Rose',
                    },
                    {
                        id: 'theme-purple',
                        name: 'Purple',
                    },
                    {
                        id: 'theme-amber',
                        name: 'Amber',
                    },
                ],
            },
        }),
    ],
};
