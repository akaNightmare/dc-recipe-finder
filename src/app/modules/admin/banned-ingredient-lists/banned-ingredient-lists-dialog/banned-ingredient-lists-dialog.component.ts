import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RxReactiveFormsModule } from '@rxweb/reactive-form-validators';
import { cloneDeep } from 'lodash-es';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { combineLatest, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';

import { BannedIngredientListsFacade } from '../../../../../store/banned-ingredient-lists';
import { BannedIngredientList } from '../../../../../store/banned-ingredient-lists/banned-ingredient-lists.types';
import { IngredientsFacade } from '../../../../../store/ingredients';
import { Ingredient } from '../../../../../store/ingredients/ingredients.types';
import { ReplacePipe } from '../../../../pipes/replace.pipe';

@Component({
    selector: 'banned-ingredient-lists-dialog',
    templateUrl: './banned-ingredient-lists-dialog.component.html',
    styleUrls: ['./banned-ingredient-lists-dialog.component.scss'],
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
export class BannedIngredientListsDialogComponent implements OnInit {
    public readonly data: { banned_ingredient_list?: BannedIngredientList } = inject(MAT_DIALOG_DATA);

    private readonly bilFacade = inject(BannedIngredientListsFacade);
    private readonly ingredientFacade = inject(IngredientsFacade);
    private readonly bannedIngredientListsFacade = inject(BannedIngredientListsFacade);
    private readonly matDialogRef = inject(MatDialogRef<BannedIngredientListsDialogComponent>);
    private readonly formBuilder = inject(FormBuilder);

    public readonly searchIngredientsCtrl = new FormControl('');

    public readonly bilForm = this.formBuilder.group({
        name: [
            '',
            {
                validators: [Validators.required],
                asyncValidators: [this.bilFacade.createNameValidator()],
            },
        ],
        ingredients: new FormControl<string[]>([], { validators: [Validators.required] }),
    });

    public readonly ingredients$ = combineLatest([
        this.searchIngredientsCtrl.valueChanges.pipe(startWith(undefined), debounceTime(200), distinctUntilChanged()),
        this.ingredientFacade.ingredients$,
        this.bilForm.get('ingredients').valueChanges.pipe(startWith([])),
    ]).pipe(
        map(([search, ingredients, ingredientNames]) => {
            search = search?.toLowerCase().trim();
            const filtersFn = [];
            let filterIngredients = [];
            if (search) {
                filtersFn.push((ingredient: Ingredient) => ingredient.name?.toLowerCase().includes(search));
            }
            if (ingredientNames.length > 0) {
                filterIngredients = ingredients.filter(ingredient => ingredientNames.includes(ingredient.name));
            }
            if (filtersFn.length > 0) {
                ingredients = ingredients.filter(ingredient => filtersFn.every(fn => fn(ingredient)));
            }
            return filterIngredients.concat(
                ingredients
                    .filter(i => !filterIngredients.includes(i))
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .slice(0, 20),
            );
        }),
    );

    ngOnInit(): void {
        if (this.data.banned_ingredient_list) {
            this.bilForm.patchValue(this.data.banned_ingredient_list);
        }
    }

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

    /**
     * Save the ingredient
     */
    save(): void {
        if (this.bilForm.invalid) {
            return;
        }

        const bannedIngredientList = cloneDeep(this.bilForm.value) as BannedIngredientList;
        this.bannedIngredientListsFacade.addBannedIngredientList(bannedIngredientList);
        this.matDialogRef.close(bannedIngredientList);
    }
}
