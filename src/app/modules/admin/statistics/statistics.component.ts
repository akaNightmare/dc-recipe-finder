import { AsyncPipe, PercentPipe } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { map } from 'rxjs';

import { IngredientRarity } from '../../../graphql.generated';
import { RecipeStatisticsGQL } from './recipe-statistics.generated';

type RarityBucket = {
    recipeSize: number;
    recipeCount: number;
    totalSlots: number;
    byRarity: Array<{
        rarity: IngredientRarity;
        slotCount: number;
        share: number;
    }>;
};

@Component({
    selector: 'statistics',
    templateUrl: './statistics.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [AsyncPipe, PercentPipe, MatProgressBarModule, MatTooltipModule],
})
export class StatisticsComponent {
    readonly #recipeStatisticsGQL = inject(RecipeStatisticsGQL);

    readonly IngredientRarity = IngredientRarity;

    readonly rarityOrder: IngredientRarity[] = [
        IngredientRarity.Common,
        IngredientRarity.Uncommon,
        IngredientRarity.Rare,
        IngredientRarity.Epic,
        IngredientRarity.UltraRare,
        IngredientRarity.Legendary,
    ];

    readonly rarityBarClass: Record<IngredientRarity, string> = {
        [IngredientRarity.Common]: 'bg-common',
        [IngredientRarity.Uncommon]: 'bg-uncommon',
        [IngredientRarity.Rare]: 'bg-rare',
        [IngredientRarity.Epic]: 'bg-epic',
        [IngredientRarity.UltraRare]: 'bg-ultra-rare',
        [IngredientRarity.Legendary]: 'bg-legendary',
    };

    readonly rarityLabel: Record<IngredientRarity, string> = {
        [IngredientRarity.Common]: 'Common',
        [IngredientRarity.Uncommon]: 'Uncommon',
        [IngredientRarity.Rare]: 'Rare',
        [IngredientRarity.Epic]: 'Epic',
        [IngredientRarity.UltraRare]: 'Ultra rare',
        [IngredientRarity.Legendary]: 'Legendary',
    };

    readonly buckets$ = this.#recipeStatisticsGQL.fetch().pipe(
        map(({ data }) => (data?.recipeStatistics?.ingredientRarityByRecipeSize ?? []) as RarityBucket[]),
    );
}
