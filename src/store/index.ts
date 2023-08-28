import { BannedIngredientListsState } from './banned-ingredient-lists';
import { IngredientsState } from './ingredients';
import { RecipesState } from './recipes';

export interface AppState {
    recipes?: RecipesState;
    ingredients?: IngredientsState;
    banned_ingredient_lists?: BannedIngredientListsState;
}
