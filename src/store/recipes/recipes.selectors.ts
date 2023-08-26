import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import { recipes } from '../../data';
import { AppState } from '../index';
import { RecipesState } from './recipes.state';
import { Recipe } from './recipes.types';

export const selectRecipesFeature: MemoizedSelector<AppState, RecipesState> =
    createFeatureSelector<RecipesState>('recipes');

export const selectRecipes: MemoizedSelector<AppState, Recipe[]> = createSelector(
    selectRecipesFeature,
    ({ entities }: RecipesState): Recipe[] => Object.values(entities) as Recipe[],
);

export const selectCustomRecipes: MemoizedSelector<AppState, Recipe[]> = createSelector(
    selectRecipesFeature,
    ({ entities }: RecipesState): Recipe[] => {
        const allRecipes = Object.values(entities) as Recipe[];
        return allRecipes.filter(ar => !recipes.some(r => r.name === ar.name && r.status === ar.status));
    },
);
