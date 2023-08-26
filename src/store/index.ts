import { IngredientsState } from './ingredients';
import { RecipesState } from './recipes';

export interface AppState {
    recipes?: RecipesState;
    ingredients?: IngredientsState;
}
