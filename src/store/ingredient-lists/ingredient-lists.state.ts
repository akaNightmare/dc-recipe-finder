import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';

import { IngredientList } from './ingredient-lists.types';

export type IngredientListsState = EntityState<IngredientList>;

export const selectId = ({ name, type }: IngredientList): string => `${name}|${type}`;

export const sortComparer = (a: IngredientList, b: IngredientList): number => a.name.localeCompare(b.name);

export const adapter: EntityAdapter<IngredientList> = createEntityAdapter({ selectId, sortComparer });

export const initialState: IngredientListsState = adapter.getInitialState({});
