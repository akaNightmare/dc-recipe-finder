export enum IngredientListType {
    ALLOWLIST = 'ALLOWLIST',
    BANLIST = 'BANLIST',
}

export interface IngredientList {
    name: string;
    ingredients: string[];
    type: IngredientListType;
}
