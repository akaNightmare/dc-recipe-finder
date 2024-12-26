import { CdkScrollable } from '@angular/cdk/overlay';
import { AsyncPipe, DatePipe, NgClass, NgOptimizedImage } from '@angular/common';
import {
    AfterViewInit,
    Component,
    inject,
    OnDestroy,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { FuseCardComponent } from '@fuse/components/card';
import { BindQueryParamsFactory } from '@ngneat/bind-query-params';
import { QueryRef } from 'apollo-angular';
import xor from 'lodash-es/xor';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import {
    distinctUntilChanged,
    filter,
    map,
    of,
    pairwise,
    startWith,
    Subject,
    switchMap,
    takeUntil,
    timer,
} from 'rxjs';

import { FuseConfirmationService } from '@fuse/services/confirmation';
import { IngredientSearchComponent } from '../../../components/ingredient-search/ingredient-search.component';
import {
    IngredientRarity,
    Recipe,
    RecipePaginateOrderInput,
    RecipeStatus,
} from '../../../graphql.generated';
import { SortByPipe } from '../../../pipes';
import { RecipeDialogComponent } from './recipe-dialog/recipe-dialog.component';
// import { RecipeDialogComponent } from './recipe-dialog/recipe-dialog.component';
import { UsersGQL } from '../../../core/user/user.generated';
import {
    PaginateRecipeGQL,
    PaginateRecipeQuery,
    PaginateRecipeQueryVariables,
    RemoveRecipeGQL,
} from './recipes.generated';

@Component({
    selector: 'recipes',
    templateUrl: './recipes.component.html',
    styleUrls: ['./recipes.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [
        AsyncPipe,
        DatePipe,
        MatTableModule,
        MatSortModule,
        CdkScrollable,
        MatTooltipModule,
        // RecipeDialogComponent,
        MatButtonModule,
        MatIconModule,
        FuseCardComponent,
        NgClass,
        RouterLink,
        MatInputModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatPaginatorModule,
        NgxMatSelectSearchModule,
        MatMenuModule,
        SortByPipe,
        NgOptimizedImage,
        IngredientSearchComponent,
        MatSnackBarModule,
    ]
})
export class RecipesComponent implements AfterViewInit, OnDestroy {
    readonly #paginateRecipeGQL = inject(PaginateRecipeGQL);
    readonly #removeRecipeGQL = inject(RemoveRecipeGQL);
    readonly #fuseConfirmationService = inject(FuseConfirmationService);
    readonly #matDialog = inject(MatDialog);
    readonly #unsubscribe$ = new Subject<void>();
    readonly #queryFactory = inject(BindQueryParamsFactory);
    readonly #snackBar = inject(MatSnackBar);
    readonly #usersGQL = inject(UsersGQL);
    readonly #defaultSnackBarConfig: MatSnackBarConfig = {
        duration: 2500,
        horizontalPosition: 'right',
        verticalPosition: 'top',
    };

    public readonly dataSource = new MatTableDataSource<
        PaginateRecipeQuery['paginateRecipe']['items'][0]
    >();
    public readonly displayedColumns = [
        'name' /*, 'used_in'*/,
        'ingredients',
        'status',
        'owner',
        'created_at',
        'actions',
    ];
    public readonly pageSizeOptions = [5, 10, 25, 100];
    public readonly STATUSES = Object.values(RecipeStatus);
    public readonly RecipeStatus = RecipeStatus;
    public readonly IngredientRarity = IngredientRarity;
    public readonly users$ = this.#usersGQL.watch().valueChanges.pipe(
        filter(({ data }) => Array.isArray(data?.users)),
        map(({ data }) => data.users),
    );

    public readonly filters = new FormGroup({
        search: new FormControl(''),
        statuses: new FormControl<RecipeStatus[]>([]),
        rarities: new FormControl<IngredientRarity[]>([]),
        ingredients: new FormControl([]),
        created_by: new FormControl([]),
        page: new FormControl(1),
        limit: new FormControl(this.pageSizeOptions[3]),
        sort_dir: new FormControl<SortDirection>('desc'),
        sort_by: new FormControl('created_at'),
    });

    readonly #bindQueryParamsManager = this.#queryFactory
        .create(
            [
                { queryKey: 'search' },
                { queryKey: 'statuses', type: 'array' },
                { queryKey: 'rarities', type: 'array' },
                { queryKey: 'created_by', type: 'array' },
                { queryKey: 'ingredients', type: 'array' },
                { queryKey: 'page', type: 'number' },
                { queryKey: 'limit', type: 'number' },
                { queryKey: 'sort_dir' },
                { queryKey: 'sort_by' },
            ],
            { syncInitialControlValue: true },
        )
        .connect(this.filters);

    @ViewChild(MatPaginator) public readonly paginator!: MatPaginator;
    @ViewChild(MatSort) public readonly sort!: MatSort;

    #recipeRef!: QueryRef<PaginateRecipeQuery, PaginateRecipeQueryVariables>;

    ngAfterViewInit(): void {
        this.#recipeRef = this.#paginateRecipeGQL.watch(this.#buildVariables());

        this.paginator.page.pipe(takeUntil(this.#unsubscribe$)).subscribe(pageEvent => {
            this.filters.patchValue({ page: pageEvent.pageIndex + 1, limit: pageEvent.pageSize });
        });

        this.sort.sortChange.pipe(takeUntil(this.#unsubscribe$)).subscribe(sort => {
            this.filters.patchValue({ sort_dir: sort.direction, sort_by: sort.active });
        });

        this.filters.valueChanges
            .pipe(
                takeUntil(this.#unsubscribe$),
                startWith(undefined),
                pairwise(),
                distinctUntilChanged(),
                switchMap(([prev, curr]) => {
                    if (prev) {
                        if (
                            prev.search !== curr?.search ||
                            xor(prev.statuses, curr?.statuses).length > 0 ||
                            xor(prev.rarities, curr?.rarities).length > 0 ||
                            xor(prev.created_by, curr?.created_by).length > 0 ||
                            xor(prev.ingredients, curr?.ingredients).length > 0
                        ) {
                            if (curr?.page !== 1) {
                                curr!.page = 1;
                                this.paginator.pageIndex = 0;
                                this.filters.patchValue({ page: 1 });
                            }
                        }

                        if (prev.search !== curr?.search) {
                            return timer(300).pipe(map(() => curr));
                        }
                    }
                    return of(curr);
                }),
                distinctUntilChanged(),
            )
            .subscribe(filters => {
                void this.#recipeRef.refetch(this.#buildVariables(filters));
            });

        this.#recipeRef.valueChanges
            .pipe(
                takeUntil(this.#unsubscribe$),
                filter(({ data }) => Array.isArray(data?.paginateRecipe?.items)),
            )
            .subscribe(({ data }) => {
                this.paginator.length = data.paginateRecipe.page_info.total_items;
                this.dataSource.data = data.paginateRecipe.items;
            });

        setTimeout(() => this.filters.patchValue(this.filters.value), 0);
    }

    ngOnDestroy(): void {
        this.#bindQueryParamsManager.destroy();
        this.#unsubscribe$.next();
        this.#unsubscribe$.complete();
    }

    // public countReceiptsByStatus(ingredientName: string, status: string): number {
    //     return this.allRecipes.filter(
    //         recipe => recipe.status === status && recipe.ingredients.some(i => i?.name === ingredientName),
    //     ).length;
    // }

    public updateFilters(changes: Record<string, unknown>): void {
        this.filters.patchValue(changes);
    }

    public openRecipeDialog(recipe?: Recipe) {
        this.#matDialog
            .open(RecipeDialogComponent, {
                disableClose: true,
                maxHeight: '90vh',
                data: { recipe },
            })
            .afterClosed()
            .subscribe(result => {
                if (result) {
                    this.#snackBar.open(
                        `Recipe has been ${recipe ? 'updated' : 'created'}`,
                        undefined,
                        this.#defaultSnackBarConfig,
                    );
                    void this.#recipeRef.refetch(this.#buildVariables());
                }
            });
    }

    public deleteRecipe(recipe: Recipe) {
        this.#fuseConfirmationService
            .open({
                title: 'Recipe deletion confirmation',
                message: `Are you sure you want to delete&nbsp;<strong>${recipe.name}</strong>?`,
            })
            .afterClosed()
            .pipe(
                filter(result => result === 'confirmed'),
                switchMap(() => this.#removeRecipeGQL.mutate({ id: recipe.id })),
            )
            .subscribe(() => {
                this.#snackBar.open(
                    'Recipe has been deleted',
                    undefined,
                    this.#defaultSnackBarConfig,
                );
                void this.#recipeRef.refetch(this.#buildVariables());
            });
    }

    public createRecipeListQueryParams(recipe: Recipe): undefined | Record<string, unknown> {
        if (
            recipe.ingredients.length > 0 &&
            recipe.ingredients.length < 6 &&
            recipe.status === RecipeStatus.Success
        ) {
            return {
                base_ingredients: recipe.ingredients
                    .map(({ ingredient: { id }, count }) => `${id}:${count}`)
                    .join(','),
            };
        }
        return undefined;
    }

    public trackByFn(index: number, item: { id: string }): string | number {
        return item.id || index;
    }

    #buildVariables(values = this.filters.value): PaginateRecipeQueryVariables {
        const filter = {};
        if (values.search?.trim().length) {
            Object.assign(filter, { name: { contains: values.search } });
        }
        if (values.statuses?.length) {
            Object.assign(filter, { status: { in: values.statuses } });
        }
        if (values.rarities?.length) {
            Object.assign(filter, { rarity: { in: values.rarities } });
        }
        if (values.created_by?.length) {
            Object.assign(filter, { created_by: { in: values.created_by } });
        }
        if (values.ingredients?.length) {
            Object.assign(filter, { ingredients_ids: values.ingredients });
        }

        let order = null;
        if (values.sort_by && values.sort_dir) {
            order = [{ field: values.sort_by.toUpperCase(), dir: values.sort_dir.toUpperCase() }];
        }

        const pager = {
            page: values.page!,
            limit: values.limit!,
        };

        return { filter, order: order as RecipePaginateOrderInput[], pager };
    }
}
