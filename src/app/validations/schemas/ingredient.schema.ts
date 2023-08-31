import S from 'fluent-json-schema';

export const ingredientSchema = S.object().additionalProperties(false).prop('name', S.string()).required(['name']);
