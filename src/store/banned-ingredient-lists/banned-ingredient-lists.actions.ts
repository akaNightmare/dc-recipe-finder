import { createAction, props } from '@ngrx/store';

import { BannedIngredientList } from './banned-ingredient-lists.types';

export const bannedIngredientListsKey = '[BANNED INGREDIENT LISTS]';

export const addBannedIngredientList = createAction(
    `${bannedIngredientListsKey} Add banned ingredient list`,
    props<{ banned_ingredient_list: BannedIngredientList }>(),
);

export const addBannedIngredientLists = createAction(
    `${bannedIngredientListsKey} Add banned ingredient lists`,
    props<{ banned_ingredient_lists: BannedIngredientList[] }>(),
);
