import { AsyncPipe, KeyValuePipe, NgOptimizedImage } from '@angular/common';
import {
    AfterViewInit,
    Component,
    EventEmitter,
    inject,
    Input,
    OnDestroy,
    Output,
    ViewEncapsulation,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { QueryRef } from 'apollo-angular';
import xor from 'lodash-es/xor';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { debounceTime, distinctUntilChanged, filter, Subject, takeUntil, tap } from 'rxjs';

import { fuseAnimations } from '@fuse/animations';
import { Ingredient, IngredientPaginateOrderField, OrderDir } from '../../graphql.generated';
import {
    PaginateIngredientGQL,
    PaginateIngredientQuery,
    PaginateIngredientQueryVariables,
} from '../../modules/admin/ingredients/ingredients.generated';

@Component({
    selector: 'app-ingredient-search',
    templateUrl: './ingredient-search.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    imports: [
        MatOptionModule,
        NgxMatSelectSearchModule,
        ReactiveFormsModule,
        AsyncPipe,
        MatFormFieldModule,
        MatSelectModule,
        NgOptimizedImage,
        MatTooltipModule,
        KeyValuePipe,
    ]
})
export class IngredientSearchComponent implements OnDestroy, AfterViewInit {
    readonly #unsubscribe$ = new Subject<void>();
    readonly #paginateIngredientGQL = inject(PaginateIngredientGQL);
    #ingredientRef!: QueryRef<PaginateIngredientQuery, PaginateIngredientQueryVariables>;
    #ingredientsIds: string[] = [];

    @Output() ingredientsIdsChange = new EventEmitter<string[]>();
    @Output() ingredientsChange = new EventEmitter<Ingredient[]>();
    @Input() set ingredientsIds(ingredientsIds: string[]) {
        if (xor(this.#ingredientsIds, ingredientsIds).length > 0) {
            this.#ingredientsIds = ingredientsIds;

            if (this.#ingredientRef) {
                this.searchIngredientsCtrl.patchValue('', { emitEvent: false, onlySelf: true });
                this.ingredientsCtrl.patchValue([], { emitEvent: false, onlySelf: true });

                void this.#ingredientRef.refetch(this.#buildVariables(ingredientsIds));
            }
        }
    }
    @Input() multiple = true;
    @Input() required = false;
    @Input() maxIngredients: number | null = null;
    @Input() label?: string;
    @Input() errorMessages: Record<string, string> = {};
    @Input() set errors(errors: ValidationErrors | null) {
        const errorKeys = Object.keys(errors ?? {});
        if (errorKeys.length === 0) {
            this.ingredientsCtrl.setErrors(null);
        } else {
            const err = errorKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {});
            this.ingredientsCtrl.setErrors(err);
        }
    }
    @Input() controlClass = 'fuse-mat-rounded fuse-mat-dense fuse-mat-no-subscript w-72 sm:ml-4';

    public searching = false;
    public ingredients: Ingredient[] = [];
    public selectedIngredients: Ingredient[] = [];
    public readonly ingredientsCtrl = new FormControl<string[]>([]);
    public readonly searchIngredientsCtrl = new FormControl('');

    ngOnDestroy() {
        this.#unsubscribe$.next();
        this.#unsubscribe$.complete();
    }

    ngAfterViewInit() {
        this.#ingredientRef = this.#paginateIngredientGQL.watch(
            this.#buildVariables(this.#ingredientsIds),
        );

        this.#ingredientRef.valueChanges
            .pipe(
                takeUntil(this.#unsubscribe$),
                filter(({ data }) => Array.isArray(data?.paginateIngredient?.items)),
            )
            .subscribe(({ data }) => {
                const ingredientIds = this.ingredientsCtrl.value || [];
                const ingredientNotEqual = xor(this.#ingredientsIds, ingredientIds).length > 0;
                if (ingredientNotEqual) {
                    this.ingredients = data.paginateIngredient.items ?? [];
                } else {
                    this.ingredients = [
                        ...this.ingredients.filter(i => ingredientIds.includes(i.id)),
                        ...(data.paginateIngredient.items ?? []).filter(
                            i => !ingredientIds.includes(i.id),
                        ),
                    ];
                }

                if (ingredientNotEqual) {
                    this.ingredientsCtrl.patchValue(this.#ingredientsIds);
                }
            });

        this.searchIngredientsCtrl.valueChanges
            .pipe(
                takeUntil(this.#unsubscribe$),
                filter(search => !!search?.trim().length),
                tap(() => (this.searching = true)),
                debounceTime(200),
            )
            .subscribe({
                next: () => {
                    this.searching = false;
                    void this.#ingredientRef.refetch(this.#buildVariables());
                },
                error: () => (this.searching = false),
            });

        this.ingredientsCtrl.valueChanges
            .pipe(takeUntil(this.#unsubscribe$), distinctUntilChanged())
            .subscribe((ingredientIds = []) => {
                this.selectedIngredients = this.ingredients.filter(i =>
                    ingredientIds?.includes(i.id),
                );
                this.#ingredientsIds = ingredientIds ?? [];
                this.ingredientsIdsChange.emit(ingredientIds ?? []);
                this.ingredientsChange.emit(this.selectedIngredients);
            });
    }

    isOptionDisabled(ingredientId: string): boolean {
        if (this.maxIngredients === null) {
            return false;
        }
        const ingredientIds = this.ingredientsCtrl.value;
        if (!ingredientIds) {
            return false;
        }
        return ingredientIds.length >= this.maxIngredients && !ingredientIds.includes(ingredientId);
    }

    #buildVariables(includeIngredientIds?: string[]): PaginateIngredientQueryVariables {
        const filter = {};
        const search = this.searchIngredientsCtrl.value?.trim();
        if (search?.trim().length) {
            Object.assign(filter, { name: { contains: search } });
        }
        if (includeIngredientIds?.length) {
            Object.assign(filter, { id: { in: includeIngredientIds } });
        } else {
            const ingredientIds = this.ingredientsCtrl.value ?? [];
            if (ingredientIds.length > 0) {
                Object.assign(filter, { id: { nin: ingredientIds } });
            }
        }

        return {
            filter,
            order: [{ field: IngredientPaginateOrderField.Name, dir: OrderDir.Asc }],
            pager: {
                page: 1,
                limit: Math.max(20, includeIngredientIds?.length ?? 0),
            },
        };
    }
}
