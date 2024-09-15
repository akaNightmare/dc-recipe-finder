import { AsyncPipe, NgClass, NgOptimizedImage } from '@angular/common';
import {
    AfterViewInit,
    Component,
    inject,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
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
import { QueryRef } from 'apollo-angular';
import { cloneDeep } from 'lodash-es';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { debounceTime, filter, Subject, takeUntil, tap } from 'rxjs';

import {
    Ingredient,
    IngredientPaginateOrderField,
    OrderDir,
    Recipe,
    RecipeStatus,
} from '../../../../graphql.generated';
import { ReplacePipe } from '../../../../pipes';
import {
    PaginateIngredientGQL,
    PaginateIngredientQuery,
    PaginateIngredientQueryVariables,
} from '../../ingredients/ingredients.generated';
import { MarkRecipeListRecipeGQL } from '../../recipes-generator/recipes-list.generated';
import { CreateRecipeGQL, UpdateRecipeGQL } from '../recipes.generated';

const UNKNOWN_INGREDIENT_IMAGE = '78f5cdb54af169f991d2e3978eb6b09b.png';

const DEFAULT_INGREDIENT: Ingredient[] = [
    {
        image: UNKNOWN_INGREDIENT_IMAGE,
        name: '-',
        id: '0',
    } as Ingredient,
];

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
        NgClass,
        ReplacePipe,
        NgOptimizedImage,
    ],
})
export class RecipeDialogComponent implements OnInit, AfterViewInit, OnDestroy {
    public recipeForm!: FormGroup;
    public readonly data: { status?: RecipeStatus; recipe?: Recipe } = inject(MAT_DIALOG_DATA);

    readonly #unsubscribe$ = new Subject<void>();
    readonly #paginateIngredientGQL = inject(PaginateIngredientGQL);
    #ingredientRef!: QueryRef<PaginateIngredientQuery, PaginateIngredientQueryVariables>;

    readonly #updateRecipeGQL = inject(UpdateRecipeGQL);
    readonly #createRecipeGQL = inject(CreateRecipeGQL);
    readonly #markRecipeListRecipeGQL = inject(MarkRecipeListRecipeGQL);

    readonly #matDialogRef = inject(MatDialogRef<RecipeDialogComponent>);
    readonly #formBuilder = inject(FormBuilder);

    public readonly searchIngredientsCtrl = new FormControl('');

    public ingredients: Ingredient[] = [];
    public recipeIngredients = DEFAULT_INGREDIENT;
    public searching = false;

    public readonly STATUSES = Object.values(RecipeStatus);

    ngAfterViewInit() {
        this.#ingredientRef = this.#paginateIngredientGQL.watch(
            this.#buildVariables(
                this.data.recipe?.ingredients.map(ingredient => ingredient.ingredient.id),
                this.data.recipe?.name,
            ),
        );

        this.#ingredientRef.valueChanges
            .pipe(
                takeUntil(this.#unsubscribe$),
                filter(({ data }) => Array.isArray(data?.paginateIngredient?.items)),
            )
            .subscribe(({ data }) => {
                this.ingredients = [
                    ...(data.paginateIngredient.items ?? []),
                    ...(this.ingredientsCtrl.value || [])
                        .map(({ ingredient_id }) =>
                            this.ingredients.find(i => i.id === ingredient_id),
                        )
                        .filter(i => i != null),
                ];
                this.recipeIngredients = [...DEFAULT_INGREDIENT, ...this.ingredients];
            });

        this.searchIngredientsCtrl.valueChanges
            .pipe(
                takeUntil(this.#unsubscribe$),
                filter(search => !!search?.trim().length),
                tap(() => (this.searching = true)),
                debounceTime(200),
            )
            .subscribe({
                next: () => {
                    this.searching = false;
                    void this.#ingredientRef.refetch(this.#buildVariables());
                },
                error: () => (this.searching = false),
            });
    }

    ngOnDestroy() {
        this.#unsubscribe$.next();
        this.#unsubscribe$.complete();
    }

    ngOnInit(): void {
        this.recipeForm = this.#formBuilder.group({
            name: new FormControl('', { validators: [Validators.required], nonNullable: true }),
            image: new FormControl('', { validators: [Validators.required], nonNullable: true }),
            count_from: new FormControl(1, {
                validators: [Validators.required, Validators.min(1)],
                nonNullable: true,
            }),
            count_to: new FormControl(1, {
                validators: [
                    Validators.required,
                    Validators.min(1),
                    RxwebValidators.greaterThanEqualTo({ fieldName: 'count_from' }),
                ],
                nonNullable: true,
            }),
            status: new FormControl(RecipeStatus.Success, {
                validators: [Validators.required],
                nonNullable: true,
            }),
            ingredients: this.#formBuilder.array(
                [],
                [Validators.minLength(1), Validators.maxLength(6), RxwebValidators.unique()],
            ),
        });

        if (this.data.recipe) {
            this.data.recipe.ingredients.forEach(() => {
                this.addIngredientField();
            });
            this.recipeForm.patchValue({
                ...this.data.recipe,
                ingredients: this.data.recipe.ingredients.map(ingredient => ({
                    ingredient_id: ingredient.ingredient.id,
                    count: ingredient.count,
                })),
            });
            this.onStatusChanged({ value: this.data.recipe.status });
            this.recipeForm.get('status')!.disable();
        } else {
            this.addIngredientField();
            this.recipeForm.patchValue({
                image: UNKNOWN_INGREDIENT_IMAGE,
                name: '-',
            });
        }

        if (this.data.status) {
            if (this.data.status === RecipeStatus.Success) {
                this.recipeForm.patchValue({
                    image: UNKNOWN_INGREDIENT_IMAGE,
                    name: '-',
                });
            }
            this.recipeForm.get('status')!.disable();
            for (const ctrl of this.ingredientsCtrl.controls) {
                ctrl.get('ingredient_id')!.disable();
            }
        }
    }

    get ingredientsCtrl(): FormArray<
        FormGroup<{ ingredient_id: FormControl<string>; count: FormControl<number> }>
    > {
        return this.recipeForm.get('ingredients') as FormArray;
    }

    get canRemoveIngredientField(): boolean {
        return (
            this.ingredientsCtrl.length > 1 &&
            (!this.data.status || this.data.status !== RecipeStatus.Failed)
        );
    }

    get canAddIngredientField(): boolean {
        return this.ingredientsCtrl.length < 6 && !this.data.status;
    }

    ingredientById(ingredientId?: string): Ingredient | undefined {
        if (!ingredientId) {
            return;
        }
        return this.ingredients.find(i => i.id === ingredientId);
    }

    ingredientByImage(ingredientImage?: string): Ingredient | undefined {
        if (!ingredientImage) {
            return;
        }
        return this.recipeIngredients.find(i => i.image === ingredientImage);
    }

    onRecipeImageChange({ value }: { value: string }): void {
        const ingredient = this.recipeIngredients.find(i => i.image === value);
        if (ingredient) {
            this.recipeForm.patchValue({ name: ingredient.name });
        }
    }

    removeIngredientField(index: number): void {
        this.ingredientsCtrl.removeAt(index);
    }

    addIngredientField(): void {
        this.ingredientsCtrl.push(
            this.#formBuilder.group<{
                ingredient_id: FormControl<string>;
                count: FormControl<number>;
            }>({
                ingredient_id: new FormControl('', {
                    validators: [Validators.required],
                    nonNullable: true,
                }),
                count: new FormControl(1, {
                    validators: [Validators.required, Validators.min(1), Validators.max(100)],
                    nonNullable: true,
                }),
            }),
        );
    }

    /**
     * Close the dialog
     */
    close(): void {
        this.#matDialogRef.close();
    }

    /**
     * Save the recipe
     */
    save(): void {
        if (this.recipeForm.invalid) {
            return;
        }

        const recipe = cloneDeep(
            this.data.status ? this.recipeForm.getRawValue() : this.recipeForm.value,
        );

        if (recipe.status === RecipeStatus.Failed) {
            recipe.image = 'craft_failed.png';
            delete recipe.name;
            delete recipe.count_from;
            delete recipe.count_to;
        }

        if (this.data.status) {
            this.#markRecipeListRecipeGQL
                .mutate({
                    recipeListRecipeId: this.data.recipe!.id,
                    recipe,
                })
                .subscribe(({ data }) => {
                    this.#matDialogRef.close(data);
                });
        } else {
            if (this.data.recipe?.id) {
                this.#updateRecipeGQL
                    .mutate({ recipe, id: this.data.recipe.id })
                    .subscribe(({ data }) => {
                        this.#matDialogRef.close(data);
                    });
            } else {
                this.#createRecipeGQL.mutate({ recipe }).subscribe(({ data }) => {
                    this.#matDialogRef.close(data);
                });
            }
        }
    }

    onStatusChanged({ value }: { value: RecipeStatus }): void {
        const nameCtrl = this.recipeForm.get('name')!;
        const imageCtrl = this.recipeForm.get('image')!;
        const countFromCtrl = this.recipeForm.get('count_from')!;
        const countToCtrl = this.recipeForm.get('count_to')!;
        if (value === RecipeStatus.Failed) {
            nameCtrl.disable();
            imageCtrl.disable();
            countFromCtrl.disable();
            countToCtrl.disable();
        } else {
            nameCtrl.enable();
            imageCtrl.enable();
            countFromCtrl.enable();
            countToCtrl.enable();
        }
    }

    #buildVariables(
        ingredientIds?: string[],
        _recipeName?: string | null,
    ): PaginateIngredientQueryVariables {
        const filter = {};
        const search = this.searchIngredientsCtrl.value?.trim();
        if (search?.trim().length) {
            Object.assign(filter, { name: { contains: search } });
        }
        if (ingredientIds?.length) {
            Object.assign(filter, { id: { in: ingredientIds } });
        }

        return {
            filter,
            order: [{ field: IngredientPaginateOrderField.Name, dir: OrderDir.Asc }],
            pager: {
                page: 1,
                limit: 20,
            },
        };
    }

    protected readonly RecipeStatus = RecipeStatus;
}
