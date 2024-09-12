import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FuseConfirmationConfig } from '@fuse/services/confirmation/confirmation.types';
import { FuseConfirmationDialogComponent } from '@fuse/services/confirmation/dialog/dialog.component';
import merge from 'lodash-es/merge';

type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

@Injectable({ providedIn: 'root' })
export class FuseConfirmationService {
    readonly #matDialog = inject(MatDialog);
    readonly #defaultConfig: FuseConfirmationConfig = {
        title: 'Confirm action',
        message: 'Are you sure you want to confirm this action?',
        icon: {
            show: true,
            name: 'heroicons_outline:exclamation-triangle',
            color: 'warn',
        },
        actions: {
            confirm: {
                show: true,
                label: 'Confirm',
                color: 'warn',
            },
            cancel: {
                show: true,
                label: 'Cancel',
            },
        },
        dismissible: false,
    };

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    open(
        config: DeepPartial<FuseConfirmationConfig> = {},
    ): MatDialogRef<FuseConfirmationDialogComponent> {
        // Merge the user config with the default config
        const userConfig = merge({}, this.#defaultConfig, config);

        // Open the dialog
        return this.#matDialog.open(FuseConfirmationDialogComponent, {
            autoFocus: false,
            disableClose: !userConfig.dismissible,
            data: userConfig,
            panelClass: 'fuse-confirmation-dialog-panel',
        });
    }
}
