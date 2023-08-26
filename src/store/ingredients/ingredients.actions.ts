import { createAction, props } from '@ngrx/store';

import { Ingredient } from './ingredients.types';

export const ingredientsKey = '[INGREDIENTS]';

export const addIngredient = createAction(
    `${ingredientsKey} Add Ingredient`,
    props<{ ingredient: Ingredient }>()
);
