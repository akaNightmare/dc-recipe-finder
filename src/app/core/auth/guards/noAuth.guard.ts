import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth.service';

export const NoAuthGuard: CanActivateFn | CanActivateChildFn = () => {
    const router: Router = inject(Router);

    // Check the authentication status
    return inject(AuthService)
        .check()
        .pipe(map((authenticated) => (authenticated ? router.parseUrl('') : true)));
};
