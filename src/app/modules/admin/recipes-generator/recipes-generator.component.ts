import { CdkScrollable } from '@angular/cdk/scrolling';
import { DatePipe, NgOptimizedImage, PercentPipe } from '@angular/common';
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
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { BindQueryParamsFactory } from '@ngneat/bind-query-params';
import { QueryRef } from 'apollo-angular';
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
import { RecipeList, RecipeListPaginateOrderInput } from '../../../graphql.generated';
import {
  ArchiveRecipeListGQL,
  PaginateRecipeListGQL,
  PaginateRecipeListQuery,
  PaginateRecipeListQueryVariables,
  RemoveRecipeListGQL,
} from './recipes-list.generated';
import { MatSlideToggle } from '@angular/material/slide-toggle';

@Component({
    selector: 'example',
    templateUrl: './recipes-generator.component.html',
    encapsulation: ViewEncapsulation.None,
  imports: [
    CdkScrollable,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatOptionModule,
    MatSelectModule,
    NgOptimizedImage,
    MatSnackBarModule,
    RouterLink,
    MatProgressBar,
    PercentPipe,
    MatSlideToggle,
  ],
})
export class RecipesGeneratorComponent implements OnDestroy, AfterViewInit {
    readonly #paginateRecipeListGQL = inject(PaginateRecipeListGQL);
    readonly #removeRecipeListGQL = inject(RemoveRecipeListGQL);
    readonly #archiveRecipeListGQL = inject(ArchiveRecipeListGQL);
    readonly #unsubscribe$ = new Subject<void>();
    readonly #queryFactory = inject(BindQueryParamsFactory);
    readonly #fuseConfirmationService = inject(FuseConfirmationService);
    readonly #snackBar = inject(MatSnackBar);
    readonly #defaultSnackBarConfig: MatSnackBarConfig = {
        duration: 2500,
        horizontalPosition: 'right',
        verticalPosition: 'top',
    };

    @ViewChild(MatPaginator) public readonly paginator!: MatPaginator;
    @ViewChild(MatSort) public readonly sort!: MatSort;

    public readonly dataSource = new MatTableDataSource<
        PaginateRecipeListQuery['paginateRecipeList']['items'][0]
    >();
    public readonly displayedColumns = [
        'name',
        'base_ingredients',
        'owner',
        'created_at',
        'recipes_count',
        'actions',
    ];
    public readonly pageSizeOptions = [5, 10, 25, 100];
    public readonly filters = new FormGroup({
        search: new FormControl(''),
        archived: new FormControl(false),
        page: new FormControl(1),
        limit: new FormControl(this.pageSizeOptions[3]),
        sort_dir: new FormControl<SortDirection>('desc'),
        sort_by: new FormControl('created_at'),
    });

    readonly #bindQueryParamsManager = this.#queryFactory
        .create(
            [
                { queryKey: 'search' },
                { queryKey: 'archived' },
                { queryKey: 'page', type: 'number' },
                { queryKey: 'limit', type: 'number' },
                { queryKey: 'sort_dir' },
                { queryKey: 'sort_by' },
            ],
            { syncInitialControlValue: true },
        )
        .connect(this.filters);

    #recipeListRef!: QueryRef<PaginateRecipeListQuery, PaginateRecipeListQueryVariables>;

    ngOnDestroy(): void {
        this.#bindQueryParamsManager.destroy();
        this.#unsubscribe$.next();
        this.#unsubscribe$.complete();
    }

    ngAfterViewInit(): void {
        this.#recipeListRef = this.#paginateRecipeListGQL.watch(this.#buildVariables());

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
                        if (prev.search !== curr?.search || prev.archived !== curr?.archived) {
                            if (curr && curr.page !== 1) {
                                curr.page = 1;
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
                void this.#recipeListRef.refetch(this.#buildVariables(filters));
            });

        this.#recipeListRef.valueChanges
            .pipe(
                takeUntil(this.#unsubscribe$),
                filter(({ data }) => Array.isArray(data?.paginateRecipeList?.items)),
            )
            .subscribe(({ data }) => {
                this.paginator.length = data.paginateRecipeList.page_info.total_items;
                this.dataSource.data = data.paginateRecipeList.items;
            });

        setTimeout(() => this.filters.patchValue(this.filters.value), 0);
    }

    public deleteRecipeList(recipeList: RecipeList) {
        this.#fuseConfirmationService
            .open({
                title: 'Recipe list deletion confirmation',
                message: `Are you sure you want to delete&nbsp;<strong>${recipeList.name}</strong>?`,
            })
            .afterClosed()
            .pipe(
                filter(result => result === 'confirmed'),
                switchMap(() => this.#removeRecipeListGQL.mutate({ id: recipeList.id })),
            )
            .subscribe(() => {
                this.#snackBar.open(
                    'Recipe list has been deleted',
                    undefined,
                    this.#defaultSnackBarConfig,
                );
                void this.#recipeListRef.refetch(this.#buildVariables());
            });
    }

    public archiveRecipeList(recipeList: RecipeList) {
        this.#fuseConfirmationService
            .open({
                title: 'Recipe list archivation confirmation',
                message: `Are you sure you want to archive&nbsp;<strong>${recipeList.name}</strong>?`,
            })
            .afterClosed()
            .pipe(
                filter(result => result === 'confirmed'),
                switchMap(() => this.#archiveRecipeListGQL.mutate({ id: recipeList.id })),
            )
            .subscribe(() => {
                this.#snackBar.open(
                    'Recipe list has been archived',
                    undefined,
                    this.#defaultSnackBarConfig,
                );
                void this.#recipeListRef.refetch(this.#buildVariables());
            });
    }

    public duplicateQueryParams(recipeList: RecipeList): Record<string, unknown> {
        return {
            name: `${recipeList.name} (copy ${(Math.random() + 1).toString(36).substring(3)})`,
            recipe_size: recipeList.recipe_size,
            banned_ingredient_list_ids: recipeList.banned_ingredient_lists
                .map(il => il.id)
                .join(','),
            allowed_ingredient_list_ids: recipeList.allowed_ingredient_lists
                .map(il => il.id)
                .join(','),
            banned_ingredient_ids: recipeList.banned_ingredients.map(i => i.id).join(','),
            base_ingredients: recipeList.base_ingredients
                .map(({ ingredient: { id }, count }) => `${id}:${count}`)
                .join(','),
        };
    }

    public trackByFn(index: number, item: { id?: string }): string | number {
        return item.id || index;
    }

    #buildVariables(values = this.filters.value): PaginateRecipeListQueryVariables {
        const filter = {};
        if (values.search?.trim().length) {
            Object.assign(filter, { name: { contains: values.search } });
        }
        if (values.archived) {
            Object.assign(filter, { archived_at: { ne: null } });
        } else {
          Object.assign(filter, { archived_at: { eq: null } });
        }
        let order = null;
        if (values.sort_by && values.sort_dir) {
            order = [{ field: values.sort_by.toUpperCase(), dir: values.sort_dir.toUpperCase() }];
        }

        const pager = {
            page: values.page!,
            limit: values.limit!,
        };

        return { filter, order: order as RecipeListPaginateOrderInput, pager };
    }
}
