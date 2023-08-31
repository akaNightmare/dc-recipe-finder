import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import {
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RxReactiveFormsModule, RxwebValidators } from '@rxweb/reactive-form-validators';
import { cloneDeep } from 'lodash-es';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { combineLatest, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';

import { IngredientsFacade } from '../../../../../store/ingredients';
import { RecipesFacade } from '../../../../../store/recipes';
import { Recipe, RecipeStatus } from '../../../../../store/recipes/recipes.types';
import { ReplacePipe } from '../../../../pipes/replace.pipe';

@Component({
    selector: 'recipe-dialog',
    templateUrl: './recipe-dialog.component.html',
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
    ],
})
export class RecipeDialogComponent implements OnInit {
    public recipeForm: FormGroup;
    public readonly data: { recipe?: Recipe } = inject(MAT_DIALOG_DATA);

    private readonly ingredientFacade = inject(IngredientsFacade);
    private readonly recipesFacade = inject(RecipesFacade);
    private readonly matDialogRef = inject(MatDialogRef<RecipeDialogComponent>);
    private readonly formBuilder = inject(FormBuilder);

    public readonly searchIngredientsCtrl = new FormControl('');

    public readonly ingredients$ = combineLatest([
        this.searchIngredientsCtrl.valueChanges.pipe(startWith(undefined), debounceTime(200), distinctUntilChanged()),
        this.ingredientFacade.ingredients$,
    ]).pipe(
        map(([search, ingredients]) => {
            search = search?.toLowerCase().trim();
            if (search) {
                ingredients = ingredients.filter(ingredient => ingredient.name.toLowerCase().includes(search));
            }
            return ingredients;
        }),
    );

    public readonly STATUSES = Object.values(RecipeStatus);

    ngOnInit(): void {
        this.recipeForm = this.formBuilder.group({
            name: [null, [Validators.required]],
            count_from: [1, [Validators.required, Validators.min(1)]],
            count_to: [
                1,
                [
                    Validators.required,
                    Validators.min(1),
                    RxwebValidators.greaterThanEqualTo({ fieldName: 'count_from' }),
                ],
            ],
            status: [RecipeStatus.SUCCESS, [Validators.required]],
            ingredients: this.formBuilder.array(
                [],
                [Validators.minLength(1), Validators.maxLength(6), RxwebValidators.unique()],
            ),
        });

        if (this.data.recipe) {
            this.data.recipe.ingredients.forEach(() => {
                this.addIngredientField();
            });
            this.recipeForm.patchValue(this.data.recipe);
        } else {
            this.addIngredientField();
        }
    }

    get ingredientsCtrl(): FormArray {
        return this.recipeForm.get('ingredients') as FormArray;
    }

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: { name?: string }): string | number {
        return item.name || index;
    }

    removeIngredientField(index: number): void {
        this.ingredientsCtrl.removeAt(index);
    }

    addIngredientField(): void {
        const attrFormGroup = this.formBuilder.group({
            name: [null, [Validators.required]],
            count: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
        });
        this.ingredientsCtrl.push(attrFormGroup);
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
        if (this.recipeForm.invalid) {
            return;
        }

        const recipe = cloneDeep(this.recipeForm.value);
        recipe.added_at = Date.now();
        this.recipesFacade.addRecipe(recipe);
        this.matDialogRef.close(recipe);
    }

    onStatusChanged({ value }: { value: RecipeStatus }): void {
        const imageNameCtrl = this.recipeForm.get('name');
        const countFromCtrl = this.recipeForm.get('count_from');
        const countToCtrl = this.recipeForm.get('count_to');
        if (value === RecipeStatus.FAILED) {
            imageNameCtrl.disable();
            countFromCtrl.disable();
            countToCtrl.disable();
        } else {
            imageNameCtrl.enable();
            countFromCtrl.enable();
            countToCtrl.enable();
        }
    }
}
