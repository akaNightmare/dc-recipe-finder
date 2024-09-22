import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { map, Observable } from 'rxjs';
import { RecipeListGQL } from './recipes-list.generated';

@Injectable({
    providedIn: 'root',
})
export class RecipeListResolver implements Resolve<any> {
    readonly #recipeListGQL = inject(RecipeListGQL);

    resolve(route: ActivatedRouteSnapshot): Observable<any> {
        return this.#recipeListGQL
            .fetch({
                id: route.paramMap.get('recipeListId')!,
            })
            .pipe(map(response => response.data.recipeList));
    }
}
