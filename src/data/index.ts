import { BannedIngredientList } from '../store/banned-ingredient-lists/banned-ingredient-lists.types';
import { Ingredient } from '../store/ingredients/ingredients.types';
import { Recipe } from '../store/recipes/recipes.types';
import bannedIngredientListsData from './banned_ingredient_lists.json';
import ingredientsData from './ingredients.json';
import recipesData from './recipes.json';

export const ingredients = ingredientsData as Ingredient[];
export const recipes = recipesData as Recipe[];
export const bannedIngredientLists = bannedIngredientListsData as BannedIngredientList[];
