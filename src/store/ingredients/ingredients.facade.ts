import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ingredients } from '../../data';
import { addIngredient, addIngredients } from './ingredients.actions';
import { selectIngredients } from './ingredients.selectors';
import { Ingredient } from './ingredients.types';

@Injectable({ providedIn: 'root' })
export class IngredientsFacade {
    private readonly store = inject(Store);

    readonly ingredients$ = this.store.select<Ingredient[]>(selectIngredients);

    constructor() {
        this.addIngredients(ingredients);
    }

    addIngredient(ingredient: Ingredient): void {
        this.store.dispatch(addIngredient({ ingredient }));
    }

    addIngredients(ingredients: Ingredient[]): void {
        this.store.dispatch(addIngredients({ ingredients }));
    }
}
