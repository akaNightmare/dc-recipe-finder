import { ActionReducer, createReducer, on } from '@ngrx/store';

import { addIngredientList, addIngredientLists, deleteIngredientList } from './ingredient-lists.actions';
import { adapter, IngredientListsState, initialState, selectId } from './ingredient-lists.state';

export const ingredientListsReducers: ActionReducer<IngredientListsState> = createReducer(
    initialState,
    on(addIngredientList, (state: IngredientListsState, { ingredient_list }) => adapter.addOne(ingredient_list, state)),
    on(addIngredientLists, (state: IngredientListsState, { ingredient_lists }) =>
        adapter.addMany(ingredient_lists, state),
    ),
    on(deleteIngredientList, (state: IngredientListsState, { ingredient_list }) =>
        adapter.removeOne(selectId(ingredient_list), state),
    ),
);
