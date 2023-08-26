import { CdkScrollable } from '@angular/cdk/overlay';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';

import { RecipesFacade } from '../../../../store/recipes';
import { DownloadService } from '../../../core/download/download.service';

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

    public exportHistory(): void {
        console.log('exportHistory');
        forkJoin([this.recipesFacade.recipes$]).subscribe(([recipes]) => {
            console.log(recipes);
            this.downloadService.downloadJSON({ recipes }, `history-${Date.now()}.json`);
        });
    }
}
