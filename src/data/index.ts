import ingredientsData from './ingredients.json';
import recipesData from './recipes.json';

import { Ingredient } from '../store/ingredients/ingredients.types';
import { Recipe } from '../store/recipes/recipes.types';

export const ingredients = ingredientsData as Ingredient[];
export const recipes = recipesData as Recipe[];
