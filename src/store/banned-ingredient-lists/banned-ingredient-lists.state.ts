import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';

import { BannedIngredientList } from './banned-ingredient-lists.types';

export type BannedIngredientListsState = EntityState<BannedIngredientList>;

export const selectId = ({ name }: BannedIngredientList): string => name;

export const sortComparer = (a: BannedIngredientList, b: BannedIngredientList): number => a.name.localeCompare(b.name);

export const adapter: EntityAdapter<BannedIngredientList> = createEntityAdapter({ selectId, sortComparer });

export const initialState: BannedIngredientListsState = adapter.getInitialState({});
