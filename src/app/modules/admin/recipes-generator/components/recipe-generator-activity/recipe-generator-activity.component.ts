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
    templateUrl: './recipe-generator-activity.component.html',
    styleUrls: ['./recipe-generator-activity.component.scss'],
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
    ]
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

    iconByLog(log: Record<string, unknown>): string | undefined {
        switch (log['action']) {
            case 'created':
                return 'heroicons_outline:calculator';
            case 'deleted-recipe':
                return 'heroicons_outline:trash';
            case 'assigned': {
                if (log['assigned_to'] && log['unassigned_from']) {
                    return 'heroicons_outline:users';
                } else if (!log['assigned_to']) {
                    return 'heroicons_outline:user-minus';
                } else if (log['assigned_to']) {
                    return 'heroicons_outline:user-plus';
                }
                return undefined;
            }
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
