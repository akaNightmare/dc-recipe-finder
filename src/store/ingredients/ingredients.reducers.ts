import { ActionReducer, createReducer, on } from '@ngrx/store';

import { addIngredient, addIngredients } from './ingredients.actions';
import { adapter, IngredientsState, initialState } from './ingredients.state';

export const ingredientsReducers: ActionReducer<IngredientsState> = createReducer(
    initialState,
    on(addIngredient, (state: IngredientsState, { ingredient }) => adapter.addOne(ingredient, state)),
    on(addIngredients, (state: IngredientsState, { ingredients }) => adapter.addMany(ingredients, state)),
);
