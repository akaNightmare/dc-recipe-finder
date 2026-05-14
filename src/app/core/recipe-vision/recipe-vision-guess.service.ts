import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RecipeStatus } from '../../graphql.generated';

export type RecipeVisionGuessApiResponse = {
    ingredients?: Array<{ ingredient_id: string; count: number }>;
    error?: string;
    message?: string;
};

export type RecipeGuessDialogPayload = {
    ingredients: Array<{
        count: number;
        ingredient: { id: string };
    }>;
};

@Injectable({ providedIn: 'root' })
export class RecipeVisionGuessService {
    readonly #http = inject(HttpClient);

    guessFromImage(file: File): Observable<RecipeGuessDialogPayload> {
        const base = environment.recipeVisionApiUrl.replace(/\/+$/, '');
        const url = `${base}/guess`;
        const body = new FormData();
        body.append('image', file, file.name);

        return this.#http.post<RecipeVisionGuessApiResponse>(url, body).pipe(
            map(res => {
                if (res && typeof res === 'object' && 'error' in res && res.error) {
                    throw new Error(res.message ?? res.error);
                }
                const ingredients = res?.ingredients;
                if (!Array.isArray(ingredients)) {
                    throw new Error('Invalid vision response: missing ingredients');
                }
                return {
                    ingredients: ingredients.map(({ ingredient_id, count }) => ({
                        count: count ?? 1,
                        ingredient: { id: ingredient_id },
                    })),
                };
            }),
            catchError((err: unknown) => {
                let message = 'Recipe vision request failed';
                if (err instanceof HttpErrorResponse) {
                    const b = err.error;
                    if (b && typeof b === 'object') {
                        if ('message' in b && typeof (b as { message: unknown }).message === 'string') {
                            message = (b as { message: string }).message;
                        } else if ('error' in b && typeof (b as { error: unknown }).error === 'string') {
                            message = (b as { error: string }).error;
                        } else {
                            message = err.message || message;
                        }
                    } else {
                        message = err.message || message;
                    }
                } else if (err instanceof Error) {
                    message = err.message;
                }
                return throwError(() => new Error(message));
            }),
        );
    }

    buildDraftRecipeFromGuess(guess: RecipeGuessDialogPayload) {
        return {
            name: '-',
            status: RecipeStatus.Failed,
            ingredients: guess.ingredients,
        };
    }
}
