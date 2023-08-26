import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
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
import { combineLatest, debounceTime, distinctUntilChanged, startWith, Subject, takeUntil } from 'rxjs';

import { IngredientsFacade } from '../../../../../store/ingredients';
import { Ingredient } from '../../../../../store/ingredients/ingredients.types';
import { RecipesFacade } from '../../../../../store/recipes';
import { Recipe, RecipeStatus } from '../../../../../store/recipes/recipes.types';

@Component({
    selector: 'recipe-dialog',
    templateUrl: './recipe-dialog.component.html',
    standalone: true,
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
    ],
})
export class RecipeDialogComponent implements OnInit, OnDestroy {
    public recipeForm: FormGroup;
    public readonly data: { recipe?: Recipe } = inject(MAT_DIALOG_DATA);

    private readonly ingredientFacade = inject(IngredientsFacade);
    private readonly recipesFacade = inject(RecipesFacade);
    private readonly matDialogRef = inject(MatDialogRef<RecipeDialogComponent>);
    private readonly formBuilder = inject(FormBuilder);
    private readonly unsubscribe$ = new Subject<void>();

    public readonly searchCtrl = new FormControl();

    public ingredients: Ingredient[] = [];

    public readonly STATUSES = Object.keys(RecipeStatus);

    ngOnInit(): void {
        this.recipeForm = this.formBuilder.group({
            image_path: [null, [Validators.required]],
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
            ingredients: this.formBuilder.array([], [Validators.minLength(1), Validators.maxLength(6)]),
        });

        if (this.data.recipe) {
            this.data.recipe.ingredients.forEach(() => {
                this.addIngredientField();
            });
            this.recipeForm.patchValue(this.data.recipe);
        } else {
            this.addIngredientField();
        }

        combineLatest([
            this.searchCtrl.valueChanges.pipe(startWith(undefined), debounceTime(200), distinctUntilChanged()),
            this.ingredientFacade.ingredients$,
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([search, ingredients]) => {
                search = search?.toLowerCase().trim();
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
            image_path: [null, [Validators.required]],
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
        if (recipe.image_path) {
            recipe.name = recipe.image_path.replace(/(\.png|\.jpg)/, '');
        }
        for (const ingredient of recipe.ingredients) {
            ingredient.name = ingredient.image_path.replace(/(\.png|\.jpg)/, '');
        }
        this.recipesFacade.addRecipe(recipe);
        this.matDialogRef.close(recipe);
    }

    onStatusChanged({ value }: { value: RecipeStatus }): void {
        const imagePathCtrl = this.recipeForm.get('image_path');
        const countFromCtrl = this.recipeForm.get('count_from');
        const countToCtrl = this.recipeForm.get('count_to');
        if (value === RecipeStatus.FAILED) {
            imagePathCtrl.disable();
            countFromCtrl.disable();
            countToCtrl.disable();
        } else {
            imagePathCtrl.enable();
            countFromCtrl.enable();
            countToCtrl.enable();
        }
    }
}
