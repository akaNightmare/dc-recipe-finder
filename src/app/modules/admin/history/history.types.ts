import { BannedIngredientList } from '../../../../store/banned-ingredient-lists/banned-ingredient-lists.types';
import { Recipe } from '../../../../store/recipes/recipes.types';

export interface History {
    recipes: Recipe[];
    banned_ingredient_lists: BannedIngredientList[];
}
