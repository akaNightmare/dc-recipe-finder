import { Injectable } from '@angular/core';
import { combination, combinationN, estimateZippedCountWithMerging } from './helpers';

@Injectable()
export class RecipeGeneratorBuilder {
    buildGenerator(recipeSize: number, baseIngredientCount: number): RecipeGenerator | undefined {
        if (
            recipeSize < 3 ||
            recipeSize > 6 ||
            baseIngredientCount < 1 ||
            baseIngredientCount > 5
        ) {
            return undefined;
        }
        const freeSlots = 6 - baseIngredientCount;
        if (recipeSize >= 4) {
            return new RecipeGeneratorEnumeration(recipeSize, freeSlots);
        } else {
            if (baseIngredientCount <= 3) {
                return new RecipeGeneratorPacker(recipeSize, freeSlots);
            } else if (baseIngredientCount === 4) {
                return new RecipeGeneratorCombination(recipeSize, freeSlots);
            } else {
                return new RecipeGeneratorEnumeration(recipeSize, freeSlots);
            }
        }
    }
}

abstract class RecipeGenerator {
    constructor(
        protected readonly recipeSize: number,
        protected readonly freeSlots: number,
    ) {}

    abstract count(ingredientIds: string[]): number;
}

class RecipeGeneratorPacker extends RecipeGenerator {
    count(ingredientIds: string[]): number {
        return estimateZippedCountWithMerging(combinationN(ingredientIds, 2), this.freeSlots);
    }
}

class RecipeGeneratorEnumeration extends RecipeGenerator {
    count(ingredientIds: string[]): number {
        return Math.ceil(ingredientIds.length / this.freeSlots);
    }
}

class RecipeGeneratorCombination extends RecipeGenerator {
    count(ingredientIds: string[]): number {
        return combination(ingredientIds.length, this.freeSlots);
    }
}
