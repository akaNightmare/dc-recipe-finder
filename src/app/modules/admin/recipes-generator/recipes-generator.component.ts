import { CdkScrollable } from '@angular/cdk/overlay';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'ingredients',
    standalone: true,
    templateUrl: './recipes-generator.component.html',
    styleUrls: ['./recipes-generator.component.scss'],
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
    ],
})
export class RecipesGeneratorComponent {
}
