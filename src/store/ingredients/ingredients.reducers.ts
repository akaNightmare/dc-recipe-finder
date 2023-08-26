import { ActionReducer, createReducer, on } from '@ngrx/store';

import { adapter, initialState, IngredientsState } from './ingredients.state';
import { addIngredient } from './ingredients.actions';

export const ingredientsReducers: ActionReducer<IngredientsState> = createReducer(
    initialState,
    on(addIngredient, (state: IngredientsState, { ingredient }) => adapter.addOne(ingredient, state)),
);
