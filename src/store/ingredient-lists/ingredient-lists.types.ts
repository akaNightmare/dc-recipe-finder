export enum IngredientListStatus {
    ALLOWED = 'ALLOWED',
    BANNED = 'BANNED',
}

export interface IngredientList {
    name: string;
    ingredients: string[];
    status: IngredientListStatus;
}
