import { I18nPluralPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize, takeWhile, tap, timer } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
    selector: 'auth-sign-out',
    templateUrl: './sign-out.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [RouterLink, I18nPluralPipe],
})
export class AuthSignOutComponent implements OnInit {
    readonly #destroyRef = inject(DestroyRef);
    countdown = 5;
    countdownMapping: Record<string, string> = {
        '=1': '# second',
        other: '# seconds',
    };
    readonly #router = inject(Router);
    readonly #authService = inject(AuthService);

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Sign out
        this.#authService.signOut();

        // Redirect after the countdown
        timer(1000, 1000)
            .pipe(
                finalize(() => {
                    void this.#router.navigate(['sign-in']);
                }),
                takeWhile(() => this.countdown > 0),
                takeUntilDestroyed(this.#destroyRef),
                tap(() => this.countdown--),
            )
            .subscribe();
    }
}
