import { inject, Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class IconsService {
    private readonly domSanitizer = inject(DomSanitizer);
    private readonly  matIconRegistry = inject(MatIconRegistry);

    init() {
        // Register icon sets
        this.matIconRegistry.addSvgIconSet(this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/material-twotone.svg'));
        this.matIconRegistry.addSvgIconSetInNamespace(
            'mat_outline',
            this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/material-outline.svg'),
        );
        this.matIconRegistry.addSvgIconSetInNamespace(
            'mat_solid',
            this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/material-solid.svg'),
        );
        this.matIconRegistry.addSvgIconSetInNamespace(
            'feather',
            this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/feather.svg'),
        );
        this.matIconRegistry.addSvgIconSetInNamespace(
            'heroicons_outline',
            this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/heroicons-outline.svg'),
        );
        this.matIconRegistry.addSvgIconSetInNamespace(
            'heroicons_solid',
            this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/heroicons-solid.svg'),
        );
        this.matIconRegistry.addSvgIconSetInNamespace(
            'heroicons_mini',
            this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/heroicons-mini.svg'),
        );
    }
}
