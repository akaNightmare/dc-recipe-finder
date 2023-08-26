import { AppState } from '../index';
import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { RecipesState } from './recipes.state';
import { Recipe } from './recipes.types';

export const selectRecipesFeature: MemoizedSelector<AppState, RecipesState> =
    createFeatureSelector<RecipesState>('recipes');

export const selectRecipes: MemoizedSelector<AppState, Recipe[]> =
    createSelector(
        selectRecipesFeature,
        ({ entities }: RecipesState): Recipe[] =>
            Object.values(entities) as Recipe[]
    );
