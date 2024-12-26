import { EnvironmentProviders, inject, Provider, provideEnvironmentInitializer } from '@angular/core';
import { IconsService } from './icons.service';

export const provideIcons = (): Array<Provider | EnvironmentProviders> => {
    return [
        provideEnvironmentInitializer(() => inject(IconsService)),
    ];
};
