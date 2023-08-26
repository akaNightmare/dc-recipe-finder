import { Pipe, PipeTransform } from '@angular/core';
import orderBy from 'lodash-es/orderBy';

@Pipe({ name: 'sortBy', standalone: true })
export class SortByPipe implements PipeTransform {
    transform<T = unknown>(value: T[], order: 'asc' | 'desc' | '' = '', column = ''): T[] {
        if (!value || order === '' || !order) {
            return value;
        }
        if (value.length <= 1) {
            return value;
        }
        if (!column || column === '') {
            if (order === 'asc') {
                return value.sort();
            } else {
                return value.sort().reverse();
            }
        }
        return orderBy(value, [column], [order]);
    }
}
