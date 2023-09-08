import { AsyncPipe, I18nPluralPipe, NgIf } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { finalize, map, Subject, takeUntil, takeWhile, tap, timer } from 'rxjs';

import { UserService } from '../../../core/user/user.service';

@Component({
    selector: 'auth-sign-out',
    templateUrl: './sign-out.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [NgIf, RouterLink, I18nPluralPipe, AsyncPipe],
})
export class AuthSignOutComponent implements OnInit, OnDestroy {
    private readonly unsubscribe$ = new Subject<void>();
    private readonly authService = inject(AuthService);
    private readonly userService = inject(UserService);
    private readonly router = inject(Router);

    public countdown = 5;
    public countdownMapping = {
        '=1': '# second',
        other: '# seconds',
    };

    public readonly isSignedOut$ = this.userService.user$.pipe(map(user => !user));

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Sign out
        this.authService.signOut();

        // Redirect after the countdown
        timer(1000, 1000)
            .pipe(
                finalize(() => {
                    void this.router.navigate(['sign-in']);
                }),
                takeWhile(() => this.countdown > 0),
                takeUntil(this.unsubscribe$),
                tap(() => this.countdown--),
            )
            .subscribe();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
