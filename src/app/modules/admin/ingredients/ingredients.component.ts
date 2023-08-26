import { CdkScrollable } from '@angular/cdk/overlay';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { combineLatest, debounceTime, distinctUntilChanged, startWith, Subject, takeUntil } from 'rxjs';

import { IngredientsFacade } from '../../../../store/ingredients';
import { Ingredient } from '../../../../store/ingredients/ingredients.types';

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
    ],
})
export class IngredientsComponent implements OnInit, OnDestroy {
    private readonly ingredientsFacade = inject(IngredientsFacade);
    public ingredients: Ingredient[] = [];

    private readonly unsubscribe$ = new Subject<void>();

    readonly filters = new FormGroup({
        search: new FormControl(),
    });

    ngOnInit(): void {
        combineLatest([
            this.filters.valueChanges.pipe(startWith(null), debounceTime(200), distinctUntilChanged()),
            this.ingredientsFacade.ingredients$,
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([filters, ingredients]) => {
                const search = filters?.search?.toLowerCase().trim();
                if (search) {
                    ingredients = ingredients.filter(ingredient => ingredient.name.toLowerCase().includes(search));
                }
                this.ingredients = ingredients;
            });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Track by function for ngFor loops
     */
    public trackByFn(index: number, item: { name?: string }): string | number {
        return item.name || index;
    }
}
