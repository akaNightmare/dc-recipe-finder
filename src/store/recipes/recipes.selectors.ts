import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import xor from 'lodash-es/xor';

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
    selectRecipes,
    (allRecipes: Recipe[]): Recipe[] =>
        allRecipes.filter(
            ar =>
                !recipes.some(
                    r =>
                        r.name === ar.name &&
                        r.status === ar.status &&
                        xor(
                            r.ingredients.map(({ name }) => name).sort(),
                            ar.ingredients.map(({ name }) => name).sort(),
                        ).length === 0,
                ),
        ),
);
