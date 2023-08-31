import S from 'fluent-json-schema';

import { IngredientListType } from '../../../store/ingredient-lists/ingredient-lists.types';

export const ingredientListSchema = S.object()
    .additionalProperties(false)
    .prop('name', S.string())
    .prop('ingredients', S.array().items(S.string()).uniqueItems(true))
    .prop('type', S.string().enum(Object.values(IngredientListType)))
    .required(['name', 'ingredients', 'type']);
