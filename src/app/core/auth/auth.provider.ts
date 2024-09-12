import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, Provider, inject } from '@angular/core';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

export const provideAuth = (): Array<Provider | EnvironmentProviders> => {
    return [
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => inject(AuthService),
            multi: true,
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true,
        },
    ];
};
