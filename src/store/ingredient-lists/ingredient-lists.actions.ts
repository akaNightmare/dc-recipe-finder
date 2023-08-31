import { createAction, props } from '@ngrx/store';

import { IngredientList } from './ingredient-lists.types';

export const ingredientListsKey = '[INGREDIENT LISTS]';

export const addIngredientList = createAction(
    `${ingredientListsKey} Add ingredient list`,
    props<{ ingredient_list: IngredientList }>(),
);

export const updateIngredientList = createAction(
    `${ingredientListsKey} Update ingredient list`,
    props<{ id: string; ingredient_list: Partial<IngredientList> }>(),
);

export const addIngredientLists = createAction(
    `${ingredientListsKey} Add ingredient lists`,
    props<{ ingredient_lists: IngredientList[] }>(),
);

export const deleteIngredientList = createAction(
    `${ingredientListsKey} Delete ingredient list`,
    props<{ ingredient_list: IngredientList }>(),
);
