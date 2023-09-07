import { inject, Injectable } from '@angular/core';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { Observable, of, switchMap, throwError } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _authenticated = false;
    private readonly supabaseClient = inject(SupabaseService).client;

    /**
     * Constructor
     */
    constructor(
        private _userService: UserService,
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        return localStorage.getItem('accessToken') ?? '';
    }

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
    // resetPassword(password: string): Observable<any> {
    //     return this.supabaseService.post('api/auth/reset-password', password);
    // }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { email: string; password: string }): Observable<any> {
        // Throw error, if the user is already logged in
        if (this._authenticated) {
            return throwError('User is already logged in.');
        }

        return fromPromise(this.supabaseClient.auth.signInWithPassword(credentials)).pipe(
            switchMap((response) => {
                // Store the access token in the local storage
                this.accessToken = response.data.session.access_token;

                // Set the authenticated flag to true
                this._authenticated = true;

                // Store the user on the user service
                this._userService.user = response.data.user;

                // Return a new observable with the response
                return of(response);
            }),
        );
    }

    /**
     * Sign in using the access token
     */
    // signInUsingToken(): Observable<any> {
    //     // Sign in using the token
    //     return this.supabaseClient.auth.sign({  })
    //         .post('api/auth/sign-in-with-token', {
    //             accessToken: this.accessToken,
    //         })
    //         .pipe(
    //             catchError(() =>
    //                 // Return false
    //                 of(false),
    //             ),
    //             switchMap((response: any) => {
    //                 // Replace the access token with the new one if it's available on
    //                 // the response object.
    //                 //
    //                 // This is an added optional step for better security. Once you sign
    //                 // in using the token, you should generate a new one on the server
    //                 // side and attach it to the response object. Then the following
    //                 // piece of code can replace the token with the refreshed one.
    //                 if (response.accessToken) {
    //                     this.accessToken = response.accessToken;
    //                 }
    //
    //                 // Set the authenticated flag to true
    //                 this._authenticated = true;
    //
    //                 // Store the user on the user service
    //                 this._userService.user = response.user;
    //
    //                 // Return true
    //                 return of(true);
    //             }),
    //         );
    // }

    /**
     * Sign out
     */
    signOut(): Observable<any> {
        // Remove the access token from the local storage
        localStorage.removeItem('accessToken');

        // Set the authenticated flag to false
        this._authenticated = false;

        // Return the observable
        return of(true);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        // Check if the user is logged in
        if (this._authenticated) {
            return of(true);
        }

        // Check the access token availability
        if (!this.accessToken) {
            return of(false);
        }

        // Check the access token expire date
        if (AuthUtils.isTokenExpired(this.accessToken)) {
            return of(false);
        }

        // If the access token exists, and it didn't expire, sign in using it

        // TODO: return this.signInUsingToken();
        return of(true);
    }
}
