import { inject, Injectable } from '@angular/core';
import { UserService } from 'app/core/user/user.service';
import { first, map, Observable, switchMap, tap, throwError } from 'rxjs';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';

import { SupabaseService } from '../../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly supabaseClient = inject(SupabaseService).client;
    private readonly userService = inject(UserService);

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any> {
        return fromPromise(this.supabaseClient.auth.resetPasswordForEmail(email));
    }

    /**
     * Reset password
     *
     * @param password
     */
    resetPassword(password: string): Observable<any> {
        return fromPromise(this.supabaseClient.auth.updateUser({ password }));
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { email: string; password: string }): Observable<any> {
        return this.userService.user$.pipe(
            first(),
            switchMap(user => {
                if (user) {
                    return throwError(() => new Error('User is already logged in.'));
                }
                return this.supabaseClient.auth.signInWithPassword(credentials);
            }),
            map(({ data }) => data),
            tap(({ user }) => {
                if (user) {
                    this.userService.user = user;
                    void this.supabaseClient.auth.startAutoRefresh();
                }
            }),
        );
    }

    /**
     * Sign out
     */
    signOut(): Observable<void> {
        return fromPromise(this.supabaseClient.auth.signOut()).pipe(
            switchMap(() => this.supabaseClient.auth.stopAutoRefresh()),
        );
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        return this.userService.user$.pipe(map(user => !!user));
        // // Check if the user is logged in
        // if (this._authenticated) {
        //     return of(true);
        // }
        //
        // // Check the access token availability
        // if (!this.accessToken) {
        //     return of(false);
        // }
        //
        // // Check the access token expire date
        // if (AuthUtils.isTokenExpired(this.accessToken)) {
        //     return of(false);
        // }
        //
        // // If the access token exists, and it didn't expire, sign in using it
        //
        // // TODO: return this.signInUsingToken();
        // return of(true);
    }
}
