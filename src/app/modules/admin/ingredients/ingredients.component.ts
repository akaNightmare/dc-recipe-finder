import { CdkScrollable } from '@angular/cdk/overlay';
import { AsyncPipe, NgForOf, NgIf, NgOptimizedImage } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { combineLatest, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';

import { IngredientsFacade } from '../../../../store/ingredients';

@Component({
    selector: 'ingredients',
    standalone: true,
    templateUrl: './ingredients.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [
        NgForOf,
        AsyncPipe,
        NgIf,
        MatTableModule,
        MatSortModule,
        CdkScrollable,
        MatTooltipModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        ReactiveFormsModule,
        NgOptimizedImage,
    ],
})
export class IngredientsComponent {
    private readonly ingredientsFacade = inject(IngredientsFacade);

    readonly filters = new FormGroup({
        search: new FormControl(),
    });

    public readonly ingredients$ = combineLatest([
        this.filters.valueChanges.pipe(startWith(null), debounceTime(200), distinctUntilChanged()),
        this.ingredientsFacade.ingredients$,
    ]).pipe(
        map(([filters, ingredients]) => {
            const search = filters?.search?.toLowerCase().trim();
            if (search) {
                ingredients = ingredients.filter(ingredient => ingredient.name.toLowerCase().includes(search));
            }
            return ingredients;
        }),
    );

    /**
     * Track by function for ngFor loops
     */
    public trackByFn(index: number, item: { name?: string }): string | number {
        return item.name || index;
    }

    protected readonly encodeURIComponent = encodeURIComponent;
}
