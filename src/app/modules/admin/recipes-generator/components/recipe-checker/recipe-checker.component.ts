import { CdkScrollable } from '@angular/cdk/overlay';
import { AsyncPipe, DecimalPipe, NgClass, NgOptimizedImage } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import {
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenu } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { BindQueryParamsFactory } from '@ngneat/bind-query-params';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { QueryRef } from 'apollo-angular';
import uniqBy from 'lodash-es/uniqBy';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { debounceTime, filter, Subject, takeUntil, tap } from 'rxjs';
import { IngredientSearchComponent } from '../../../../../components/ingredient-search/ingredient-search.component';
import {
    Exact,
    Ingredient,
    IngredientPaginateOrderField,
    IngredientRarity,
    OrderDir,
    Recipe,
    RecipeCheckInput,
    RecipeStatus,
} from '../../../../../graphql.generated';
import { SortByPipe } from '../../../../../pipes';
import {
    PaginateIngredientGQL,
    PaginateIngredientQuery,
    PaginateIngredientQueryVariables,
} from '../../../ingredients/ingredients.generated';
import { RecipeCheckGQL } from '../../recipes-list.generated';

@Component({
    selector: 'recipe-checker',
    standalone: true,
    templateUrl: './recipe-checker.component.html',
    styleUrls: ['./recipe-checker.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [
        AsyncPipe,
        CdkScrollable,
        MatTooltipModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        ReactiveFormsModule,
        MatOptionModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        NgxMatSelectSearchModule,
        RouterLink,
        DecimalPipe,
        NgOptimizedImage,
        NgClass,
        IngredientSearchComponent,
        MatDivider,
        MatMenu,
        SortByPipe,
    ],
})
export class RecipeCheckerComponent implements OnDestroy, OnInit {
    readonly #formBuilder = inject(FormBuilder);
    readonly #recipeCheckGQL = inject(RecipeCheckGQL);
    readonly #unsubscribe$ = new Subject<void>();
    readonly #paginateIngredientGQL = inject(PaginateIngredientGQL);
    readonly #queryFactory = inject(BindQueryParamsFactory);
    #ingredientRef!: QueryRef<PaginateIngredientQuery, PaginateIngredientQueryVariables>;

    public readonly RecipeStatus = RecipeStatus;
    public readonly IngredientRarity = IngredientRarity;
    public readonly searchIngredientsCtrl = new FormControl('');
    public ingredients: Ingredient[] = [];
    public searching = false;
    public recipes: Recipe[] = [];

    public readonly form = this.#formBuilder.group({
        recipe_size: [3, [Validators.required, Validators.min(2), Validators.max(6)]],
        ingredients: this.#formBuilder.array(
            [],
            [Validators.required, Validators.maxLength(5), RxwebValidators.unique()],
        ),
    });

    readonly #bindQueryParamsManager = this.#queryFactory
        .create(
            [
                { queryKey: 'recipe_size', type: 'number' },
                {
                    queryKey: 'ingredients',
                    serializer: (value: { ingredient_id: string; count: number }[]) =>
                        value
                            .map(({ ingredient_id, count }) => `${ingredient_id}:${count}`)
                            .join(','),
                    parser: (value: string) =>
                        value.split(',').map(part => {
                            const [ingredient_id, count] = part.split(':');
                            return { ingredient_id, count: Number.parseInt(count, 10) };
                        }),
                    syncInitialQueryParamValue: true,
                    syncInitialControlValue: false,
                },
            ],
            {
                syncInitialControlValue: true,
            },
        )
        .connect(this.form);

    ngOnInit() {
        this.addIngredientField(6);
        this.#bindQueryParamsManager.syncDefs('ingredients');

        this.#ingredientRef = this.#paginateIngredientGQL.watch(
            this.#buildVariables(
                this.ingredientsCtrl.value
                    .map(({ ingredient_id }) => ingredient_id)
                    .filter(Boolean) as string[],
            ),
        );

        this.#ingredientRef.valueChanges
            .pipe(
                takeUntil(this.#unsubscribe$),
                filter(({ data }) => Array.isArray(data?.paginateIngredient?.items)),
            )
            .subscribe(({ data }) => {
                this.ingredients = uniqBy(
                    [
                        ...(data.paginateIngredient.items ?? []),
                        ...(this.ingredientsCtrl.value || [])
                            .map(({ ingredient_id }) =>
                                this.ingredients.find(i => i.id === ingredient_id),
                            )
                            .filter(i => i != null),
                    ],
                    'id',
                );
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
        this.#bindQueryParamsManager.destroy();
        this.#unsubscribe$.next();
        this.#unsubscribe$.complete();
    }

    get ingredientsCtrl(): FormArray<
        FormGroup<{ ingredient_id: FormControl<string>; count: FormControl<number> }>
    > {
        return this.form.get('ingredients') as FormArray;
    }

    ingredientById(ingredientId?: string): Ingredient | undefined {
        if (!ingredientId) {
            return;
        }
        return this.ingredients.find(i => i.id === ingredientId);
    }

    addIngredientField(count = 1): void {
        if (count <= 0) {
            return;
        }
        for (let i = 0; i < count; i++) {
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
    }

    public ingredientClass(
        ingredient: Ingredient,
        recipeStatus: RecipeStatus,
        ingredientsCount: number,
    ): string {
        let classes = '';
        const ingredients = this.ingredientsCtrl.value!;
        switch (true) {
            case this.#checkIfIngredientExists(ingredients, ingredient.id, ingredientsCount): {
                classes =
                    'ring-[3px] ' +
                    (RecipeStatus.Success === recipeStatus ? 'ring-green-500' : 'ring-pink-500');
                break;
            }
            case ingredient.rarity === IngredientRarity.Common: {
                classes = 'ring-[2px] ring-common';
                break;
            }
            case ingredient.rarity === IngredientRarity.Uncommon: {
                classes = 'ring-[2px] ring-uncommon';
                break;
            }
            case ingredient.rarity === IngredientRarity.Rare: {
                classes = 'ring-[2px] ring-rare';
                break;
            }
            case ingredient.rarity === IngredientRarity.Epic: {
                classes = 'ring-[2px] ring-epic';
                break;
            }
            case ingredient.rarity === IngredientRarity.Legendary: {
                classes = 'ring-[2px] ring-legendary';
                break;
            }
            case ingredient.rarity === IngredientRarity.UltraRare: {
                classes = 'ring-[2px] ring-ultra-rare';
                break;
            }
            default: {
                break;
            }
        }

        return ['w-9 h-9 rounded object-cover', classes].join(' ');
    }

    public checkRecipe() {
        const recipe = this.form.value;
        this.#recipeCheckGQL
            .fetch({ recipe } as Exact<{ recipe: RecipeCheckInput }>)
            .pipe(
                takeUntil(this.#unsubscribe$),
                filter(result => Array.isArray(result.data?.checkRecipe)),
            )
            .subscribe({
                next: result => {
                    const ingredientsCtrl = this.ingredientsCtrl.value!;
                    this.recipes = result.data.checkRecipe.map(recipe => {
                        const ingredients = [...recipe.ingredients].sort(
                            (ingredient1, ingredient2) => {
                                const [ingredient1Exists, ingredient2Exists] = [
                                    this.#checkIfIngredientExists(
                                        ingredientsCtrl,
                                        ingredient1.ingredient.id,
                                        ingredient1.count,
                                    ),
                                    this.#checkIfIngredientExists(
                                        ingredientsCtrl,
                                        ingredient2.ingredient.id,
                                        ingredient2.count,
                                    ),
                                ];
                                return ingredient1Exists === ingredient2Exists
                                    ? 0
                                    : ingredient1Exists
                                      ? -1
                                      : 1;
                            },
                        );
                        return { ...recipe, ingredients };
                    });
                },
            });
    }

    #checkIfIngredientExists(
        ingredients: Partial<{ ingredient_id: string; count: number }>[],
        ingredientId: string,
        ingredientsCount: number,
    ): boolean {
        return ingredients.some(
            ({ ingredient_id, count }) =>
                ingredient_id === ingredientId && ingredientsCount >= count!,
        );
    }

    #buildVariables(idsToFetch: string[] = []): PaginateIngredientQueryVariables {
        const filter = {};
        const search = this.searchIngredientsCtrl.value?.trim();
        if (search?.trim().length) {
            Object.assign(filter, { name: { contains: search } });
        } else if (idsToFetch.length > 0) {
            Object.assign(filter, { id: { in: idsToFetch } });
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
}
