import { AppState } from '../index';
import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import { IngredientsState } from './ingredients.state';
import { Ingredient } from './ingredients.types';

export const selectIngredientsFeature: MemoizedSelector<AppState, IngredientsState> =
    createFeatureSelector<IngredientsState>('ingredients');

export const selectIngredients: MemoizedSelector<AppState, Ingredient[]> =
    createSelector(
        selectIngredientsFeature,
        ({ entities }: IngredientsState): Ingredient[] =>
            Object.values(entities) as Ingredient[]
    );
