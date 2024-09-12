import { AsyncPipe, LowerCasePipe, NgClass, NgOptimizedImage } from '@angular/common';
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
import xor from 'lodash-es/xor';

import { IngredientSearchComponent } from '../../../../components/ingredient-search/ingredient-search.component';
import {
    IngredientList,
    IngredientListCreateInput,
    IngredientListType,
} from '../../../../graphql.generated';
import { ReplacePipe } from '../../../../pipes';
import { CreateIngredientListGQL, UpdateIngredientListGQL } from '../ingredient-lists.generated';

@Component({
    selector: 'ingredient-lists-dialog',
    templateUrl: './ingredient-lists-dialog.component.html',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    imports: [
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        AsyncPipe,
        FormsModule,
        MatInputModule,
        ReactiveFormsModule,
        RxReactiveFormsModule,
        MatProgressSpinnerModule,
        MatRippleModule,
        MatSelectModule,
        NgClass,
        ReplacePipe,
        MatDialogModule,
        LowerCasePipe,
        NgOptimizedImage,
        IngredientSearchComponent,
    ],
})
export class IngredientListsDialogComponent implements AfterContentInit {
    public readonly data: { ingredient_list?: IngredientList } = inject(MAT_DIALOG_DATA);
    public readonly TYPES = Object.values(IngredientListType);
    public readonly bilForm = new FormGroup({
        name: new FormControl('', [Validators.required]),
        type: new FormControl(IngredientListType.Allowlist, { validators: [Validators.required] }),
        ingredient_ids: new FormControl<string[]>([], { validators: [Validators.required] }),
    });

    readonly #createIngredientListGQL = inject(CreateIngredientListGQL);
    readonly #updateIngredientListGQL = inject(UpdateIngredientListGQL);
    readonly #matDialogRef = inject(MatDialogRef<IngredientListsDialogComponent>);

    ngAfterContentInit(): void {
        const { ingredient_list } = this.data;
        if (ingredient_list) {
            setTimeout(
                () =>
                    this.bilForm.patchValue({
                        name: ingredient_list.name,
                        type: ingredient_list.type,
                        ingredient_ids: ingredient_list.ingredients.map(i => i.id),
                    }),
                0,
            );
        }
    }

    /**
     * Close the dialog
     */
    close(): void {
        this.#matDialogRef.close();
    }

    /**
     * Save the ingredient list
     */
    save(): void {
        if (this.bilForm.invalid) {
            return;
        }

        const ingredientList = {} as IngredientListCreateInput;
        const formValues = this.bilForm.value;

        const { ingredient_list } = this.data;

        if (
            xor(ingredient_list?.ingredients.map(i => i.id) ?? [], formValues.ingredient_ids)
                .length > 0
        ) {
            Object.assign(ingredientList, { ingredient_ids: formValues.ingredient_ids });
        }

        if (ingredient_list?.name !== formValues.name) {
            Object.assign(ingredientList, { name: formValues.name });
        }

        if (ingredient_list?.type !== formValues.type) {
            Object.assign(ingredientList, { type: formValues.type });
        }

        if (ingredient_list?.id) {
            this.#updateIngredientListGQL
                .mutate({
                    ingredientList,
                    id: ingredient_list.id,
                })
                .subscribe({
                    next: il => {
                        this.#matDialogRef.close(il);
                    },
                });
        } else {
            this.#createIngredientListGQL.mutate({ ingredientList }).subscribe({
                next: il => {
                    this.#matDialogRef.close(il);
                },
            });
        }
    }
}
