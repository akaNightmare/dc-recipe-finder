import S from 'fluent-json-schema';

import { RecipeStatus } from '../../../store/recipes/recipes.types';
import { ingredientSchema } from './ingredient.schema';

const recipeIngredientSchema = S.object()
    .additionalProperties(false)
    .prop('count', S.integer().minimum(1).maximum(100))
    .required(['count'])
    .extend(ingredientSchema);

const baseRecipeSchema = S.object()
    .additionalProperties(false)
    .prop('added_at', S.integer().minimum(0))
    .prop('ingredients', S.array().items(recipeIngredientSchema).minItems(1).maxItems(6))
    .required(['added_at', 'ingredients']);

export const recipeSchema = S.anyOf([
    S.object().prop('status', S.string().const(RecipeStatus.FAILED)).required(['status']).extend(baseRecipeSchema),
    S.object()
        .prop('status', S.enum(Object.values(RecipeStatus).filter(status => status !== RecipeStatus.FAILED)))
        .prop('name', S.string())
        .prop('count_from', S.integer().minimum(1))
        .prop('count_to', S.integer().minimum(1))
        .required(['status', 'name', 'count_from', 'count_to'])
        .extend(baseRecipeSchema),
]);
