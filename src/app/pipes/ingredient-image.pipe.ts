import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'ingredientImage',
    standalone: true,
})
export class IngredientImagePipe implements PipeTransform {
    transform(image: string | null | undefined): string {
        if (!image) {
            return '';
        }

        if (/^https?:\/\//i.test(image)) {
            return image;
        }

        return `images/ingredients/${image}`;
    }
}
