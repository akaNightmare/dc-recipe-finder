import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    standalone: true,
    imports: [MatTooltipModule, MatIconModule, MatButtonModule],
})
export class ConfirmDialogComponent {
    private readonly dialogRef = inject(MatDialogRef<ConfirmDialogModel>);
    public readonly data: ConfirmDialogModel = inject(MAT_DIALOG_DATA);

    public onConfirm(): void {
        this.dialogRef.close(true);
    }

    public onDismiss(): void {
        this.dialogRef.close(false);
    }
}

export class ConfirmDialogModel {
    constructor(
        public readonly title: string,
        public readonly message: string,
    ) {}
}
