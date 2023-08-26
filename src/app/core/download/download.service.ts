import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class DownloadService {
    private readonly document = Inject(DOCUMENT);

    private downloadFile(data: string, filename: string, type: string): void {
        let element = this.document.createElement('a');
        element.setAttribute('href', `data:${type};charset=utf-8,${encodeURIComponent(data)}`);
        element.setAttribute('download', filename);

        element.style.display = 'none';
        this.document.body.appendChild(element);
        element.click();
        this.document.body.removeChild(element);
    }

    public downloadJSON(data: Record<string, unknown>, filename: string): void {
        this.downloadFile(JSON.stringify(data), filename, 'application/json');
    }
}
