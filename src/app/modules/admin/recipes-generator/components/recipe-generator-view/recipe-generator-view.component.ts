import { Component, inject, ViewEncapsulation } from '@angular/core';
import { PaginateRecipeListRecipeGQL } from '../../recipes-list.generated';

@Component({
    selector: 'recipe-generator-view',
    standalone: true,
    templateUrl: './recipe-generator-view.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class RecipeGeneratorViewComponent {
    #paginateRecipeListRecipeGQL = inject(PaginateRecipeListRecipeGQL);
}
