import { CdkScrollable } from '@angular/cdk/overlay';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule, SortDirection } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { RecipesGeneratorDialogComponent } from './recipes-generator-dialog/recipes-generator-dialog.component';

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
    private readonly matDialog = inject(MatDialog);

    public readonly displayedColumns = ['name', 'actions'];
    public readonly pageSizeOptions = [5, 10, 25, 100];

    public readonly filters = new FormGroup({
        search: new FormControl(),
        page: new FormControl(1),
        limit: new FormControl(this.pageSizeOptions[3]),
        sort_dir: new FormControl<SortDirection>('asc'),
        sort_by: new FormControl('name'),
    });

    public openRecipesGeneratorDialog(): void {
        this.matDialog
            .open(RecipesGeneratorDialogComponent, {
                disableClose: true,
                maxHeight: '90vh',
                data: {},
            })
            .afterClosed()
            .subscribe(result => {
                if (result) {
                    // this._snackBar.open(
                    //     `Ingredient has been ${organization ? 'updated' : 'created'}`,
                    //     undefined,
                    //     this._defaultSnackBarConfig,
                    // );
                }
            });
    }
}
