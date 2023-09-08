import { AsyncPipe, NgForOf, NgOptimizedImage } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import random from 'lodash-es/random';
import shuffle from 'lodash-es/shuffle';
import { map } from 'rxjs';

import { fuseAnimations } from '../../../../@fuse/animations';
import { IngredientsFacade } from '../../../../store/ingredients';
import { RecipesFacade } from '../../../../store/recipes';

@Component({
    selector: 'brief-description',
    templateUrl: './brief-description.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [NgForOf, NgOptimizedImage, AsyncPipe, MatTooltipModule],
})
export class BriefDescriptionComponent {
    private readonly ingredientsFacade = inject(IngredientsFacade);
    private readonly recipesFacade = inject(RecipesFacade);

    public readonly ingredients$ = this.ingredientsFacade.ingredients$.pipe(
        map(ingredients => shuffle(ingredients).slice(0, random(4, 7))),
    );

    public readonly recipesCount$ = this.recipesFacade.recipes$.pipe(
        map(recipes => recipes.length - (recipes.length % 10)),
    );
}
