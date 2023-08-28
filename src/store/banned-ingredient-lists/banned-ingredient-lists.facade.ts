import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { bannedIngredientLists } from '../../data';
import { addBannedIngredientList, addBannedIngredientLists } from './banned-ingredient-lists.actions';
import { selectBannedIngredientLists } from './banned-ingredient-lists.selectors';
import { BannedIngredientList } from './banned-ingredient-lists.types';

@Injectable({ providedIn: 'root' })
export class BannedIngredientListsFacade {
    private readonly store = inject(Store);

    readonly bannedIngredientList$ = this.store.select<BannedIngredientList[]>(selectBannedIngredientLists);

    constructor() {
        this.addBannedIngredientLists(bannedIngredientLists);
    }

    addBannedIngredientList(banned_ingredient_list: BannedIngredientList): void {
        this.store.dispatch(addBannedIngredientList({ banned_ingredient_list }));
    }

    addBannedIngredientLists(banned_ingredient_lists: BannedIngredientList[]): void {
        this.store.dispatch(addBannedIngredientLists({ banned_ingredient_lists }));
    }
}
