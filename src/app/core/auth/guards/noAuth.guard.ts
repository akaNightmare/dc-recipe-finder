import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { map } from 'rxjs';

export const NoAuthGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router: Router = inject(Router);

    // Check the authentication status
    return inject(AuthService)
        .check()
        .pipe(
            map(authenticated => {
                return authenticated ? router.parseUrl(''):  true;
            }),
        );
};
