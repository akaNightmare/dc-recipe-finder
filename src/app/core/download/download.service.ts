import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class DownloadService {
    private readonly document = inject(DOCUMENT);

    private downloadFile(data: string, filename: string, type: string) {
        const blobUrl = URL.createObjectURL(new Blob([data], { type }));

        // Create a link element
        const link = this.document.createElement('a');

        // Set link's href to point to the Blob URL
        link.setAttribute('href', blobUrl);
        link.setAttribute('download', filename);

        // Append link to the body
        this.document.body.appendChild(link);

        // Dispatch click event on the link
        // This is necessary as link.click() does not work on the latest firefox
        link.dispatchEvent(
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
            }),
        );

        setTimeout(() => {
            // For Firefox, it is necessary to delay revoking the ObjectURL
            URL.revokeObjectURL(blobUrl);
            this.document.body.removeChild(link);
        }, 100);
    }

    public downloadJSON(data: Record<string, unknown>, filename: string): void {
        this.downloadFile(JSON.stringify(data), filename, 'application/json');
    }
}
