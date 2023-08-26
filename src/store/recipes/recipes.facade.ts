import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { recipes } from '../../data';
import { addRecipe, addRecipes, clearRecipes, deleteRecipe } from './recipes.actions';
import { selectRecipes } from './recipes.selectors';
import { Recipe } from './recipes.types';

@Injectable({ providedIn: 'root' })
export class RecipesFacade {
    private readonly store = inject(Store);

    readonly recipes$ = this.store.select<Recipe[]>(selectRecipes);

    constructor() {
        this.addRecipes(recipes);
    }

    addRecipe(recipe: Recipe): void {
        this.store.dispatch(addRecipe({ recipe }));
    }

    addRecipes(recipes: Recipe[]): void {
        this.store.dispatch(addRecipes({ recipes }));
    }

    removeRecipe(name: string): void {
        this.store.dispatch(deleteRecipe({ name }));
    }

    clearRecipes(): void {
        this.store.dispatch(clearRecipes());
    }
}
