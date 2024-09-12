import { inject, Injectable } from '@angular/core';
import { map, Observable, ReplaySubject, tap } from 'rxjs';
import { MeGQL, MeQuery } from './me.generated';

export type User = MeQuery['me'];

@Injectable({ providedIn: 'root' })
export class UserService {
    readonly #meGQL = inject(MeGQL);
    readonly #user = new ReplaySubject<User>(1);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------
    get user$(): Observable<User> {
        return this.#user.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the current signed-in user data
     */
    get(): Observable<User> {
        return this.#meGQL.fetch().pipe(
            map(({ data }) => data.me),
            tap(user => {
                this.#user.next(user);
            }),
        );
    }
}
