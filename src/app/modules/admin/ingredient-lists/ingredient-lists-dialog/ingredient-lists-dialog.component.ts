import { AsyncPipe, LowerCasePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { AfterContentInit, Component, inject, ViewEncapsulation } from '@angular/core';
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

import { IngredientListsFacade } from '../../../../../store/ingredient-lists';
import { IngredientList, IngredientListType } from '../../../../../store/ingredient-lists/ingredient-lists.types';
import { IngredientsFacade } from '../../../../../store/ingredients';
import { Ingredient } from '../../../../../store/ingredients/ingredients.types';
import { ReplacePipe } from '../../../../pipes/replace.pipe';

@Component({
    selector: 'ingredient-lists-dialog',
    templateUrl: './ingredient-lists-dialog.component.html',
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
        LowerCasePipe,
    ],
})
export class IngredientListsDialogComponent implements AfterContentInit {
    public readonly data: { ingredient_list?: IngredientList } = inject(MAT_DIALOG_DATA);

    private readonly ilFacade = inject(IngredientListsFacade);
    private readonly ingredientFacade = inject(IngredientsFacade);
    private readonly matDialogRef = inject(MatDialogRef<IngredientListsDialogComponent>);
    private readonly formBuilder = inject(FormBuilder);

    public readonly searchIngredientsCtrl = new FormControl('');
    public readonly TYPES = Object.values(IngredientListType);

    public readonly bilForm = this.formBuilder.group({
        name: [
            '',
            {
                validators: [Validators.required],
                asyncValidators: [this.ilFacade.createNameValidator()],
            },
        ],
        type: [IngredientListType.ALLOWLIST, [Validators.required]],
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

    ngAfterContentInit(): void {
        if (this.data.ingredient_list) {
            setTimeout(() => this.bilForm.patchValue(this.data.ingredient_list), 0);
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
     * Save the ingredient list
     */
    save(): void {
        if (this.bilForm.invalid) {
            return;
        }

        const bannedIngredientList = cloneDeep(this.bilForm.value) as IngredientList;
        if (this.data.ingredient_list) {
            this.ilFacade.updateIngredientList(this.data.ingredient_list, bannedIngredientList);
        } else {
            this.ilFacade.addIngredientList(bannedIngredientList);
        }
        this.matDialogRef.close(bannedIngredientList);
    }
}
