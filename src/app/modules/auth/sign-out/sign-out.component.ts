import { I18nPluralPipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize, Subject, takeUntil, takeWhile, tap, timer } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
    selector: 'auth-sign-out',
    templateUrl: './sign-out.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [RouterLink, I18nPluralPipe],
})
export class AuthSignOutComponent implements OnInit, OnDestroy {
    countdown = 5;
    countdownMapping: Record<string, string> = {
        '=1': '# second',
        other: '# seconds',
    };
    readonly #unsubscribe = new Subject<void>();
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
                takeUntil(this.#unsubscribe),
                tap(() => this.countdown--),
            )
            .subscribe();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        this.#unsubscribe.next();
        this.#unsubscribe.complete();
    }
}
