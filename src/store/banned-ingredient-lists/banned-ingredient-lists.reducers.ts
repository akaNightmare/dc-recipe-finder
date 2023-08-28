import { ActionReducer, createReducer, on } from '@ngrx/store';

import {
    addBannedIngredientList,
    addBannedIngredientLists,
    deleteBannedIngredientList,
} from './banned-ingredient-lists.actions';
import { adapter, BannedIngredientListsState, initialState, selectId } from './banned-ingredient-lists.state';

export const bannedIngredientListsReducers: ActionReducer<BannedIngredientListsState> = createReducer(
    initialState,
    on(addBannedIngredientList, (state: BannedIngredientListsState, { banned_ingredient_list }) =>
        adapter.addOne(banned_ingredient_list, state),
    ),
    on(addBannedIngredientLists, (state: BannedIngredientListsState, { banned_ingredient_lists }) =>
        adapter.addMany(banned_ingredient_lists, state),
    ),
    on(deleteBannedIngredientList, (state: BannedIngredientListsState, { banned_ingredient_list }) =>
        adapter.removeOne(selectId(banned_ingredient_list), state),
    ),
);
