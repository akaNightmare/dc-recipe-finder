import {
    AsyncPipe,
    DatePipe,
    NgClass,
    NgOptimizedImage,
    NgTemplateOutlet,
    TitleCasePipe,
} from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { DateTime } from 'luxon';
import { filter, map } from 'rxjs';
import { IngredientRarity, RecipeStatus } from '../../../../../graphql.generated';
import { SortByPipe } from '../../../../../pipes';
import { RecipeListActivityGQL } from '../../recipes-list.generated';

@Component({
    selector: 'recipe-generator-activity',
    standalone: true,
    templateUrl: './recipe-generator-activity.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [
        AsyncPipe,
        TitleCasePipe,
        MatIcon,
        DatePipe,
        NgOptimizedImage,
        MatTooltip,
        NgTemplateOutlet,
        SortByPipe,
        NgClass,
    ],
})
export class RecipeGeneratorActivityComponent {
    readonly #recipeListActivityGQL = inject(RecipeListActivityGQL);
    readonly #activatedRoute = inject(ActivatedRoute);

    public readonly RecipeStatus = RecipeStatus;
    public readonly IngredientRarity = IngredientRarity;
    public readonly recipeListActivities$ = this.#recipeListActivityGQL
        .watch({
            recipeListId: this.#activatedRoute.snapshot.params['recipeListId'],
        })
        .valueChanges.pipe(
            filter(({ data }) => Array.isArray(data?.recipeListActivity)),
            map(({ data }) => data.recipeListActivity),
        );

    iconByAction(action: string): string | undefined {
        switch (action) {
            case 'created':
                return 'heroicons_outline:calculator';
            case 'assigned':
                return 'heroicons_outline:user-plus';
            case 'unassigned':
                return 'heroicons_outline:user-minus';
            case 'reassigned':
                return 'heroicons_outline:users';
            case 'marked':
                return 'heroicons_outline:beaker';
            default:
                return undefined;
        }
    }

    isSameDay(current: string, compare: string): boolean {
        return DateTime.fromISO(current).hasSame(DateTime.fromISO(compare), 'day');
    }

    getRelativeFormat(date: string): string {
        return DateTime.fromISO(date).toRelativeCalendar() as string;
    }
}
