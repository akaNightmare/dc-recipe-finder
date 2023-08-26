import { CdkScrollable } from '@angular/cdk/overlay';
import { AsyncPipe, DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { FuseCardComponent } from '@fuse/components/card';
import { BindQueryParamsFactory } from '@ngneat/bind-query-params';
import { orderBy, xor } from 'lodash-es';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import {
    combineLatest,
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
    of,
    pairwise,
    startWith,
    Subject,
    switchMap,
    takeUntil,
    tap,
    timer,
} from 'rxjs';

import { IngredientsFacade } from '../../../../store/ingredients';
import { RecipesFacade } from '../../../../store/recipes';
import { Recipe, RecipeStatus } from '../../../../store/recipes/recipes.types';
import {
    ConfirmDialogComponent,
    ConfirmDialogModel,
} from '../../../components/confirm-dialog/confirm-dialog.component';
import { SortByPipe } from '../../../pipes/sort-by.pipe';
import { RecipeDialogComponent } from './recipe-dialog/recipe-dialog.component';

@Component({
    selector: 'recipes',
    standalone: true,
    templateUrl: './recipes.component.html',
    styleUrls: ['./recipes.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [
        NgForOf,
        AsyncPipe,
        DatePipe,
        NgIf,
        MatTableModule,
        MatSortModule,
        CdkScrollable,
        MatTooltipModule,
        RecipeDialogComponent,
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
    ],
})
export class RecipesComponent implements AfterViewInit, OnDestroy {
    private readonly recipesFacade = inject(RecipesFacade);
    private readonly ingredientsFacade = inject(IngredientsFacade);
    private readonly matDialog = inject(MatDialog);
    private readonly unsubscribe$ = new Subject<void>();
    private readonly queryFactory = inject(BindQueryParamsFactory);

    public readonly displayedColumns = ['name', 'used_in', 'ingredients', 'status', 'added_at', 'actions'];
    public readonly pageSizeOptions = [5, 10, 25, 100];
    public readonly STATUSES = Object.keys(RecipeStatus);

    public readonly filters = new FormGroup({
        search: new FormControl(),
        statuses: new FormControl([]),
        ingredients: new FormControl([]),
        page: new FormControl(1),
        limit: new FormControl(this.pageSizeOptions[3]),
        sort_dir: new FormControl<SortDirection>('asc'),
        sort_by: new FormControl('name'),
    });

    public allRecipes: Recipe[] = [];
    public readonly searchIngredientsCtrl = new FormControl('');
    public readonly ingredientsToSearch$ = combineLatest([
        this.searchIngredientsCtrl.valueChanges.pipe(startWith(undefined), debounceTime(200), distinctUntilChanged()),
        this.ingredientsFacade.ingredients$,
    ]).pipe(
        map(([search, ingredients]) => {
            search = search?.toLowerCase().trim();
            if (search) {
                ingredients = ingredients.filter(ingredient => ingredient.name.toLowerCase().includes(search));
            }
            return ingredients;
        }),
    );
    public readonly filteredIngredients$ = combineLatest([
        this.recipesFacade.recipes$.pipe(
            tap(recipes => {
                this.allRecipes = recipes;
            }),
        ),
        this.filters.valueChanges.pipe(
            startWith(undefined),
            pairwise(),
            distinctUntilChanged(),
            switchMap(([prev, curr]) => {
                if (prev) {
                    if (
                        prev.search !== curr.search ||
                        xor(prev.statuses, curr.statuses).length > 0 ||
                        xor(prev.ingredients, curr.ingredients).length > 0
                    ) {
                        if (curr.page !== 1) {
                            curr.page = 1;
                            this.paginator.pageIndex = 0;
                            this.filters.patchValue({ page: 1 });
                        }
                    }

                    if (prev.search !== curr.search) {
                        return timer(200).pipe(map(() => curr));
                    }
                }
                return of(curr);
            }),
            distinctUntilChanged(),
        ),
    ]).pipe(
        map(([recipes, filters]) => {
            const filtersFn = [];
            if (filters?.statuses.length) {
                filtersFn.push((recipe: Recipe) => filters.statuses.includes(recipe.status));
            }
            const search = filters?.search?.trim().toLowerCase();
            if (search) {
                filtersFn.push((recipe: Recipe) => recipe.name?.toLowerCase().includes(search));
            }
            if (filters?.ingredients.length) {
                filtersFn.push((recipe: Recipe) =>
                    filters.ingredients.every(fi => recipe.ingredients.some(i => fi === i.name)),
                );
            }
            if (filtersFn.length > 0) {
                recipes = recipes.filter(recipe => filtersFn.every(fn => fn(recipe)));
            }
            if (filters.sort_dir) {
                recipes = orderBy(recipes, filters.sort_by, filters.sort_dir);
            }
            this.paginator.length = recipes.length;
            return recipes.slice((filters.page - 1) * filters.limit, filters.page * filters.limit);
        }),
    );

    private readonly bindQueryParamsManager = this.queryFactory
        .create(
            [
                { queryKey: 'search' },
                { queryKey: 'statuses', type: 'array' },
                { queryKey: 'ingredients', type: 'array' },
                { queryKey: 'page', type: 'number' },
                { queryKey: 'limit', type: 'number' },
                { queryKey: 'sort_dir' },
                { queryKey: 'sort_by' },
            ],
            {
                syncInitialControlValue: true,
            },
        )
        .connect(this.filters);

    @ViewChild(MatPaginator) public readonly paginator: MatPaginator;
    @ViewChild(MatSort) public readonly sort: MatSort;

    ngAfterViewInit(): void {
        this.paginator.page.pipe(takeUntil(this.unsubscribe$)).subscribe(pageEvent => {
            this.filters.patchValue({ page: pageEvent.pageIndex + 1, limit: pageEvent.pageSize });
        });

        this.sort.sortChange.pipe(takeUntil(this.unsubscribe$)).subscribe(sort => {
            this.filters.patchValue({ sort_dir: sort.direction, sort_by: sort.active });
        });

        // FIXME: for some reason startWith is not working with pairwise in my case
        //  so let's do some hacky stuff
        this.filters.patchValue(this.filters.value);
    }

    ngOnDestroy(): void {
        this.bindQueryParamsManager.destroy();
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    public countReceiptsByStatus(ingredientName: string, status: string): number {
        return this.allRecipes.filter(
            recipe => recipe.status === status && recipe.ingredients.some(i => i?.name === ingredientName),
        ).length;
    }

    public updateFilters(changes: Record<string, unknown>): void {
        this.filters.patchValue(changes);
    }

    public openRecipeDialog(recipe?: Recipe) {
        this.matDialog
            .open(RecipeDialogComponent, {
                disableClose: true,
                maxHeight: '90vh',
                data: { recipe },
            })
            .afterClosed()
            .subscribe(result => {
                if (result) {
                    // this._snackBar.open(
                    //     `Ingredient has been ${organization ? 'updated' : 'created'}`,
                    //     undefined,
                    //     this._defaultSnackBarConfig,
                    // );
                }
            });
    }

    public deleteRecipe(recipe: Recipe) {
        this.matDialog
            .open(ConfirmDialogComponent, {
                data: new ConfirmDialogModel(
                    'Recipe deletion confirmation',
                    `Are you sure you want delete ${recipe.name}?`,
                ),
            })
            .afterClosed()
            .pipe(filter(confirmed => confirmed === true))
            .subscribe(() => {
                this.recipesFacade.removeRecipe(recipe.name);
            });
    }
}
