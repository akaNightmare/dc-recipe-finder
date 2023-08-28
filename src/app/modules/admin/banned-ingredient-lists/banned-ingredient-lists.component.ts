import { CdkScrollable } from '@angular/cdk/overlay';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BindQueryParamsFactory } from '@ngneat/bind-query-params';
import { orderBy } from 'lodash-es';
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

import { BannedIngredientListsFacade } from '../../../../store/banned-ingredient-lists';
import { BannedIngredientList } from '../../../../store/banned-ingredient-lists/banned-ingredient-lists.types';
import { Recipe } from '../../../../store/recipes/recipes.types';
import {
    ConfirmDialogComponent,
    ConfirmDialogModel,
} from '../../../components/confirm-dialog/confirm-dialog.component';
import { SortByPipe } from '../../../pipes/sort-by.pipe';
import { BannedIngredientListsDialogComponent } from './banned-ingredient-lists-dialog/banned-ingredient-lists-dialog.component';

@Component({
    selector: 'banned-ingredient-lists',
    standalone: true,
    templateUrl: './banned-ingredient-lists.component.html',
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
    ],
})
export class BannedIngredientListsComponent implements OnDestroy, AfterViewInit {
    private readonly bilFacade = inject(BannedIngredientListsFacade);
    private readonly matDialog = inject(MatDialog);
    private readonly unsubscribe$ = new Subject<void>();
    private readonly queryFactory = inject(BindQueryParamsFactory);

    public readonly displayedColumns = ['name', 'ingredients', 'actions'];
    public readonly pageSizeOptions = [5, 10, 25, 100];
    public readonly filters = new FormGroup({
        search: new FormControl(),
        page: new FormControl(1),
        limit: new FormControl(this.pageSizeOptions[3]),
        sort_dir: new FormControl<SortDirection>('asc'),
        sort_by: new FormControl('name'),
    });

    public readonly filteredBannedIngredientLists$ = combineLatest([
        this.bilFacade.bannedIngredientList$,
        this.filters.valueChanges.pipe(
            startWith(undefined),
            pairwise(),
            distinctUntilChanged(),
            switchMap(([prev, curr]) => {
                if (prev) {
                    if (prev.search !== curr.search) {
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
                filtersFn.push((recipe: Recipe) => recipe.name?.toLowerCase().includes(search));
            }
            if (filtersFn.length > 0) {
                lists = lists.filter(recipe => filtersFn.every(fn => fn(recipe)));
            }
            if (filters.sort_dir) {
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

        // FIXME: for some reason startWith is not working with pairwise in my case
        //  so let's do some hacky stuff
        this.filters.patchValue(this.filters.value);
    }

    public openBannedIngredientListDialog(bannedIngredientList?: BannedIngredientList): void {
        this.matDialog
            .open(BannedIngredientListsDialogComponent, {
                disableClose: true,
                maxHeight: '80vh',
                data: { banned_ingredient_list: bannedIngredientList },
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

    public deleteBannedIngredientList(bannedIngredientList: BannedIngredientList) {
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
                this.bilFacade.removeBannedIngredientList(bannedIngredientList);
            });
    }
}
