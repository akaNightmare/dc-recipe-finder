import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { map } from 'rxjs';

export const AuthGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router: Router = inject(Router);

    // Check the authentication status
    return inject(AuthService)
        .check()
        .pipe(
            map(authenticated => {
                // If the user is not authenticated...
                if (!authenticated) {
                    // Redirect to the sign-in page with a redirectUrl param
                    const redirectURL = state.url === '/sign-out' ? '' : `redirectURL=${state.url}`;
                    return router.parseUrl(`sign-in?${redirectURL}`);
                }

                // Allow the access
                return true;
            }),
        );
};
