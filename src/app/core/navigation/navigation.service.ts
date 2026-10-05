import { Injectable } from '@angular/core';
import { Observable, of, ReplaySubject, tap } from 'rxjs';
import { createAppNavigation } from './navigation.data';
import { Navigation } from './navigation.types';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  readonly #navigation = new ReplaySubject<Navigation>(1);

  get navigation$(): Observable<Navigation> {
    return this.#navigation.asObservable();
  }

  get(): Observable<Navigation> {
    const navigation = createAppNavigation();

    return of(navigation).pipe(
      tap((value) => {
        this.#navigation.next(value);
      }),
    );
  }
}
