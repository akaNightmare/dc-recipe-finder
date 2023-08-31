import { IngredientList } from '../store/ingredient-lists/ingredient-lists.types';
import { Ingredient } from '../store/ingredients/ingredients.types';
import { Recipe } from '../store/recipes/recipes.types';
import ingredientListsData from './ingredient_lists.json';
import ingredientsData from './ingredients.json';
import recipesData from './recipes.json';

export const ingredients = ingredientsData as Ingredient[];
export const recipes = recipesData as Recipe[];
export const ingredientLists = ingredientListsData as IngredientList[];
