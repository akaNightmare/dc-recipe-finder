import { ActionReducer, createReducer, on } from '@ngrx/store';
import { adapter, initialState, RecipesState } from './recipes.state';
import { addRecipe, deleteRecipe } from './recipes.actions';

export const recipesReducers: ActionReducer<RecipesState> = createReducer(
    initialState,
    on(addRecipe, (state: RecipesState, { recipe }) => adapter.addOne(recipe, state)),
    on(deleteRecipe, (state: RecipesState, { name }) => adapter.removeOne(name, state)),
);
