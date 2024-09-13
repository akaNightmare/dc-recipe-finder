import { CdkScrollable } from '@angular/cdk/scrolling';
import { NgClass, NgOptimizedImage } from '@angular/common';
import {
    AfterViewInit,
    Component,
    inject,
    OnDestroy,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAnchor, MatIconButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { FuseMasonryComponent } from '@fuse/components/masonry';
import { BindQueryParamsFactory } from '@ngneat/bind-query-params';
import { QueryRef } from 'apollo-angular';
import xor from 'lodash-es/xor';
import {
    distinctUntilChanged,
    filter,
    of,
    pairwise,
    startWith,
    Subject,
    switchMap,
    takeUntil,
} from 'rxjs';
import { IngredientRarity, RecipeStatus } from '../../../../../graphql.generated';
import { SortByPipe } from '../../../../../pipes';
import { RecipeDialogComponent } from '../../../recipes/recipe-dialog/recipe-dialog.component';
import {
    AssignRecipeListRecipeToUserGQL,
    PaginateRecipeListRecipeGQL,
    PaginateRecipeListRecipeQuery,
    PaginateRecipeListRecipeQueryVariables,
} from '../../recipes-list.generated';

@Component({
    selector: 'recipe-generator-view',
    standalone: true,
    templateUrl: './recipe-generator-view.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./recipe-generator-view.component.scss'],
    imports: [
        FuseMasonryComponent,
        MatAnchor,
        MatFormField,
        MatIcon,
        MatInput,
        MatPaginator,
        ReactiveFormsModule,
        MatOption,
        MatSelect,
        NgOptimizedImage,
        MatTooltip,
        SortByPipe,
        NgClass,
        CdkScrollable,
        MatMenu,
        MatIconButton,
        MatMenuTrigger,
        MatMenuItem,
    ],
})
export class RecipeGeneratorViewComponent implements AfterViewInit, OnDestroy {
    readonly #paginateRecipeListRecipeGQL = inject(PaginateRecipeListRecipeGQL);
    readonly #assignRecipeListRecipeToUserGQL = inject(AssignRecipeListRecipeToUserGQL);
    readonly #unsubscribe$ = new Subject<void>();
    readonly #matDialog = inject(MatDialog);
    readonly #queryFactory = inject(BindQueryParamsFactory);
    readonly #activatedRoute = inject(ActivatedRoute);

    #recipeListRecipeRef!: QueryRef<
        PaginateRecipeListRecipeQuery,
        PaginateRecipeListRecipeQueryVariables
    >;

    public recipeListRecipes: PaginateRecipeListRecipeQuery['paginateRecipeListRecipe']['items'] =
        [];
    public readonly pageSizeOptions = [50, 100, 150, 200];
    public readonly RecipeStatus = RecipeStatus;
    public readonly IngredientRarity = IngredientRarity;
    public readonly STATUSES = Object.values(RecipeStatus);
    public readonly filters = new FormGroup({
        statuses: new FormControl<RecipeStatus[]>([]),
        page: new FormControl(1),
        limit: new FormControl(this.pageSizeOptions[1]),
    });
    @ViewChild(MatPaginator) public readonly paginator!: MatPaginator;

    readonly #bindQueryParamsManager = this.#queryFactory
        .create(
            [
                { queryKey: 'statuses', type: 'array' },
                { queryKey: 'page', type: 'number' },
                { queryKey: 'limit', type: 'number' },
            ],
            { syncInitialControlValue: true },
        )
        .connect(this.filters);

    ngAfterViewInit(): void {
        this.#recipeListRecipeRef = this.#paginateRecipeListRecipeGQL.watch(this.#buildVariables());

        this.paginator.page.pipe(takeUntil(this.#unsubscribe$)).subscribe(pageEvent => {
            this.filters.patchValue({ page: pageEvent.pageIndex + 1, limit: pageEvent.pageSize });
        });

        this.filters.valueChanges
            .pipe(
                takeUntil(this.#unsubscribe$),
                startWith(undefined),
                pairwise(),
                distinctUntilChanged(),
                switchMap(([prev, curr]) => {
                    if (prev) {
                        if (xor(prev.statuses, curr?.statuses).length > 0) {
                            if (curr && curr.page !== 1) {
                                curr.page = 1;
                                this.paginator.pageIndex = 0;
                                this.filters.patchValue({ page: 1 });
                            }
                        }
                    }
                    return of(curr);
                }),
                distinctUntilChanged(),
            )
            .subscribe(filters => {
                void this.#recipeListRecipeRef.refetch(this.#buildVariables(filters));
            });

        this.#recipeListRecipeRef.valueChanges
            .pipe(
                takeUntil(this.#unsubscribe$),
                filter(({ data }) => Array.isArray(data?.paginateRecipeListRecipe?.items)),
            )
            .subscribe(({ data }) => {
                this.paginator.length = data.paginateRecipeListRecipe.page_info.total_items;
                this.recipeListRecipes = data.paginateRecipeListRecipe.items;
            });

        setTimeout(() => this.filters.patchValue(this.filters.value), 0);
    }

    ngOnDestroy() {
        this.#bindQueryParamsManager.destroy();
        this.#unsubscribe$.next();
        this.#unsubscribe$.complete();
    }

    public openRecipeDialog(
        recipeListRecipe: PaginateRecipeListRecipeQuery['paginateRecipeListRecipe']['items'][0],
        status: RecipeStatus,
    ): void {
        this.#matDialog
            .open(RecipeDialogComponent, {
                disableClose: true,
                maxHeight: '90vh',
                data: {
                    recipe: {
                        id: recipeListRecipe.id,
                        name: '-',
                        status,
                        ingredients: recipeListRecipe.ingredients.map(({ id }) => ({
                            ingredient: { id },
                            count: 1,
                        })),
                    },
                    status,
                },
            })
            .afterClosed()
            .subscribe(result => {
                if (result) {
                    // this.#snackBar.open(
                    //     `Recipe has been ${recipe ? 'updated' : 'created'}`,
                    //     undefined,
                    //     this.#defaultSnackBarConfig,
                    // );
                }
            });
    }

    #buildVariables(values = this.filters.value): PaginateRecipeListRecipeQueryVariables {
        const pager = {
            page: values.page!,
            limit: values.limit!,
        };

        return { pager, recipeListId: this.#activatedRoute.snapshot.params['recipeListId'] };
    }
}
