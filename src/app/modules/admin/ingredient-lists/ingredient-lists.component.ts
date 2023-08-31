import { CdkScrollable } from '@angular/cdk/overlay';
import { AsyncPipe, DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
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
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BindQueryParamsFactory } from '@ngneat/bind-query-params';
import orderBy from 'lodash-es/orderBy';
import xor from 'lodash-es/xor';
import {
    combineLatest,
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

import { IngredientListsFacade } from '../../../../store/ingredient-lists';
import { IngredientList, IngredientListType } from '../../../../store/ingredient-lists/ingredient-lists.types';
import {
    ConfirmDialogComponent,
    ConfirmDialogModel,
} from '../../../components/confirm-dialog/confirm-dialog.component';
import { SortByPipe } from '../../../pipes/sort-by.pipe';
import { IngredientListsDialogComponent } from './ingredient-lists-dialog/ingredient-lists-dialog.component';

@Component({
    selector: 'ingredient-lists',
    standalone: true,
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
        NgForOf,
        NgIf,
        SortByPipe,
        MatTooltipModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatOptionModule,
        MatSelectModule,
        NgClass,
    ],
})
export class IngredientListsComponent implements OnDestroy, AfterViewInit {
    private readonly ilFacade = inject(IngredientListsFacade);
    private readonly matDialog = inject(MatDialog);
    private readonly unsubscribe$ = new Subject<void>();
    private readonly queryFactory = inject(BindQueryParamsFactory);

    public readonly displayedColumns = ['name', 'type', 'ingredients', 'actions'];
    public readonly pageSizeOptions = [5, 10, 25, 100];
    public readonly TYPES = Object.values(IngredientListType);
    public readonly ingredientListType = IngredientListType;
    public readonly filters = new FormGroup({
        search: new FormControl(),
        types: new FormControl([]),
        page: new FormControl(1),
        limit: new FormControl(this.pageSizeOptions[3]),
        sort_dir: new FormControl<SortDirection>('asc'),
        sort_by: new FormControl('name'),
    });

    public readonly filteredBannedIngredientLists$ = combineLatest([
        this.ilFacade.ingredientList$,
        this.filters.valueChanges.pipe(
            startWith(undefined),
            pairwise(),
            distinctUntilChanged(),
            switchMap(([prev, curr]) => {
                if (prev) {
                    if (prev.search !== curr.search || xor(prev.types, curr.types).length > 0) {
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
        map(([lists, filters]) => {
            const filtersFn = [];
            const search = filters?.search?.trim().toLowerCase();
            if (search) {
                filtersFn.push((list: IngredientList) => list.name?.toLowerCase().includes(search));
            }
            if (filters?.types.length > 0) {
                filtersFn.push((list: IngredientList) => filters.types.includes(list.type));
            }
            if (filtersFn.length > 0) {
                lists = lists.filter(list => filtersFn.every(fn => fn(list)));
            }
            if (filters?.sort_dir) {
                lists = orderBy(lists, filters.sort_by, filters.sort_dir);
            }
            this.paginator.length = lists.length;
            return lists.slice((filters.page - 1) * filters.limit, filters.page * filters.limit);
        }),
    );

    private readonly bindQueryParamsManager = this.queryFactory
        .create(
            [
                { queryKey: 'search' },
                { queryKey: 'types', type: 'array' },
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

    ngOnDestroy(): void {
        this.bindQueryParamsManager.destroy();
    }

    ngAfterViewInit(): void {
        this.paginator.page.pipe(takeUntil(this.unsubscribe$)).subscribe(pageEvent => {
            this.filters.patchValue({ page: pageEvent.pageIndex + 1, limit: pageEvent.pageSize });
        });

        this.sort.sortChange.pipe(takeUntil(this.unsubscribe$)).subscribe(sort => {
            this.filters.patchValue({ sort_dir: sort.direction, sort_by: sort.active });
        });

        setTimeout(() => this.filters.patchValue(this.filters.value), 0);
    }

    public openBannedIngredientListDialog(ingredientList?: IngredientList): void {
        this.matDialog
            .open(IngredientListsDialogComponent, {
                disableClose: true,
                maxHeight: '80vh',
                data: { ingredient_list: ingredientList },
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

    public deleteBannedIngredientList(bannedIngredientList: IngredientList) {
        this.matDialog
            .open(ConfirmDialogComponent, {
                data: new ConfirmDialogModel(
                    'Banned ingredient list deletion confirmation',
                    `Are you sure you want delete ${bannedIngredientList.name}?`,
                ),
            })
            .afterClosed()
            .pipe(filter(confirmed => confirmed === true))
            .subscribe(() => {
                this.ilFacade.removeIngredientList(bannedIngredientList);
            });
    }
}
