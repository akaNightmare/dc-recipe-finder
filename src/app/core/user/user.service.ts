import { inject, Injectable } from '@angular/core';
import { User } from 'app/core/user/user.types';
import { Observable, of, ReplaySubject } from 'rxjs';

import { SupabaseService } from '../../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class UserService {
    private readonly _user = new ReplaySubject<User>(1);
    private readonly supabaseClient = inject(SupabaseService).client;

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for user
     *
     * @param value
     */
    set user(value: User) {
        // Store the value
        this._user.next(value);
    }

    get user$(): Observable<User> {
        return this._user.asObservable();
    }

    constructor() {
        // Initialize Supabase user
        // Get initial user from the current session, if exists
        this.supabaseClient.auth.getUser().then(({ data, error }) => {
            this._user.next(data && data.user && !error ? data.user : null);

            // After the initial value is set, listen for auth state changes
            this.supabaseClient.auth.onAuthStateChange((event, session) => {
                this._user.next(session?.user ?? null);
            });
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Update the user
     *
     * @param user
     */
    update(user: User): Observable<any> {
        // TODO:
        return of({});
    }
}
