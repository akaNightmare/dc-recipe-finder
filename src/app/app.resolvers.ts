import { inject } from '@angular/core';
import { NavigationService } from './core/navigation/navigation.service';

export const initialDataResolver = () => {
  const navigationService = inject(NavigationService);

  return navigationService.get();
};
