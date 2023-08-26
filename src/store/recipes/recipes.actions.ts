import { createAction, props } from '@ngrx/store';
import { Recipe } from './recipes.types';

export const recipesKey = '[RECIPES]';

export const addRecipe = createAction(
    `${recipesKey} Add Recipe`,
    props<{ recipe: Recipe }>()
);

export const deleteRecipe = createAction(
    `${recipesKey} Delete Recipe`,
    props<{ name: string }>()
);
