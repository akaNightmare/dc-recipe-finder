import { Ingredient } from '../ingredients/ingredients.types';

export enum RecipeStatus {
    UNFULFILLED = 'UNFULFILLED',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
}

export interface Recipe {
    name?: string;
    count_from?: number;
    count_to?: number;
    description?: string;
    image_path?: string;
    ingredients: Array<(Ingredient & { count: number }) | null>;
    status: RecipeStatus;
    added_at: number;
}
