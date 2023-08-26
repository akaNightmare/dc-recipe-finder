import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Ingredient } from './ingredients.types';

export interface IngredientsState extends EntityState<Ingredient> {
}

export const selectId = ({ name }: Ingredient): string => name;

export const sortComparer = (a: Ingredient, b: Ingredient): number => a.name.localeCompare(b.name);

export const adapter: EntityAdapter<Ingredient> = createEntityAdapter(
    { selectId, sortComparer }
);

export const initialState: IngredientsState = adapter.getInitialState(
    {},
);
