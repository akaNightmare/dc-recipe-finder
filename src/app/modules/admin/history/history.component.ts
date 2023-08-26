import { Component, ViewEncapsulation } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { CdkScrollable } from '@angular/cdk/overlay';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';

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
}
