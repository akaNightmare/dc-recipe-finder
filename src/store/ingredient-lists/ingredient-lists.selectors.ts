import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import xor from 'lodash-es/xor';

import { ingredientLists } from '../../data';
import { AppState } from '../index';
import { IngredientListsState } from './ingredient-lists.state';
import { IngredientList } from './ingredient-lists.types';

export const selectIngredientListFeature: MemoizedSelector<AppState, IngredientListsState> =
    createFeatureSelector<IngredientListsState>('ingredient_lists');

export const selectIngredientLists: MemoizedSelector<AppState, IngredientList[]> = createSelector(
    selectIngredientListFeature,
    ({ entities }: IngredientListsState): IngredientList[] => Object.values(entities) as IngredientList[],
);

export const selectCustomIngredientLists: MemoizedSelector<AppState, IngredientList[]> = createSelector(
    selectIngredientLists,
    (allBil: IngredientList[]): IngredientList[] =>
        allBil.filter(
            ab =>
                !ingredientLists.some(
                    b => b.name === ab.name && b.type === ab.type && xor(b.ingredients, ab.ingredients).length === 0,
                ),
        ),
);
