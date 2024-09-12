import { Component, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from '../../../core/auth/auth.service';
import { BriefDescriptionComponent } from '../brief-description/brief-description.component';

@Component({
    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        RouterLink,
        FuseAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        BriefDescriptionComponent,
    ],
})
export class AuthSignInComponent {
    readonly #formBuilder = inject(FormBuilder);
    readonly #activatedRoute = inject(ActivatedRoute);
    readonly #authService = inject(AuthService);
    readonly #router = inject(Router);

    @ViewChild('signInNgForm') signInNgForm!: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    readonly signInForm = this.#formBuilder.group({
        login: ['', [Validators.required, Validators.maxLength(50)]],
        password: ['', [Validators.required, Validators.minLength(8)]],
    });
    showAlert = false;

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign in
     */
    signIn(): void {
        // Return if the form is invalid
        if (this.signInForm.invalid) {
            return;
        }

        // Disable the form
        this.signInForm.disable();

        // Hide the alert
        this.showAlert = false;

        this.#authService.signIn(this.signInForm.value as any).subscribe({
            next: () => {
                // Set the redirect url.
                // The '/signed-in-redirect' is a test double url to catch the request and redirect the user
                // to the correct page after a successful sign in. This way, that url can be set via
                // a routing file, and we don't have to touch here.
                const redirectURL =
                    this.#activatedRoute.snapshot.queryParamMap.get('redirectURL') ||
                    '/signed-in-redirect';

                // Navigate to the redirect url
                void this.#router.navigateByUrl(redirectURL);
            },
            error: err => {
                // Re-enable the form
                this.signInForm.enable();

                // Reset the form
                this.signInNgForm.resetForm();

                // Set the alert
                this.alert = {
                    type: 'error',
                    message: err?.message ?? 'Wrong login or password',
                };

                // Show the alert
                this.showAlert = true;
            },
        });
    }
}
