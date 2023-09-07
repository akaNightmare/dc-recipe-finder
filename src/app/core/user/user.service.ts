import { inject, Injectable } from '@angular/core';
import { User } from 'app/core/user/user.types';
import { map, Observable, of, ReplaySubject, tap } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';

@Injectable({ providedIn: 'root' })
export class UserService {
    private _user = new ReplaySubject<User>(1);
    private supabaseClient = inject(SupabaseService).client;

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

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the current logged-in user data
     */
    get(): Observable<User> {
        return fromPromise(this.supabaseClient.auth.getUser()).pipe(
            map(res => res.data.user),
            tap(user => {
                this._user.next(user);
            }),
        );
    }

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
