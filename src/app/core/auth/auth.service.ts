import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { filter, Observable, of, switchMap, throwError } from 'rxjs';
import { AuthOutput } from '../../graphql.generated';
import { SignInGQL } from './auth.generated';
import { AuthUtils } from './auth.utils';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private authenticated = false;

    private readonly apollo = inject(Apollo);
    private readonly signInGQL = inject(SignInGQL);

    setAccessToken(token: string): void {
        localStorage.setItem('accessToken', token);
    }

    getAccessToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    /**
     * Sign in
     */
    signIn(credentials: { login: string; password: string }): Observable<AuthOutput> {
        // Throw error if the user is already logged in
        if (this.authenticated) {
            return throwError(() => new Error('User is already logged in.'));
        }

        return this.signInGQL
            .mutate({
                auth: {
                    login: credentials.login,
                    password: credentials.password,
                },
            })
            .pipe(
                filter(result => !!result.data),
                switchMap(({ data }) => {
                    const { signIn } = data!;
                    // Store the access token in the local storage
                    this.setAccessToken(signIn.access_token);

                    // Set the authenticated flag to true
                    this.authenticated = true;

                    // Return a new observable with the response
                    return of(signIn);
                }),
            );
    }

    signOut(): Observable<void> {
        this.clearState();
        return of();
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        // Check if the user is logged in
        if (this.authenticated) {
            return of(true);
        }

        const accessToken = this.getAccessToken();
        // Check the access token availability
        if (!accessToken) {
            this.clearState();
            return of(false);
        }

        // Check the access token expire date
        const expirationDate = AuthUtils.getTokenExpirationDate(accessToken);

        if (!expirationDate || Number(expirationDate) <= Date.now()) {
            this.clearState();
            return of(false);
        }

        return of(true);
    }

    public clearState(): void {
        // Reset apollo store
        void this.apollo.client.resetStore();

        // Remove the access token from the local storage
        localStorage.removeItem('accessToken');

        // Set the authenticated flag to false
        this.authenticated = false;
    }
}
