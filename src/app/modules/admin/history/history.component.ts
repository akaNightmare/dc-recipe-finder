import { CdkScrollable } from '@angular/cdk/overlay';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, map, take } from 'rxjs';

import { BannedIngredientListsFacade } from '../../../../store/banned-ingredient-lists';
import { RecipesFacade } from '../../../../store/recipes';
import { RecipeStatus } from '../../../../store/recipes/recipes.types';
import { DownloadService } from '../../../core/download/download.service';
import { History } from './history.types';

@Component({
    selector: 'history',
    standalone: true,
    templateUrl: './history.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [
        NgForOf,
        AsyncPipe,
        NgIf,
        MatTableModule,
        MatSnackBarModule,
        MatSortModule,
        CdkScrollable,
        MatTooltipModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        ReactiveFormsModule,
        MatMenuModule,
        NgClass,
    ],
})
export class HistoryComponent {
    private readonly downloadService = inject(DownloadService);
    private readonly recipesFacade = inject(RecipesFacade);
    private readonly bilFacade = inject(BannedIngredientListsFacade);
    private readonly snackBar = inject(MatSnackBar);
    private readonly defaultSnackBarConfig: MatSnackBarConfig = {
        duration: 3500,
        horizontalPosition: 'right',
        verticalPosition: 'top',
    };

    public readonly RecipeStatus = RecipeStatus;

    public readonly recipesStats$ = this.recipesFacade.recipes$.pipe(
        map(recipes => {
            const statsObj = Object.keys(RecipeStatus).reduce((acc, status) => ({ ...acc, [status]: 0 }), {});

            for (const recipe of recipes) {
                statsObj[recipe.status]++;
            }
            const stats = [];
            for (const [status, count] of Object.entries(statsObj)) {
                stats.push({ status, count });
            }
            return stats;
        }),
    );

    public exportHistory(): void {
        forkJoin([
            this.recipesFacade.customRecipes$.pipe(take(1)),
            this.bilFacade.customBannedIngredientList$.pipe(take(1)),
        ]).subscribe(([recipes, banned_ingredient_lists]) => {
            this.downloadService.downloadJSON({ recipes, banned_ingredient_lists }, `history-${Date.now()}.json`);
        });
    }

    public importHistory(files: FileList): void {
        const file = files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');

        const snackBar = this.snackBar;
        const defaultSnackBarConfig = this.defaultSnackBarConfig;
        const recipesFacade = this.recipesFacade;
        const bilFacade = this.bilFacade;

        reader.onload = function (event) {
            let history: History;
            try {
                history = JSON.parse(event.target.result as string);
            } catch (err) {
                snackBar.open('Cannot parse history file', undefined, defaultSnackBarConfig);
                return;
            }
            recipesFacade.addRecipes(history.recipes);
            bilFacade.addBannedIngredientLists(history.banned_ingredient_lists);
            snackBar.open(
                'Imported ' +
                    [
                        `recipes: ${history.recipes.length}`,
                        `banned ingredient lists: ${history.banned_ingredient_lists.length}`,
                    ].join(', '),
                undefined,
                defaultSnackBarConfig,
            );
        };
        reader.onerror = function (event) {
            snackBar.open('Cannot read history file', undefined, defaultSnackBarConfig);
        };
    }
}
