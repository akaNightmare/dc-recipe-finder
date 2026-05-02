import { Component, DestroyRef, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { FuseFullscreenComponent } from '@fuse/components/fullscreen';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import {
    FuseHorizontalNavigationComponent,
    FuseNavigationService,
    FuseVerticalNavigationComponent,
} from '@fuse/components/navigation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';

import { NavigationService } from '../../../../core/navigation/navigation.service';
import { Navigation } from '../../../../core/navigation/navigation.types';
import { UserComponent } from '../../../common/user/user.component';

@Component({
    selector: 'enterprise-layout',
    templateUrl: './enterprise.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [
        FuseLoadingBarComponent,
        FuseVerticalNavigationComponent,
        MatButtonModule,
        MatIconModule,
        FuseFullscreenComponent,
        UserComponent,
        FuseHorizontalNavigationComponent,
        RouterOutlet,
    ],
})
export class EnterpriseLayoutComponent implements OnInit {
    readonly #destroyRef = inject(DestroyRef);
    isScreenSmall?: boolean;
    navigation?: Navigation;
    readonly #navigationService = inject(NavigationService);
    readonly #fuseMediaWatcherService = inject(FuseMediaWatcherService);
    readonly #fuseNavigationService = inject(FuseNavigationService);

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
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe((navigation: Navigation) => {
                this.navigation = navigation;
            });

        // Subscribe to media changes
        this.#fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(({ matchingAliases }) => {
                // Check if the screen is small
                this.isScreenSmall = !matchingAliases.includes('md');
            });
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
