import { AfterContentInit, Component, inject, ViewEncapsulation } from '@angular/core';
import {
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RxReactiveFormsModule } from '@rxweb/reactive-form-validators';

import { Ingredient, IngredientUpdateInput } from '../../../../graphql.generated';
import { UpdateIngredientGQL } from '../ingredients.generated';

@Component({
    selector: 'ingredient-dialog',
    templateUrl: './ingredient-dialog.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        FormsModule,
        MatInputModule,
        ReactiveFormsModule,
        RxReactiveFormsModule,
        MatProgressSpinnerModule,
        MatRippleModule,
        MatSelectModule,
        MatDialogModule,
    ]
})
export class IngredientDialogComponent implements AfterContentInit {
    public readonly data: { ingredient: Ingredient } = inject(MAT_DIALOG_DATA);
    public readonly form = new FormGroup({
        name: new FormControl('', [Validators.required]),
        initial_count: new FormControl<number | null>(null, [Validators.min(1)]),
    });

    readonly #updateIngredientGQL = inject(UpdateIngredientGQL);
    readonly #matDialogRef = inject(MatDialogRef<IngredientDialogComponent>);

    ngAfterContentInit(): void {
        const { ingredient } = this.data;
        setTimeout(
            () =>
                this.form.patchValue({
                    name: ingredient.name,
                    initial_count: ingredient.initial_count,
                }),
            0,
        );
    }

    /**
     * Close the dialog
     */
    close(): void {
        this.#matDialogRef.close();
    }

    /**
     * Save the ingredient
     */
    save(): void {
        if (this.form.invalid) {
            return;
        }

        const ingredient = {} as IngredientUpdateInput;
        const formValues = this.form.value;

        if (this.data?.ingredient?.name !== formValues.name) {
            Object.assign(ingredient, { name: formValues.name });
        }

        if (this.data?.ingredient?.initial_count !== formValues.initial_count) {
            Object.assign(ingredient, { initial_count: formValues.initial_count });
        }

        this.#updateIngredientGQL
            .mutate({
                ingredient,
                id: this.data.ingredient.id,
            })
            .subscribe({
                next: il => {
                    this.#matDialogRef.close(il);
                },
            });
    }
}
