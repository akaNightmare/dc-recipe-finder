import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@ngneat/transloco';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
    readonly #httpClient = inject(HttpClient);

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get translation
     *
     * @param lang
     */
    getTranslation(lang: string): Observable<Translation> {
        return this.#httpClient.get<Translation>(`./i18n/${lang}.json`);
    }
}
