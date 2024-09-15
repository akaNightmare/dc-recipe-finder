import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { MeGQL, MeQuery } from './user.generated';

export type User = MeQuery['me'];

@Injectable({ providedIn: 'root' })
export class UserService {
    readonly #meGQL = inject(MeGQL);

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the current signed-in user data
     */
    get(): Observable<User> {
        return this.#meGQL.fetch().pipe(map(({ data }) => data.me));
    }
}
