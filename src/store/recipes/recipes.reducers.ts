import { ActionReducer, createReducer, on } from '@ngrx/store';

import { addRecipe, addRecipes, clearRecipes, deleteRecipe } from './recipes.actions';
import { adapter, initialState, RecipesState } from './recipes.state';

export const recipesReducers: ActionReducer<RecipesState> = createReducer(
    initialState,
    on(addRecipe, (state: RecipesState, { recipe }) => adapter.addOne(recipe, state)),
    on(addRecipes, (state: RecipesState, { recipes }) => adapter.addMany(recipes, state)),
    on(deleteRecipe, (state: RecipesState, { name }) => adapter.removeOne(name, state)),
    on(clearRecipes, (state: RecipesState) => adapter.removeAll(state)),
);
