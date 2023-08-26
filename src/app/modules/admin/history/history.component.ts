import { CdkScrollable } from '@angular/cdk/overlay';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
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
import { forkJoin, take } from 'rxjs';

import { RecipesFacade } from '../../../../store/recipes';
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
    ],
})
export class HistoryComponent {
    private readonly downloadService = inject(DownloadService);
    private readonly recipesFacade = inject(RecipesFacade);
    private readonly snackBar = inject(MatSnackBar);
    private readonly defaultSnackBarConfig: MatSnackBarConfig = {
        duration: 3500,
        horizontalPosition: 'right',
        verticalPosition: 'top',
    };

    public exportHistory(): void {
        forkJoin([this.recipesFacade.customRecipes$.pipe(take(1))]).subscribe(([recipes]) => {
            this.downloadService.downloadJSON({ recipes }, `history-${Date.now()}.json`);
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

        reader.onload = function (event) {
            let history: History;
            try {
                history = JSON.parse(event.target.result as string);
            } catch (err) {
                snackBar.open('Cannot parse history file', undefined, defaultSnackBarConfig);
                return;
            }
            recipesFacade.addRecipes(history.recipes);
            snackBar.open(
                'Imported ' + [`receipts: ${history.recipes.length}`].join(', '),
                undefined,
                defaultSnackBarConfig,
            );
        };
        reader.onerror = function (event) {
            snackBar.open('Cannot read history file', undefined, defaultSnackBarConfig);
        };
    }
}
