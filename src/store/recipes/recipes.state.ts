import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';

import { Recipe } from './recipes.types';

export type RecipesState = EntityState<Recipe>;

export const selectId = (recipe: Recipe): string =>
    recipe.name + recipe.ingredients?.length
        ? recipe.ingredients
              .map(i => i?.name)
              .sort()
              .join('|')
        : '';

export const sortComparer = (a: Recipe, b: Recipe): number => a.added_at - b?.added_at ?? 0;

export const adapter: EntityAdapter<Recipe> = createEntityAdapter({ selectId, sortComparer });

export const initialState: RecipesState = adapter.getInitialState({});
