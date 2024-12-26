import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'replace' })
export class ReplacePipe implements PipeTransform {
    transform(value: string, strToReplace: string, replacementStr: string): string {
        if (!value || !strToReplace || typeof replacementStr !== 'string') {
            return value;
        }
        return value.replaceAll(strToReplace, replacementStr);
    }
}
