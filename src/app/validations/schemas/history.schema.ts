import S from 'fluent-json-schema';

import { ingredientListSchema } from './ingredient-list.schema';
import { recipeSchema } from './recipe.schema';

export const historySchema = S.object()
    .additionalProperties(false)
    .prop('recipes', S.array().items(recipeSchema))
    .prop('ingredient_lists', S.array().items(ingredientListSchema))
    .required(['recipes', 'ingredient_lists']);
