import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RxReactiveFormsModule } from '@rxweb/reactive-form-validators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { ReplacePipe } from '../../../../pipes/replace.pipe';

@Component({
    selector: 'banned-ingredient-lists-dialog',
    templateUrl: './banned-ingredient-lists-dialog.component.html',
    styleUrls: ['./banned-ingredient-lists-dialog.component.scss'],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    imports: [
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        AsyncPipe,
        FormsModule,
        MatInputModule,
        ReactiveFormsModule,
        RxReactiveFormsModule,
        MatProgressSpinnerModule,
        MatRippleModule,
        MatSelectModule,
        NgxMatSelectSearchModule,
        NgIf,
        NgForOf,
        NgClass,
        ReplacePipe,
        MatDialogModule,
    ],
})
export class RecipesGeneratorDialogComponent implements OnInit {
    private readonly matDialogRef = inject(MatDialogRef<RecipesGeneratorDialogComponent>);
    private readonly formBuilder = inject(FormBuilder);

    ngOnInit(): void {}

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: { name?: string }): string | number {
        return item.name || index;
    }

    /**
     * Close the dialog
     */
    close(): void {
        this.matDialogRef.close();
    }

    save(): void {}
}
