import { IngredientList } from '../../../../store/ingredient-lists/ingredient-lists.types';
import { Recipe } from '../../../../store/recipes/recipes.types';

export interface History {
    recipes: Recipe[];
    ingredient_lists: IngredientList[];
}
