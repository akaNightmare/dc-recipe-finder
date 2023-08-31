import { inject, Injectable } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Store } from '@ngrx/store';
import { map, Observable } from 'rxjs';

import { ingredientLists } from '../../data';
import {
    addIngredientList,
    addIngredientLists,
    deleteIngredientList,
    updateIngredientList,
} from './ingredient-lists.actions';
import { selectCustomIngredientLists, selectIngredientLists } from './ingredient-lists.selectors';
import { selectId } from './ingredient-lists.state';
import { IngredientList } from './ingredient-lists.types';

@Injectable({ providedIn: 'root' })
export class IngredientListsFacade {
    private readonly store = inject(Store);

    readonly ingredientList$ = this.store.select<IngredientList[]>(selectIngredientLists);
    readonly customIngredientList$ = this.store.select<IngredientList[]>(selectCustomIngredientLists);

    constructor() {
        this.addIngredientLists(ingredientLists);
    }

    addIngredientList(ingredient_list: IngredientList): void {
        this.store.dispatch(addIngredientList({ ingredient_list }));
    }

    updateIngredientList(base: IngredientList, changes: Partial<IngredientList>): void {
        this.store.dispatch(updateIngredientList({ id: selectId(base), ingredient_list: changes }));
    }

    addIngredientLists(ingredient_lists: IngredientList[]): void {
        this.store.dispatch(addIngredientLists({ ingredient_lists }));
    }

    removeIngredientList(ingredient_list: IngredientList): void {
        this.store.dispatch(deleteIngredientList({ ingredient_list }));
    }

    createNameValidator(): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors> =>
            this.ingredientList$.pipe(
                map((lists: IngredientList[]) =>
                    lists.some(({ name }) => name.toLowerCase() === control.value?.trim().toLowerCase())
                        ? { nameAlreadyExists: true }
                        : null,
                ),
            );
    }
}
