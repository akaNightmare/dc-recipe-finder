import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { recipes } from '../../data';
import { addRecipe, addRecipes, clearRecipes, deleteRecipe } from './recipes.actions';
import { selectCustomRecipes, selectRecipes } from './recipes.selectors';
import { Recipe } from './recipes.types';

@Injectable({ providedIn: 'root' })
export class RecipesFacade {
    private readonly store = inject(Store);

    readonly recipes$ = this.store.select<Recipe[]>(selectRecipes);
    readonly customRecipes$ = this.store.select<Recipe[]>(selectCustomRecipes);

    constructor() {
        this.addRecipes(recipes);
    }

    addRecipe(recipe: Recipe): void {
        this.store.dispatch(addRecipe({ recipe }));
    }

    addRecipes(recipes: Recipe[]): void {
        this.store.dispatch(addRecipes({ recipes }));
    }

    removeRecipe(recipe: Recipe): void {
        this.store.dispatch(deleteRecipe({ recipe }));
    }

    clearRecipes(): void {
        this.store.dispatch(clearRecipes());
    }
}
