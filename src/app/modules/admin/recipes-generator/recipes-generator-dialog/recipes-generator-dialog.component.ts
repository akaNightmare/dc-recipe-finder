import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RxReactiveFormsModule } from '@rxweb/reactive-form-validators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { combineLatest, map, startWith } from 'rxjs';

import { IngredientListsFacade } from '../../../../../store/ingredient-lists';
import { IngredientListType } from '../../../../../store/ingredient-lists/ingredient-lists.types';
import { IngredientsFacade } from '../../../../../store/ingredients';
import { combination } from '../../../../helpers';
import { ReplacePipe } from '../../../../pipes/replace.pipe';

@Component({
    selector: 'recipes-generator-dialog',
    templateUrl: './recipes-generator-dialog.component.html',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    imports: [
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        AsyncPipe,
        FormsModule,
        MatInputModule,
        ReactiveFormsModule,
        RxReactiveFormsModule,
        MatProgressSpinnerModule,
        MatRippleModule,
        MatSelectModule,
        NgxMatSelectSearchModule,
        NgIf,
        NgForOf,
        NgClass,
        ReplacePipe,
        MatDialogModule,
    ],
})
export class RecipesGeneratorDialogComponent implements OnInit {
    private readonly matDialogRef = inject(MatDialogRef<RecipesGeneratorDialogComponent>);
    private readonly ilFacade = inject(IngredientListsFacade);
    private readonly ingredientFacade = inject(IngredientsFacade);
    private readonly formBuilder = inject(FormBuilder);

    public readonly searchIngredientsCtrl = new FormControl('');

    public readonly form = this.formBuilder.group({
        name: ['', [Validators.required]],
        base_ingredients: new FormControl<string[]>([], { validators: [Validators.required, Validators.maxLength(5)] }),
        banned_ingredient_lists: new FormControl<string[]>([]),
        allowed_ingredient_lists: new FormControl<string[]>([], { validators: [Validators.required] }),
    });

    public readonly bannedIngredientLists$ = combineLatest([
        this.ilFacade.ingredientList$.pipe(
            map(lists => lists.filter(({ type }) => type === IngredientListType.BANLIST)),
        ),
    ]).pipe(
        map(([bannedIngredientLists]) => {
            return bannedIngredientLists;
        }),
    );

    public readonly allowedIngredientLists$ = combineLatest([
        this.ilFacade.ingredientList$.pipe(
            map(lists => lists.filter(({ type }) => type === IngredientListType.ALLOWLIST)),
        ),
    ]).pipe(
        map(([allowedIngredientLists]) => {
            return allowedIngredientLists;
        }),
    );

    public readonly filteredIngredients$ = combineLatest([
        this.form.get('banned_ingredient_lists').valueChanges.pipe(startWith([])),
        this.ilFacade.ingredientList$,
        this.ingredientFacade.ingredients$,
    ]).pipe(
        map(([bannedIngredientListNames, bannedIngredientList, ingredients]) => {
            const bannedIngredients = new Set();
            for (const list of bannedIngredientList) {
                if (bannedIngredientListNames.includes(list.name)) {
                    for (const ingredient of list.ingredients) {
                        bannedIngredients.add(ingredient);
                    }
                }
            }
            return ingredients.filter(({ name }) => !bannedIngredients.has(name));
        }),
    );

    public readonly combinationsCount$ = combineLatest([
        this.form.get('base_ingredients').valueChanges.pipe(startWith([])),
        this.filteredIngredients$,
    ]).pipe(
        map(([baseIngredients, filteredIngredients]) => {
            if (!baseIngredients.length || !filteredIngredients.length) {
                return 0;
            }
            console.log(filteredIngredients.length, filteredIngredients.length - baseIngredients.length);
            return combination(filteredIngredients.length, 6 - baseIngredients.length);
        }),
    );

    ngOnInit(): void {}

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: { name?: string }): string | number {
        return item.name || index;
    }

    /**
     * Close the dialog
     */
    close(): void {
        this.matDialogRef.close();
    }

    save(): void {}
}
