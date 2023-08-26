import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { addRecipe, deleteRecipe } from './recipes.actions';
import { selectRecipes } from './recipes.selectors';
import { Recipe } from './recipes.types';

@Injectable({ providedIn: 'root' })
export class RecipesFacade {
    private readonly store = inject(Store);

    readonly recipes$ = this.store.select<Recipe[]>(selectRecipes);

    addRecipe(recipe: Recipe): void {
        this.store.dispatch(addRecipe({ recipe }));
    }

    removeRecipe(name: string): void {
        this.store.dispatch(deleteRecipe({ name }));
    }
}
