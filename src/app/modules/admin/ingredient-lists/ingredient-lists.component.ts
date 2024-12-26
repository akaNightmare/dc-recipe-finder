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
import { MatOptionModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BindQueryParamsFactory } from '@ngneat/bind-query-params';
import { QueryRef } from 'apollo-angular';
import xor from 'lodash-es/xor';
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
import {
    IngredientList,
    IngredientListPaginateOrderInput,
    IngredientListType,
} from '../../../graphql.generated';
import { SortByPipe } from '../../../pipes';
import { IngredientListsDialogComponent } from './ingredient-lists-dialog/ingredient-lists-dialog.component';
import {
    PaginateIngredientListGQL,
    PaginateIngredientListQuery,
    PaginateIngredientListQueryVariables,
    RemoveIngredientListGQL,
} from './ingredient-lists.generated';

@Component({
    selector: 'ingredient-lists',
    templateUrl: './ingredient-lists.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [
        AsyncPipe,
        CdkScrollable,
        DatePipe,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatPaginatorModule,
        MatSortModule,
        MatTableModule,
        SortByPipe,
        MatTooltipModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatOptionModule,
        MatSelectModule,
        NgClass,
        NgOptimizedImage,
        MatSnackBarModule,
    ]
})
export class IngredientListsComponent implements OnDestroy, AfterViewInit {
    readonly #paginateIngredientListGQL = inject(PaginateIngredientListGQL);
    readonly #removeIngredientList = inject(RemoveIngredientListGQL);
    readonly #fuseConfirmationService = inject(FuseConfirmationService);
    readonly #snackBar = inject(MatSnackBar);
    readonly #defaultSnackBarConfig: MatSnackBarConfig = {
        duration: 2500,
        horizontalPosition: 'right',
        verticalPosition: 'top',
    };

    readonly #matDialog = inject(MatDialog);
    readonly #unsubscribe$ = new Subject<void>();
    readonly #queryFactory = inject(BindQueryParamsFactory);

    public readonly dataSource = new MatTableDataSource<
        PaginateIngredientListQuery['paginateIngredientList']['items'][0]
    >();
    public readonly displayedColumns = ['name', 'count', 'type', 'ingredients', 'actions'];
    public readonly pageSizeOptions = [5, 10, 25, 100];
    public readonly TYPES = Object.values(IngredientListType);
    public readonly IngredientListType = IngredientListType;
    public readonly filters = new FormGroup({
        search: new FormControl(''),
        types: new FormControl<IngredientListType[]>([]),
        page: new FormControl(1),
        limit: new FormControl(this.pageSizeOptions[3]),
        sort_dir: new FormControl<SortDirection>('asc'),
        sort_by: new FormControl('name'),
    });

    readonly #bindQueryParamsManager = this.#queryFactory
        .create(
            [
                { queryKey: 'search' },
                { queryKey: 'types', type: 'array' },
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

    #ingredientListRef!: QueryRef<
        PaginateIngredientListQuery,
        PaginateIngredientListQueryVariables
    >;

    ngOnDestroy(): void {
        this.#bindQueryParamsManager.destroy();
        this.#unsubscribe$.next();
        this.#unsubscribe$.complete();
    }

    ngAfterViewInit(): void {
        this.#ingredientListRef = this.#paginateIngredientListGQL.watch(this.#buildVariables());

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
                            xor(prev.types, curr?.types).length > 0
                        ) {
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
                void this.#ingredientListRef.refetch(this.#buildVariables(filters));
            });

        this.#ingredientListRef.valueChanges
            .pipe(
                takeUntil(this.#unsubscribe$),
                filter(({ data }) => Array.isArray(data?.paginateIngredientList?.items)),
            )
            .subscribe(({ data }) => {
                this.paginator.length = data.paginateIngredientList.page_info.total_items;
                this.dataSource.data = data.paginateIngredientList.items;
            });

        setTimeout(() => this.filters.patchValue(this.filters.value), 0);
    }

    public openIngredientListDialog(ingredientList?: IngredientList): void {
        this.#matDialog
            .open(IngredientListsDialogComponent, {
                disableClose: true,
                maxHeight: '80vh',
                data: { ingredient_list: ingredientList },
            })
            .afterClosed()
            .subscribe(result => {
                if (result) {
                    this.#snackBar.open(
                        `Ingredient list has been ${ingredientList ? 'updated' : 'created'}`,
                        undefined,
                        this.#defaultSnackBarConfig,
                    );
                    void this.#ingredientListRef.refetch(this.#buildVariables());
                }
            });
    }

    public deleteIngredientList(ingredientList: IngredientList) {
        this.#fuseConfirmationService
            .open({
                title: 'Ingredient list deletion confirmation',
                message: `Are you sure you want to delete&nbsp;<strong>${ingredientList.name}</strong>?`,
            })
            .afterClosed()
            .pipe(
                filter(result => result === 'confirmed'),
                switchMap(() => this.#removeIngredientList.mutate({ id: ingredientList.id })),
            )
            .subscribe(() => {
                this.#snackBar.open(
                    'Ingredient list has been deleted',
                    undefined,
                    this.#defaultSnackBarConfig,
                );
                void this.#ingredientListRef.refetch(this.#buildVariables());
            });
    }

    public trackByFn(index: number, item: { id?: string }): string | number {
        return item.id || index;
    }

    #buildVariables(values = this.filters.value): PaginateIngredientListQueryVariables {
        const filter = {};
        if (values.search?.trim().length) {
            Object.assign(filter, { name: { contains: values.search } });
        }
        if (values.types?.length) {
            Object.assign(filter, { type: { in: values.types } });
        }

        let order = null;
        if (values.sort_by && values.sort_dir) {
            order = [{ field: values.sort_by.toUpperCase(), dir: values.sort_dir.toUpperCase() }];
        }

        const pager = {
            page: values.page!,
            limit: values.limit!,
        };

        return { filter, order: order as IngredientListPaginateOrderInput, pager };
    }
}
