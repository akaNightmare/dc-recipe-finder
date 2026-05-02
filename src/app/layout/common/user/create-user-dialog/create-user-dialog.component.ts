import { Component, inject, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { CreateUserGQL } from '../../../../core/auth/auth.generated';

@Component({
    selector: 'create-user-dialog',
    templateUrl: './create-user-dialog.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        ReactiveFormsModule,
    ],
})
export class CreateUserDialogComponent {
    readonly #createUserGQL = inject(CreateUserGQL);
    readonly #dialogRef = inject(MatDialogRef<CreateUserDialogComponent>);
    readonly #snackBar = inject(MatSnackBar);
    readonly #defaultSnackBarConfig: MatSnackBarConfig = {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
    };

    public readonly form = new FormGroup(
        {
            login: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            password: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(8)],
            }),
            repeatPassword: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required, RxwebValidators.compare({ fieldName: 'password' })],
            }),
        },
    );

    close(): void {
        this.#dialogRef.close();
    }

    save(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const { login, password } = this.form.getRawValue();

        this.form.disable();

        this.#createUserGQL
            .mutate({
                variables: {
                    auth: {
                        login,
                        password,
                    },
                },
            })
            .subscribe({
                next: ({ data }) => {
                    this.#snackBar.open(
                        `User ${data?.createUser.login ?? login} created`,
                        'Close',
                        this.#defaultSnackBarConfig,
                    );
                    this.#dialogRef.close(data?.createUser);
                },
                error: () => {
                    this.form.enable();
                    this.#snackBar.open(
                        'Could not create user',
                        'Close',
                        this.#defaultSnackBarConfig,
                    );
                },
            });
    }
}
