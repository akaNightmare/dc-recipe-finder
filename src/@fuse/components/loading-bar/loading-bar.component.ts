import { coerceBooleanProperty } from '@angular/cdk/coercion';

import {
    Component,
    DestroyRef,
    inject,
    Input,
    OnChanges,
    OnInit,
    SimpleChanges,
    ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FuseLoadingService } from '@fuse/services/loading';

@Component({
    selector: 'fuse-loading-bar',
    templateUrl: './loading-bar.component.html',
    styleUrls: ['./loading-bar.component.scss'],
    encapsulation: ViewEncapsulation.None,
    exportAs: 'fuseLoadingBar',
    imports: [MatProgressBarModule],
})
export class FuseLoadingBarComponent implements OnChanges, OnInit {
    readonly #destroyRef = inject(DestroyRef);
    private _fuseLoadingService = inject(FuseLoadingService);

    @Input() autoMode: boolean = true;
    mode: 'determinate' | 'indeterminate' | null = null;
    progress = 0;
    show: boolean = false;

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On changes
     *
     * @param changes
     */
    ngOnChanges(changes: SimpleChanges): void {
        // Auto mode
        if ('autoMode' in changes) {
            // Set the auto mode in the service
            this._fuseLoadingService.setAutoMode(
                coerceBooleanProperty(changes['autoMode'].currentValue),
            );
        }
    }

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to the service
        this._fuseLoadingService.mode$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(value => {
                this.mode = value;
            });

        this._fuseLoadingService.progress$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(value => {
                this.progress = value!;
            });

        this._fuseLoadingService.show$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(value => {
                this.show = value;
            });
    }
}
