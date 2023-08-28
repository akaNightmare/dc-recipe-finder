import { inject, Injectable } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Store } from '@ngrx/store';
import { map, Observable } from 'rxjs';

import { bannedIngredientLists } from '../../data';
import {
    addBannedIngredientList,
    addBannedIngredientLists,
    deleteBannedIngredientList,
} from './banned-ingredient-lists.actions';
import { selectBannedIngredientLists, selectCustomBannedIngredientLists } from './banned-ingredient-lists.selectors';
import { BannedIngredientList } from './banned-ingredient-lists.types';

@Injectable({ providedIn: 'root' })
export class BannedIngredientListsFacade {
    private readonly store = inject(Store);

    readonly bannedIngredientList$ = this.store.select<BannedIngredientList[]>(selectBannedIngredientLists);
    readonly customBannedIngredientList$ = this.store.select<BannedIngredientList[]>(selectCustomBannedIngredientLists);

    constructor() {
        this.addBannedIngredientLists(bannedIngredientLists);
    }

    addBannedIngredientList(banned_ingredient_list: BannedIngredientList): void {
        this.store.dispatch(addBannedIngredientList({ banned_ingredient_list }));
    }

    addBannedIngredientLists(banned_ingredient_lists: BannedIngredientList[]): void {
        this.store.dispatch(addBannedIngredientLists({ banned_ingredient_lists }));
    }

    removeBannedIngredientList(banned_ingredient_list: BannedIngredientList): void {
        this.store.dispatch(deleteBannedIngredientList({ banned_ingredient_list }));
    }

    createNameValidator(): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors> =>
            this.bannedIngredientList$.pipe(
                map((lists: BannedIngredientList[]) =>
                    lists.some(({ name }) => name.toLowerCase() === control.value?.trim().toLowerCase())
                        ? { nameAlreadyExists: true }
                        : null,
                ),
            );
    }
}
