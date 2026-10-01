import { NgClass, NgOptimizedImage } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BindQueryParamsFactory } from '@ngneat/bind-query-params';
import { QueryRef } from 'apollo-angular';
import { distinctUntilChanged, filter, map, of, pairwise, startWith, switchMap, timer } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthUtils } from '../../../core/auth/auth.utils';
import { Ingredient, IngredientRarity, UserRole } from '../../../graphql.generated';
import { IngredientImagePipe } from '../../../pipes';
import { IngredientDialogComponent } from './components/ingredient-dialog.component';
import {
    PaginateIngredientGQL,
    PaginateIngredientQuery,
    PaginateIngredientQueryVariables,
} from './ingredients.generated';

@Component({
    selector: 'ingredients',
    templateUrl: './ingredients.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [
        MatTableModule,
        MatSortModule,
        MatTooltipModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        ReactiveFormsModule,
        NgOptimizedImage,
        MatOptionModule,
        MatSelectModule,
        NgClass,
        IngredientImagePipe,
    ],
})
export class IngredientsComponent implements OnInit, AfterViewInit {
    readonly #destroyRef = inject(DestroyRef);
    readonly #authService = inject(AuthService);
    readonly #paginateIngredientGQL = inject(PaginateIngredientGQL);
    readonly #queryFactory = inject(BindQueryParamsFactory);
    readonly #matDialog = inject(MatDialog);
    readonly #snackBar = inject(MatSnackBar);
    readonly #defaultSnackBarConfig: MatSnackBarConfig = {
        duration: 2500,
        horizontalPosition: 'right',
        verticalPosition: 'top',
    };
    #ingredientRef!: QueryRef<PaginateIngredientQuery, PaginateIngredientQueryVariables>;

    public ingredients: Ingredient[] = [];
    public isAdmin = false;

    public readonly filters = new FormGroup({
        search: new FormControl(''),
        rarities: new FormControl<IngredientRarity[]>([]),
    });
    public readonly RARITIES = Object.values(IngredientRarity);
    public readonly IngredientRarity = IngredientRarity;

    readonly #bindQueryParamsManager = this.#queryFactory
        .create([{ queryKey: 'search' }, { queryKey: 'rarities', type: 'array' }], {
            syncInitialControlValue: true,
        })
        .connect(this.filters);

    ngOnInit(): void {
        this.isAdmin = this.#hasAdminRole();
    }

    public openIngredientDialog(ingredient?: Ingredient): void {
        if (!ingredient && !this.isAdmin) {
            return;
        }

        this.#matDialog
            .open(IngredientDialogComponent, {
                disableClose: true,
                maxHeight: '80vh',
                data: { ingredient },
            })
            .afterClosed()
            .subscribe(result => {
                if (result) {
                    void this.#ingredientRef.refetch(this.#buildVariables());
                    this.#snackBar.open(
                        `Ingredient has been ${ingredient ? 'updated' : 'created'}`,
                        undefined,
                        this.#defaultSnackBarConfig,
                    );
                }
            });
    }

    ngAfterViewInit(): void {
        this.#ingredientRef = this.#paginateIngredientGQL.watch({
            variables: this.#buildVariables(),
        });

        this.filters.valueChanges
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                startWith(undefined),
                pairwise(),
                distinctUntilChanged(),
                switchMap(([prev, curr]) => {
                    if (prev) {
                        if (prev.search !== curr?.search) {
                            return timer(300).pipe(map(() => curr));
                        }
                    }
                    return of(curr);
                }),
                distinctUntilChanged(),
            )
            .subscribe(filters => {
                void this.#ingredientRef.refetch(this.#buildVariables(filters));
            });

        this.#ingredientRef.valueChanges
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(({ data }) => Array.isArray(data?.paginateIngredient?.items)),
            )
            .subscribe(({ data }) => {
                this.ingredients = data!.paginateIngredient.items;
            });

        setTimeout(() => this.filters.patchValue(this.filters.value), 0);
    }

    #buildVariables(values = this.filters.value): PaginateIngredientQueryVariables {
        const filter = {};
        if (values.search?.trim().length) {
            Object.assign(filter, { name: { contains: values.search } });
        }
        if (values.rarities?.length) {
            Object.assign(filter, { rarity: { in: values.rarities } });
        }

        return { filter, pager: null, order: null };
    }

    #hasAdminRole(): boolean {
        const accessToken = this.#authService.getAccessToken();

        if (!accessToken) {
            return false;
        }

        try {
            const payload = AuthUtils.getTokenPayload<{ role?: unknown }>(accessToken);
            return payload?.role === UserRole.Admin;
        } catch {
            return false;
        }
    }
}
