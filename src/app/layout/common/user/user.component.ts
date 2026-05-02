import { BooleanInput } from '@angular/cdk/coercion';
import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    inject,
    Input,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { AuthUtils } from '../../../core/auth/auth.utils';
import { User, UserService } from '../../../core/user/user.service';
import { CreateUserDialogComponent } from './create-user-dialog/create-user-dialog.component';
import { UserRole } from '../../../graphql.generated';

@Component({
    selector: 'user',
    templateUrl: './user.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'user',
    imports: [MatButtonModule, MatMenuModule, MatIconModule, NgClass, MatDividerModule],
})
export class UserComponent implements OnInit {
    readonly #destroyRef = inject(DestroyRef);
    /* eslint-disable @typescript-eslint/naming-convention */
    static ngAcceptInputType_showAvatar: BooleanInput;
    /* eslint-enable @typescript-eslint/naming-convention */

    @Input() showAvatar: boolean = true;
    user?: User;
    isAdmin = false;
    readonly #authService = inject(AuthService);
    readonly #changeDetectorRef = inject(ChangeDetectorRef);
    readonly #matDialog = inject(MatDialog);
    readonly #router = inject(Router);
    readonly #userService = inject(UserService);

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.isAdmin = this.#hasAdminRole();

        // Subscribe to user changes
        this.#userService
            .get()
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe((user: User) => {
                this.user = user;

                // Mark for check
                this.#changeDetectorRef.markForCheck();
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign out
     */
    signOut(): void {
        void this.#router.navigate(['/sign-out']);
    }

    /**
     * Create user
     */
    createUser(): void {
        this.#matDialog.open(CreateUserDialogComponent, {
            autoFocus: false,
        });
    }

    #hasAdminRole(): boolean {
        const accessToken = this.#authService.getAccessToken();

        if (!accessToken) {
            return false;
        }

        try {
            const payload = AuthUtils.getTokenPayload<{ role?: unknown }>(accessToken);
            return payload?.role === UserRole.Admin;
        } catch {
            return false;
        }
    }
}
