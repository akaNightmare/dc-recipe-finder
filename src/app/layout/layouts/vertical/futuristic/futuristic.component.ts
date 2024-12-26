import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { FuseFullscreenComponent } from '@fuse/components/fullscreen';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import {
    FuseNavigationService,
    FuseVerticalNavigationComponent,
} from '@fuse/components/navigation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Subject, takeUntil } from 'rxjs';
import { NavigationService } from '../../../../core/navigation/navigation.service';
import { Navigation } from '../../../../core/navigation/navigation.types';
import { User, UserService } from '../../../../core/user/user.service';
import { UserComponent } from '../../../common/user/user.component';

@Component({
    selector: 'futuristic-layout',
    templateUrl: './futuristic.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [
        FuseLoadingBarComponent,
        FuseVerticalNavigationComponent,
        UserComponent,
        MatButtonModule,
        MatIconModule,
        FuseFullscreenComponent,
        RouterOutlet,
    ]
})
export class FuturisticLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall?: boolean;
    navigation?: Navigation;
    user?: User;

    readonly #unsubscribe = new Subject<void>();
    readonly #navigationService = inject(NavigationService);
    readonly #fuseMediaWatcherService = inject(FuseMediaWatcherService);
    readonly #fuseNavigationService = inject(FuseNavigationService);
    readonly #userService = inject(UserService);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for current year
     */
    get currentYear(): number {
        return new Date().getFullYear();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to navigation data
        this.#navigationService.navigation$
            .pipe(takeUntil(this.#unsubscribe))
            .subscribe((navigation: Navigation) => {
                this.navigation = navigation;
            });

        // Subscribe to the user service
        this.#userService
            .get()
            .pipe(takeUntil(this.#unsubscribe))
            .subscribe((user: User) => {
                this.user = user;
            });

        // Subscribe to media changes
        this.#fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this.#unsubscribe))
            .subscribe(({ matchingAliases }) => {
                // Check if the screen is small
                this.isScreenSmall = !matchingAliases.includes('md');
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this.#unsubscribe.next();
        this.#unsubscribe.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void {
        // Get the navigation
        const navigation =
            this.#fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(name);

        if (navigation) {
            // Toggle the opened status
            navigation.toggle();
        }
    }
}
