import { DOCUMENT } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { FuseConfig, FuseConfigService } from '@fuse/services/config';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FusePlatformService } from '@fuse/services/platform';
import { FUSE_VERSION } from '@fuse/version';
import { combineLatest, filter, map, Subject, takeUntil } from 'rxjs';
import { SettingsComponent } from './common/settings/settings.component';
import { EmptyLayoutComponent } from './layouts/empty/empty.component';
import { CenteredLayoutComponent } from './layouts/horizontal/centered/centered.component';
import { EnterpriseLayoutComponent } from './layouts/horizontal/enterprise/enterprise.component';
import { MaterialLayoutComponent } from './layouts/horizontal/material/material.component';
import { ModernLayoutComponent } from './layouts/horizontal/modern/modern.component';
import { ClassicLayoutComponent } from './layouts/vertical/classic/classic.component';
import { ClassyLayoutComponent } from './layouts/vertical/classy/classy.component';
import { CompactLayoutComponent } from './layouts/vertical/compact/compact.component';
import { DenseLayoutComponent } from './layouts/vertical/dense/dense.component';
import { FuturisticLayoutComponent } from './layouts/vertical/futuristic/futuristic.component';
import { ThinLayoutComponent } from './layouts/vertical/thin/thin.component';

@Component({
    selector: 'layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [
        EmptyLayoutComponent,
        CenteredLayoutComponent,
        EnterpriseLayoutComponent,
        MaterialLayoutComponent,
        ModernLayoutComponent,
        ClassicLayoutComponent,
        ClassyLayoutComponent,
        CompactLayoutComponent,
        DenseLayoutComponent,
        FuturisticLayoutComponent,
        ThinLayoutComponent,
        SettingsComponent,
    ]
})
export class LayoutComponent implements OnInit, OnDestroy {
    private readonly _document = inject<Document>(DOCUMENT);
    private readonly _fuseConfigService = inject(FuseConfigService);
    private readonly _fuseMediaWatcherService = inject(FuseMediaWatcherService);
    private readonly _fusePlatformService = inject(FusePlatformService);

    config?: FuseConfig;
    layout?: string;
    scheme?: 'dark' | 'light';
    theme?: string;
    readonly #unsubscribe = new Subject<void>();
    readonly #activatedRoute = inject(ActivatedRoute);
    readonly #renderer2 = inject(Renderer2);
    readonly #router = inject(Router);

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Set the theme and scheme based on the configuration
        combineLatest([
            this._fuseConfigService.config$,
            this._fuseMediaWatcherService.onMediaQueryChange$([
                '(prefers-color-scheme: dark)',
                '(prefers-color-scheme: light)',
            ]),
        ])
            .pipe(
                takeUntil(this.#unsubscribe),
                map(([config, mql]) => {
                    const options = {
                        scheme: config.scheme,
                        theme: config.theme,
                    };

                    // If the scheme is set to 'auto'...
                    if (config.scheme === 'auto') {
                        // Decide the scheme using the media query
                        options.scheme = mql.breakpoints['(prefers-color-scheme: dark)']
                            ? 'dark'
                            : 'light';
                    }

                    return options;
                }),
            )
            .subscribe((options) => {
                // Store the options
                this.scheme = options.scheme;
                this.theme = options.theme;

                // Update the scheme and theme
                this._updateScheme();
                this._updateTheme();
            });

        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntil(this.#unsubscribe))
            .subscribe((config: FuseConfig) => {
                // Store the config
                this.config = config;

                // Update the layout
                this._updateLayout();
            });

        // Subscribe to NavigationEnd event
        this.#router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntil(this.#unsubscribe),
            )
            .subscribe(() => {
                // Update the layout
                this._updateLayout();
            });

        // Set the app version
        this.#renderer2.setAttribute(
            this._document.querySelector('[ng-version]'),
            'fuse-version',
            FUSE_VERSION,
        );

        // Set the OS name
        this.#renderer2.addClass(this._document.body, this._fusePlatformService.osName);
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
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Update the selected layout
     */
    private _updateLayout(): void {
        // Get the current activated route
        let route = this.#activatedRoute;
        while (route.firstChild) {
            route = route.firstChild;
        }

        // 1. Set the layout from the config
        this.layout = this.config?.layout;

        // 2. Get the query parameter from the current route and
        // set the layout and save the layout to the config
        const layoutFromQueryParam = route.snapshot.queryParamMap.get('layout');
        if (layoutFromQueryParam) {
            this.layout = layoutFromQueryParam;
            if (this.config) {
                this.config.layout = layoutFromQueryParam;
            }
        }

        // 3. Iterate through the paths and change the layout as we find
        // a config for it.
        //
        // The reason we do this is that there might be empty grouping
        // paths or component less routes along the path. Because of that,
        // we cannot just assume that the layout configuration will be
        // in the last path's config or in the first path's config.
        //
        // So, we get all the paths that matched starting from root all
        // the way to the current activated route, walk through them one
        // by one and change the layout as we find the layout config. This
        // way, layout configuration can live anywhere within the path and
        // we won't miss it.
        //
        // Also, this will allow overriding the layout in any time so we
        // can have different layouts for different routes.
        const paths = route.pathFromRoot;
        paths.forEach((path) => {
            // Check if there is 'layout' data
            const layout = path.routeConfig?.data?.['layout'];
            if (layout) {
                // Set the layout
                this.layout = layout;
            }
        });
    }

    /**
     * Update the selected scheme
     *
     * @private
     */
    private _updateScheme(): void {
        // Remove class names for all schemes
        this._document.body.classList.remove('light', 'dark');

        // Add class name for the currently selected scheme
        if (this.scheme) {
            this._document.body.classList.add(this.scheme);
        }
    }

    /**
     * Update the selected theme
     *
     * @private
     */
    private _updateTheme(): void {
        // Find the class name for the previously selected theme and remove it
        this._document.body.classList.forEach((className: string) => {
            if (className.startsWith('theme-')) {
                this._document.body.classList.remove(className, className.split('-')[1]);
            }
        });

        // Add class name for the currently selected theme
        if (this.theme) {
            this._document.body.classList.add(this.theme);
        }
    }
}
