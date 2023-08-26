import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';

import { Recipe } from './recipes.types';

export type RecipesState = EntityState<Recipe>;

export const selectId = ({ name }: Recipe): string => name;

export const sortComparer = (a: Recipe, b: Recipe): number => a.added_at - b?.added_at ?? 0;

export const adapter: EntityAdapter<Recipe> = createEntityAdapter({ selectId, sortComparer });

export const initialState: RecipesState = adapter.getInitialState({});
