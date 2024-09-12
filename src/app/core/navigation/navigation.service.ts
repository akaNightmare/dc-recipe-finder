import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Navigation } from './navigation.types';
import { Observable, ReplaySubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    readonly #httpClient = inject(HttpClient);
    readonly #navigation = new ReplaySubject<Navigation>(1);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for navigation
     */
    get navigation$(): Observable<Navigation> {
        return this.#navigation.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all navigation data
     */
    get(): Observable<Navigation> {
        return this.#httpClient.get<Navigation>('api/common/navigation').pipe(
            tap((navigation) => {
                this.#navigation.next(navigation);
            })
        );
    }
}
