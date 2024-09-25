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
import { MatAnchor, MatButton, MatIconButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { FuseMasonryComponent } from '@fuse/components/masonry';
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
} from 'rxjs';
import { UsersGQL } from '../../../../../core/user/user.generated';
import { UserService } from '../../../../../core/user/user.service';
import { IngredientRarity, RecipeList, RecipeStatus, User } from '../../../../../graphql.generated';
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
    styleUrls: ['./recipe-generator-view.component.scss'],
    encapsulation: ViewEncapsulation.None,
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
        MatDivider,
        MatButton,
    ],
})
export class RecipeGeneratorViewComponent implements AfterViewInit, OnDestroy {
    readonly #paginateRecipeListRecipeGQL = inject(PaginateRecipeListRecipeGQL);
    readonly #assignRecipeListRecipeToUserGQL = inject(AssignRecipeListRecipeToUserGQL);
    readonly #usersGQL = inject(UsersGQL);
    readonly #userService = inject(UserService);
    readonly #unsubscribe$ = new Subject<void>();
    readonly #matDialog = inject(MatDialog);
    readonly #queryFactory = inject(BindQueryParamsFactory);
    readonly #activatedRoute = inject(ActivatedRoute);
    readonly #snackBar = inject(MatSnackBar);
    readonly #defaultSnackBarConfig: MatSnackBarConfig = {
        duration: 2500,
        horizontalPosition: 'right',
        verticalPosition: 'top',
    };

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
        users: new FormControl<string[]>([]),
        page: new FormControl(1),
        limit: new FormControl(this.pageSizeOptions[1]),
    });
    public currentUser!: User;
    public users: User[] = [];
    public recipeList!: RecipeList;
    @ViewChild(MatPaginator) public readonly paginator!: MatPaginator;

    readonly #bindQueryParamsManager = this.#queryFactory
        .create(
            [
                { queryKey: 'statuses', type: 'array' },
                { queryKey: 'users', type: 'array' },
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
                        if (
                            xor(prev.statuses, curr?.statuses).length > 0 ||
                            xor(prev.users, curr?.users).length > 0
                        ) {
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

        this.#userService
            .get()
            .pipe(takeUntil(this.#unsubscribe$))
            .subscribe(user => {
                this.currentUser = user;
            });

        this.#usersGQL
            .watch()
            .valueChanges.pipe(
                takeUntil(this.#unsubscribe$),
                filter(({ data }) => Array.isArray(data?.users)),
                map(({ data }) => data.users),
            )
            .subscribe(users => {
                this.users = users;
            });

        this.#activatedRoute.data
            .pipe(takeUntil(this.#unsubscribe$))
            .subscribe(({ recipeList }) => {
                this.recipeList = recipeList;
            });

        setTimeout(() => this.filters.patchValue(this.filters.value), 0);
    }

    getIngrecientCount(ingredientId: string): number | undefined {
        return this.recipeList.base_ingredients.find(
            ({ ingredient }) => ingredient.id === ingredientId,
        )?.count;
    }

    ngOnDestroy() {
        this.#bindQueryParamsManager.destroy();
        this.#unsubscribe$.next();
        this.#unsubscribe$.complete();
    }

    public counterClasses(
        recipeList: PaginateRecipeListRecipeQuery['paginateRecipeListRecipe']['items'][0],
    ): string {
        let classes: string;
        if (recipeList.recipe?.status === RecipeStatus.Success) {
            classes = 'bg-green-50 text-green-500 ring-2 ring-green-500';
        } else if (recipeList.recipe?.status === RecipeStatus.Failed) {
            classes = 'bg-pink-50 text-pink-500 ring-2 ring-pink-500';
        } else if (recipeList.assigned?.id === this.currentUser?.id) {
            classes = 'bg-white text-blue-400 ring-2 ring-blue-400';
        } else {
            classes = 'text-blue-400';
        }
        return (
            `absolute bg-card -top-2 -left-1 rounded shadow text-xs truncate w-4 h-4 text-center ` +
            classes
        );
    }

    public assignRecipeListRecipeToUser(recipeListRecipeId: string, userId: string | null): void {
        void this.#assignRecipeListRecipeToUserGQL
            .mutate({
                userId,
                recipeListRecipeId,
            })
            .subscribe(() => {
                this.#snackBar.open(
                    'Recipe has been ' +
                        (userId
                            ? `assigned to ${this.users.find(({ id }) => id === userId)?.login}`
                            : 'unassigned'),
                    undefined,
                    this.#defaultSnackBarConfig,
                );
            });
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
                    this.#snackBar.open(
                        `Recipe has been moved to ${status.toLowerCase()} status`,
                        undefined,
                        this.#defaultSnackBarConfig,
                    );
                }
            });
    }

    public regenerateRecipeList(): void {}

    #buildVariables(values = this.filters.value): PaginateRecipeListRecipeQueryVariables {
        const pager = {
            page: values.page!,
            limit: values.limit!,
        };

        const filter = {};
        if (values.statuses?.length) {
            Object.assign(filter, { status: { in: values.statuses } });
        }
        if (values.users?.length) {
            Object.assign(filter, { assigned_to: { in: values.users } });
        }

        return {
            pager,
            filter,
            recipeListId: this.#activatedRoute.snapshot.params['recipeListId'],
        };
    }
}
