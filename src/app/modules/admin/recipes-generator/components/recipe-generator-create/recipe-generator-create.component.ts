import { CdkScrollable } from '@angular/cdk/overlay';
import { AsyncPipe, DecimalPipe, NgClass, NgOptimizedImage } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import {
    AbstractControl,
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import difference from 'lodash-es/difference';
import intersection from 'lodash-es/intersection';
import union from 'lodash-es/union';
import uniq from 'lodash-es/uniq';
import uniqBy from 'lodash-es/uniqBy';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import {
    combineLatest,
    debounceTime,
    filter,
    map,
    share,
    startWith,
    Subject,
    takeUntil,
    tap,
} from 'rxjs';

import { MatCheckbox } from '@angular/material/checkbox';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { FuseAlertComponent } from '@fuse/components/alert';
import { BindQueryParamsFactory } from '@ngneat/bind-query-params';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { QueryRef } from 'apollo-angular';
import { IngredientSearchComponent } from '../../../../../components/ingredient-search/ingredient-search.component';
import {
    Ingredient,
    IngredientListType,
    IngredientPaginateOrderField,
    IngredientRarity,
    OrderDir,
    RecipeListCreateInput,
} from '../../../../../graphql.generated';
import {
    PaginateIngredientListGQL,
    PaginateIngredientListQuery,
} from '../../../ingredient-lists/ingredient-lists.generated';
import {
    PaginateIngredientGQL,
    PaginateIngredientQuery,
    PaginateIngredientQueryVariables,
} from '../../../ingredients/ingredients.generated';
import { RecipeListCreateGQL } from '../../recipes-list.generated';

const baseRecipeSizeMap = new Map<number, number>([
    [1, 1],
    [2, 1],
    [3, 2],
    [4, 1],
    [5, 2],
    [6, 3],
]);

@Component({
    selector: 'recipes-generator-create',
    templateUrl: './recipes-generator-create.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [
        AsyncPipe,
        MatTableModule,
        MatSortModule,
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
        FuseAlertComponent,
        NgOptimizedImage,
        NgClass,
        MatCheckbox,
        MatSlideToggle,
        IngredientSearchComponent,
    ]
})
export class RecipeGeneratorCreateComponent implements OnDestroy, OnInit {
    readonly #recipeListCreateGQL = inject(RecipeListCreateGQL);
    readonly #paginateIngredientListGQL = inject(PaginateIngredientListGQL);
    readonly #formBuilder = inject(FormBuilder);
    readonly #unsubscribe$ = new Subject<void>();
    readonly #router = inject(Router);
    readonly #activatedRoute = inject(ActivatedRoute);
    readonly #snackBar = inject(MatSnackBar);
    readonly #queryFactory = inject(BindQueryParamsFactory);
    readonly #paginateIngredientGQL = inject(PaginateIngredientGQL);
    #ingredientRef!: QueryRef<PaginateIngredientQuery, PaginateIngredientQueryVariables>;
    readonly #defaultSnackBarConfig: MatSnackBarConfig = {
        duration: 2500,
        horizontalPosition: 'right',
        verticalPosition: 'top',
    };

    public readonly searchBannedIngredientsCtrl = new FormControl<string>('');
    public readonly searchAllowedIngredientsCtrl = new FormControl<string>('');
    public readonly searchIngredientsCtrl = new FormControl('');
    public readonly IngredientRarity = IngredientRarity;

    public baseIngredients: Ingredient[] = [];
    public searching = false;
    public ingredients: Ingredient[] = [];
    public canRemoveBaseIngredientCtrl = false;

    ngOnInit() {
        this.#ingredientRef = this.#paginateIngredientGQL.watch(this.#buildVariables());

        this.#ingredientRef.valueChanges
            .pipe(
                takeUntil(this.#unsubscribe$),
                filter(({ data }) => Array.isArray(data?.paginateIngredient?.items)),
            )
            .subscribe(({ data }) => {
                this.ingredients = uniqBy(
                    [
                        ...(data.paginateIngredient.items ?? []),
                        ...(this.baseIngredientsCtrl.value || [])
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

        combineLatest([
            this.form.get('recipe_size')!.valueChanges.pipe(startWith(3)),
            this.baseIngredientsCtrl.valueChanges,
        ])
            .pipe(takeUntil(this.#unsubscribe$))
            .subscribe(([recipeSize, baseIngredients]) => {
                recipeSize = +recipeSize!;
                const baseIngredientsCount = baseIngredients.length;
                if (baseIngredientsCount < 1) {
                    this.canRemoveBaseIngredientCtrl = false;
                } else {
                    const minLength = +baseRecipeSizeMap.get(recipeSize)!;
                    const queryLength = /*
                        this.#bindQueryParamsManager.search.get('base_ingredients')?.split(',')
                            .length ?? */ 0;
                    this.addIngredientField(
                        Math.max(minLength - baseIngredientsCount, queryLength),
                    );
                    this.canRemoveBaseIngredientCtrl = baseIngredientsCount > minLength;
                    this.#bindQueryParamsManager.syncDefs('base_ingredients');
                    void this.#ingredientRef.refetch(
                        this.#buildVariables(
                            baseIngredients
                                .map(({ ingredient_id }) => ingredient_id)
                                .filter(Boolean) as string[],
                        ),
                    );
                }
            });

        this.addIngredientField();
        setTimeout(() => this.form.patchValue(this.form.value), 0);
        this.#bindQueryParamsManager.syncDefs('base_ingredients');
    }

    readonly #ingredientLists$ = this.#paginateIngredientListGQL
        .watch({
            pager: undefined,
            order: undefined,
            filter: {},
        })
        .valueChanges.pipe(
            filter(result => Array.isArray(result.data?.paginateIngredientList?.items)),
            map(result => result.data.paginateIngredientList.items),
            share(),
        );

    public readonly bannedIngredientLists$ = combineLatest([
        this.#ingredientLists$,
        this.searchBannedIngredientsCtrl.valueChanges.pipe(startWith('')),
    ]).pipe(
        map(([ingredientLists, search]) =>
            this.#filterIngredientLists(
                ingredientLists,
                this.form.get('banned_ingredient_list_ids')?.value ?? [],
                IngredientListType.Banlist,
                search!,
            ),
        ),
    );

    public readonly allowedIngredientLists$ = combineLatest([
        this.#ingredientLists$,
        this.searchAllowedIngredientsCtrl.valueChanges.pipe(startWith('')),
    ]).pipe(
        map(([ingredientLists, search]) =>
            this.#filterIngredientLists(
                ingredientLists,
                this.form.get('allowed_ingredient_list_ids')?.value ?? [],
                IngredientListType.Allowlist,
                search!,
            ),
        ),
    );
    public readonly form = this.#formBuilder.group({
        name: ['', [Validators.required]],
        recipe_size: [3, [Validators.required, Validators.min(3), Validators.max(6)]],
        base_ingredients: this.#formBuilder.array(
            [],
            [Validators.required, Validators.maxLength(5), RxwebValidators.unique()],
        ),
        banned_ingredient_list_ids: new FormControl<string[]>([]),
        banned_ingredient_ids: new FormControl<string[]>([]),
        allowed_ingredient_list_ids: new FormControl<string[]>([], {
            validators: [Validators.required],
        }),
    });

    readonly #bindQueryParamsManager = this.#queryFactory
        .create(
            [
                { queryKey: 'name' },
                { queryKey: 'recipe_size', type: 'number' },
                { queryKey: 'allowed_ingredient_list_ids', type: 'array' },
                { queryKey: 'banned_ingredient_list_ids', type: 'array' },
                { queryKey: 'banned_ingredient_ids', type: 'array' },
                {
                    queryKey: 'base_ingredients',
                    serializer: (value: { ingredient_id: string; count: number }[]) =>
                        value
                            .map(({ ingredient_id, count }) => `${ingredient_id}:${count}`)
                            .join(','),
                    parser: (value: string) =>
                        value.split(',').map(part => {
                            const [ingredient_id, count] = part.split(':');
                            return { ingredient_id, count: Number.parseInt(count, 10) };
                        }),
                },
            ],
            {
                syncInitialControlValue: true,
            },
        )
        .connect(this.form);

    ngOnDestroy(): void {
        this.#bindQueryParamsManager.destroy();
    }

    public readonly intersectedBannedAndAllowedIngredients$ = combineLatest([
        this.#ingredientLists$,
        this.form.get('banned_ingredient_list_ids')!.valueChanges,
        this.form.get('banned_ingredient_ids')!.valueChanges,
        this.form.get('allowed_ingredient_list_ids')!.valueChanges,
    ]).pipe(
        startWith([[], [], [], []]),
        map(
            ([
                ingredientLists,
                bannedIngredientListsIds,
                banned_ingredient_ids,
                allowedIngredientLists,
            ]) => {
                const bannedIngredientIds = uniq([
                    ...this.#extractIngredientIds(ingredientLists, bannedIngredientListsIds ?? []),
                    ...(banned_ingredient_ids ?? []),
                ]);
                const allowedIngredientIds = this.#extractIngredientIds(
                    ingredientLists,
                    allowedIngredientLists ?? [],
                );
                return [bannedIngredientIds, allowedIngredientIds];
            },
        ),
        tap(([bannedIngredientIds, allowedIngredientIds]) => {
            const control = this.form.get('allowed_ingredient_list_ids')!;
            if (
                allowedIngredientIds.length > 0 &&
                difference(allowedIngredientIds, bannedIngredientIds).length === 0
            ) {
                control.setErrors({ allBanned: true });
            } else {
                this.#removeErrors(['allBanned'], control);
            }
        }),
        map(
            ([bannedListsIds, allowedListsIds]) =>
                intersection(bannedListsIds, allowedListsIds).length,
        ),
    );

    public readonly intersectedBannedAndBaseIngredients$ = combineLatest([
        this.#ingredientLists$,
        this.form.get('banned_ingredient_list_ids')!.valueChanges,
        this.form.get('banned_ingredient_ids')!.valueChanges,
        this.baseIngredientsCtrl.valueChanges,
    ]).pipe(
        startWith([[], [], [], []]),
        map(
            ([
                ingredientLists,
                bannedIngredientListsIds,
                banned_ingredient_ids,
                baseIngredients,
            ]) => [
                uniq([
                    ...this.#extractIngredientIds(ingredientLists, bannedIngredientListsIds!),
                    ...(banned_ingredient_ids ?? []),
                ]),
                baseIngredients.map(({ ingredient_id }) => ingredient_id),
            ],
        ),
        tap(([bannedIngredientIds, baseIngredientsIds]) => {
            const control = this.baseIngredientsCtrl;
            if (
                baseIngredientsIds!.length > 0 &&
                difference(baseIngredientsIds, bannedIngredientIds!).length === 0
            ) {
                control.setErrors({ allBanned: true });
            } else {
                this.#removeErrors(['allBanned'], control);
            }
        }),
        map(
            ([bannedIngredientIds, baseIngredientsIds]) =>
                intersection(bannedIngredientIds, baseIngredientsIds).length,
        ),
    );

    public readonly intersectedAllowedAndBaseIngredients$ = combineLatest([
        this.#ingredientLists$,
        this.form.get('allowed_ingredient_list_ids')!.valueChanges,
        this.baseIngredientsCtrl.valueChanges,
    ]).pipe(
        startWith([[], [], []]),
        map(([ingredientLists, allowedIngredientLists, baseIngredients]) => [
            this.#extractIngredientIds(ingredientLists, allowedIngredientLists!),
            baseIngredients.map(({ ingredient_id }) => ingredient_id),
        ]),
        tap(([allowedListsIds, baseIngredientsIds]) => {
            const control = this.baseIngredientsCtrl;
            if (
                baseIngredientsIds!.length > 0 &&
                baseIngredientsIds!.length === allowedListsIds!.length &&
                difference(baseIngredientsIds, allowedListsIds!).length === 0
            ) {
                control.setErrors({ allAllowed: true });
            } else {
                this.#removeErrors(['allAllowed'], control);
            }
        }),
        map(
            ([allowedListsIds, baseIngredientsIds]) =>
                intersection(allowedListsIds, baseIngredientsIds).length,
        ),
    );

    public readonly allowedIngredientListsNames$ = combineLatest([
        this.#ingredientLists$,
        this.form.get('allowed_ingredient_list_ids')!.valueChanges,
    ]).pipe(
        map(([ingredientLists, allowedIngredientLists]) =>
            allowedIngredientLists!.map(id => ingredientLists.find(list => list.id === id)?.name),
        ),
    );

    public readonly bannedIngredientListsNames$ = combineLatest([
        this.#ingredientLists$,
        this.form.get('banned_ingredient_list_ids')!.valueChanges,
    ]).pipe(
        map(([ingredientLists, bannedIngredientLists]) =>
            bannedIngredientLists!.map(id => ingredientLists.find(list => list.id === id)?.name),
        ),
    );

    public readonly filteredIngredients$ = combineLatest([
        this.#ingredientLists$.pipe(startWith([])),
        this.baseIngredientsCtrl.valueChanges.pipe(startWith([])),
        this.form.get('allowed_ingredient_list_ids')!.valueChanges.pipe(startWith([])),
        this.form.get('banned_ingredient_list_ids')!.valueChanges.pipe(startWith([])),
        this.form.get('banned_ingredient_ids')!.valueChanges.pipe(startWith([])),
    ]).pipe(
        map(
            ([
                ingredientLists,
                baseIngredientIds,
                allowedIngredientLists,
                bannedIngredientLists,
                banned_ingredient_ids,
            ]) => {
                const allowedIngredientIds = this.#extractIngredientIds(
                    ingredientLists,
                    allowedIngredientLists!,
                );
                const bannedIngredientIds = uniq([
                    ...this.#extractIngredientIds(ingredientLists, bannedIngredientLists!),
                    ...(banned_ingredient_ids ?? []),
                ]);
                const filteredIds = difference(
                    allowedIngredientIds,
                    baseIngredientIds!.map(({ ingredient_id }) => ingredient_id),
                    bannedIngredientIds,
                );
                const ingredients = ingredientLists
                    .flatMap(list => list.ingredients)
                    .concat(this.baseIngredients);
                return filteredIds
                    .map(id => ingredients.find(ingredient => ingredient.id === id))
                    .filter(Boolean);
            },
        ),
    );

    public readonly recipesCount$ = combineLatest([
        this.baseIngredientsCtrl.valueChanges.pipe(startWith([])),
        this.filteredIngredients$.pipe(startWith([])),
        this.form.get('recipe_size')!.valueChanges.pipe(startWith(3)),
    ]).pipe(
        map(([baseIngredients, filteredIngredients, recipeSize]) => {
            const baseIngredientsCount = baseIngredients.filter(
                ({ ingredient_id }) => !!ingredient_id,
            ).length;
            if (!baseIngredientsCount || !filteredIngredients.length || !recipeSize) {
                return 0;
            }
            return Math.ceil(filteredIngredients.length / (6 - baseIngredientsCount));
        }),
    );

    save(): void {
        if (this.form.invalid) {
            return;
        }

        const recipeList = this.form.value as RecipeListCreateInput;
        this.#recipeListCreateGQL.mutate({ recipeList }).subscribe({
            next: () => {
                this.#snackBar.open(
                    `Recipe list "${recipeList.name}" has been created`,
                    undefined,
                    this.#defaultSnackBarConfig,
                );
                void this.#router.navigate(['..'], { relativeTo: this.#activatedRoute });
            },
            error: error => {
                this.#snackBar.open(
                    error.networkError?.error?.data?.message ??
                        error.networkError?.error?.errors?.[0]?.message ??
                        `Failed to create recipe list "${recipeList.name}"`,
                    undefined,
                    this.#defaultSnackBarConfig,
                );
            },
        });
    }

    get baseIngredientsCtrl(): FormArray<
        FormGroup<{ ingredient_id: FormControl<string>; count: FormControl<number> }>
    > {
        return this.form.get('base_ingredients') as FormArray;
    }

    removeIngredientField(index: number): void {
        this.baseIngredientsCtrl.removeAt(index);
    }

    addIngredientField(count = 1): void {
        if (count <= 0) {
            return;
        }
        for (let i = 0; i < count; i++) {
            this.baseIngredientsCtrl.push(
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

    ingredientById(ingredientId?: string): Ingredient | undefined {
        if (!ingredientId) {
            return;
        }
        return this.ingredients.find(i => i.id === ingredientId);
    }

    moveIngredientToBanned(ingredientId: string): void {
        const bannedIngredients = this.form.get('banned_ingredient_ids') as FormControl<string[]>;
        bannedIngredients.setValue([...bannedIngredients.value, ingredientId]);
    }

    get canAddIngredientField(): boolean {
        return this.baseIngredientsCtrl.length < 5;
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

    #extractIngredientIds(
        ingredientLists: PaginateIngredientListQuery['paginateIngredientList']['items'],
        listIds: string[],
    ): string[] {
        return listIds.reduce(
            (acc, id) =>
                union(
                    acc,
                    ingredientLists
                        .find(il => il.id === id)
                        ?.ingredients.map(ingredient => ingredient.id) ?? [],
                ),
            [] as string[],
        );
    }

    #filterIngredientLists(
        ingredientLists: PaginateIngredientListQuery['paginateIngredientList']['items'],
        ingredientListsIds: string[],
        type: IngredientListType,
        search: string,
    ): PaginateIngredientListQuery['paginateIngredientList']['items'] {
        const loweredSearch = search.toLowerCase().trim();
        return ingredientLists.filter(
            ingredientList =>
                ingredientList.type === type &&
                (ingredientListsIds.includes(ingredientList.id) ||
                    !loweredSearch ||
                    ingredientList.name.toLowerCase().includes(loweredSearch)),
        );
    }

    #removeErrors(keys: string[], control: AbstractControl): void {
        if (keys.length === 0) {
            return;
        }

        const remainingErrors = keys.reduce(
            (errors, key) => {
                delete errors[key];
                return errors;
            },
            { ...control.errors },
        );

        if (Object.keys(remainingErrors).length > 0) {
            control.setErrors(remainingErrors);
        } else {
            control.setErrors(null);
        }
    }
}
