import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, map } from 'rxjs';

import { fuseAnimations } from '@fuse/animations';
import { RandomRecipesGQL } from './random-recipes.generated';

@Component({
    selector: 'brief-description',
    templateUrl: './brief-description.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    imports: [NgOptimizedImage, AsyncPipe, MatTooltipModule]
})
export class BriefDescriptionComponent {
    readonly #randomRecipesGQL = inject(RandomRecipesGQL);

    readonly randomRecipes$ = this.#randomRecipesGQL.watch().valueChanges.pipe(
        filter(({ data }) => !!data?.randomRecipes),
        map(({ data }) => data.randomRecipes),
    );
}
