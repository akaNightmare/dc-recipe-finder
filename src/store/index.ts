import { RecipesState } from './recipes';
import { IngredientsState } from './ingredients';

export interface AppState {
    recipes?: RecipesState;
    ingredients?: IngredientsState;
}
