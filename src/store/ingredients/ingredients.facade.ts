import { Store } from '@ngrx/store';
import { inject, Injectable } from '@angular/core';

import { Ingredient } from './ingredients.types';
import { addIngredient } from './ingredients.actions';
import { selectIngredients } from './ingredients.selectors';
import baseIngredients from './data.json';

@Injectable({ providedIn: 'root' })
export class IngredientsFacade {
    private readonly store = inject(Store);

    readonly ingredients$ = this.store.select<Ingredient[]>(selectIngredients);

    constructor() {
        for (const ingredient of baseIngredients) {
            this.addIngredient(ingredient);
        }
    }

    addIngredient(ingredient: Ingredient): void {
        this.store.dispatch(addIngredient({ ingredient }));
    }
}
