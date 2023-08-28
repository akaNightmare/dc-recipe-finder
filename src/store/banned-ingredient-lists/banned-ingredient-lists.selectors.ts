import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import { AppState } from '../index';
import { BannedIngredientListsState } from './banned-ingredient-lists.state';
import { BannedIngredientList } from './banned-ingredient-lists.types';

export const selectBannedIngredientListFeature: MemoizedSelector<AppState, BannedIngredientListsState> =
    createFeatureSelector<BannedIngredientListsState>('banned_ingredient_lists');

export const selectBannedIngredientLists: MemoizedSelector<AppState, BannedIngredientList[]> = createSelector(
    selectBannedIngredientListFeature,
    ({ entities }: BannedIngredientListsState): BannedIngredientList[] =>
        Object.values(entities) as BannedIngredientList[],
);
