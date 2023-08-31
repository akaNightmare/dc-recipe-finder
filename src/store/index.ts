import { IngredientListsState } from './ingredient-lists';
import { IngredientsState } from './ingredients';
import { RecipesState } from './recipes';

export interface AppState {
    recipes?: RecipesState;
    ingredients?: IngredientsState;
    ingredient_lists?: IngredientListsState;
}
