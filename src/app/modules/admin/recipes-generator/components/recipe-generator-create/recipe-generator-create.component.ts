import { CdkScrollable } from '@angular/cdk/overlay';
import { AsyncPipe, DecimalPipe, NgClass, NgOptimizedImage } from '@angular/common';
import { Component, inject, OnDestroy, ViewEncapsulation } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormControl,
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
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { combineLatest, filter, map, share, startWith, tap } from 'rxjs';

import { MatCheckbox } from '@angular/material/checkbox';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { FuseAlertComponent } from '@fuse/components/alert';
import { BindQueryParamsFactory } from '@ngneat/bind-query-params';
import { IngredientSearchComponent } from '../../../../../components/ingredient-search/ingredient-search.component';
import {
    Ingredient,
    IngredientListType,
    IngredientRarity,
    RecipeListCreateInput,
} from '../../../../../graphql.generated';
import {
    PaginateIngredientListGQL,
    PaginateIngredientListQuery,
} from '../../../ingredient-lists/ingredient-lists.generated';
import { RecipeListCreateGQL } from '../../recipes-list.generated';

const baseRecipeSizeMap = new Map<number, number>([
    [3, 2],
    [4, 1],
    [5, 2],
    [6, 3],
]);

@Component({
    selector: 'recipes-generator-create',
    standalone: true,
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
        IngredientSearchComponent,
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
    ],
})
export class RecipeGeneratorCreateComponent implements OnDestroy {
    readonly #recipeListCreateGQL = inject(RecipeListCreateGQL);
    readonly #paginateIngredientListGQL = inject(PaginateIngredientListGQL);
    readonly #formBuilder = inject(FormBuilder);
    readonly #router = inject(Router);
    readonly #activatedRoute = inject(ActivatedRoute);
    readonly #snackBar = inject(MatSnackBar);
    readonly #queryFactory = inject(BindQueryParamsFactory);
    readonly #defaultSnackBarConfig: MatSnackBarConfig = {
        duration: 2500,
        horizontalPosition: 'right',
        verticalPosition: 'top',
    };

    public readonly searchBannedIngredientsCtrl = new FormControl<string>('');
    public readonly searchAllowedIngredientsCtrl = new FormControl<string>('');
    public readonly IngredientRarity = IngredientRarity;
    readonly #baseIngredientsErrorMessages = Object.freeze({
        required: 'Base ingredients are required',
        allAllowed: 'Base ingredients are the same as allowed',
        allBanned: 'Base ingredients are all banned',
    });

    public baseIngredients: Ingredient[] = [];

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
        base_ingredient_ids: new FormControl<string[]>([], {
            validators: [Validators.required, Validators.maxLength(5)],
        }),
        banned_ingredient_list_ids: new FormControl<string[]>([]),
        allowed_ingredient_list_ids: new FormControl<string[]>([], {
            validators: [Validators.required],
        }),
    });

    readonly #bindQueryParamsManager = this.#queryFactory
        .create(
            [
                { queryKey: 'name' },
                { queryKey: 'recipe_size', type: 'number' },
                { queryKey: 'base_ingredient_ids', type: 'array' },
            ],
            {
                syncInitialControlValue: true,
            },
        )
        .connect(this.form);

    ngOnDestroy(): void {
        this.#bindQueryParamsManager.destroy();
    }

    public readonly baseIngredientsErrorMessages$ = combineLatest([
        this.form.get('recipe_size')!.valueChanges.pipe(startWith(3)),
        this.form.get('base_ingredient_ids')!.valueChanges.pipe(startWith([])),
    ]).pipe(
        map(([recipeSize, baseIngredients]) => {
            const control = this.form.get('base_ingredient_ids')!;
            const errors = { ...this.#baseIngredientsErrorMessages };
            const minLength = baseRecipeSizeMap.get(recipeSize!);
            if (minLength && baseIngredients!.length > 0 && baseIngredients!.length < minLength) {
                Object.assign(errors, {
                    minLength: `Choose at least ${minLength} ingredient(s)`,
                });
                control.setErrors({ minLength: true });
            } else {
                this.#removeErrors(['minLength'], control);
            }
            return errors;
        }),
    );

    public readonly intersectedBannedAndAllowedIngredients$ = combineLatest([
        this.#ingredientLists$,
        this.form.get('banned_ingredient_list_ids')!.valueChanges,
        this.form.get('allowed_ingredient_list_ids')!.valueChanges,
    ]).pipe(
        startWith([[], [], []]),
        map(([ingredientLists, bannedIngredientListsIds, allowedIngredientLists]) => {
            const bannedListsIds = this.#extractIngredientIds(
                ingredientLists,
                bannedIngredientListsIds ?? [],
            );
            const allowedListsIds = this.#extractIngredientIds(
                ingredientLists,
                allowedIngredientLists ?? [],
            );
            return [bannedListsIds, allowedListsIds];
        }),
        tap(([bannedListsIds, allowedListsIds]) => {
            const control = this.form.get('allowed_ingredient_list_ids')!;
            if (
                allowedListsIds.length > 0 &&
                difference(allowedListsIds, bannedListsIds).length === 0
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
        this.form.get('base_ingredient_ids')!.valueChanges,
    ]).pipe(
        startWith([[], [], []]),
        map(([ingredientLists, bannedIngredientListsIds, baseIngredientsIds]) => [
            this.#extractIngredientIds(ingredientLists, bannedIngredientListsIds!),
            baseIngredientsIds,
        ]),
        tap(([bannedListsIds, baseIngredientsIds]) => {
            const control = this.form.get('base_ingredient_ids')!;
            if (
                baseIngredientsIds!.length > 0 &&
                difference(baseIngredientsIds, bannedListsIds!).length === 0
            ) {
                control.setErrors({ allBanned: true });
            } else {
                this.#removeErrors(['allBanned'], control);
            }
        }),
        map(
            ([bannedListsIds, baseIngredientsIds]) =>
                intersection(bannedListsIds, baseIngredientsIds).length,
        ),
    );

    public readonly intersectedAllowedAndBaseIngredients$ = combineLatest([
        this.#ingredientLists$,
        this.form.get('allowed_ingredient_list_ids')!.valueChanges,
        this.form.get('base_ingredient_ids')!.valueChanges,
    ]).pipe(
        startWith([[], [], []]),
        map(([ingredientLists, allowedIngredientLists, baseIngredientsIds]) => [
            this.#extractIngredientIds(ingredientLists, allowedIngredientLists!),
            baseIngredientsIds,
        ]),
        tap(([allowedListsIds, baseIngredientsIds]) => {
            const control = this.form.get('base_ingredient_ids')!;
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
        this.form.get('base_ingredient_ids')!.valueChanges.pipe(startWith([])),
        this.form.get('allowed_ingredient_list_ids')!.valueChanges.pipe(startWith([])),
        this.form.get('banned_ingredient_list_ids')!.valueChanges.pipe(startWith([])),
    ]).pipe(
        map(
            ([
                ingredientLists,
                baseIngredientIds,
                allowedIngredientLists,
                bannedIngredientLists,
            ]) => {
                const allowedIngredientIds = this.#extractIngredientIds(
                    ingredientLists,
                    allowedIngredientLists!,
                );
                const bannedIngredientIds = this.#extractIngredientIds(
                    ingredientLists,
                    bannedIngredientLists!,
                );
                const filteredIds = difference(
                    allowedIngredientIds,
                    baseIngredientIds!,
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
        this.form.get('base_ingredient_ids')!.valueChanges.pipe(startWith([])),
        this.filteredIngredients$.pipe(startWith([])),
        this.form.get('recipe_size')!.valueChanges.pipe(startWith(3)),
    ]).pipe(
        map(([baseIngredients, filteredIngredients, recipeSize]) => {
            if (!baseIngredients?.length || !filteredIngredients.length || !recipeSize) {
                return 0;
            }
            return Math.ceil(filteredIngredients.length / (6 - baseIngredients.length));
        }),
    );

    save(): void {
        if (this.form.invalid) {
            return;
        }

        const recipeList = this.form.value as RecipeListCreateInput;
        this.#recipeListCreateGQL.mutate({ recipeList }).subscribe(() => {
            this.#snackBar.open(
                `Recipe list "${recipeList.name}" has been created`,
                undefined,
                this.#defaultSnackBarConfig,
            );
            void this.#router.navigate(['..'], { relativeTo: this.#activatedRoute });
        });
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
