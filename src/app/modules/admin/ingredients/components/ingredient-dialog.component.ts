import { NgOptimizedImage } from '@angular/common';
import { AfterContentInit, Component, inject, OnDestroy, ViewEncapsulation } from '@angular/core';
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
import { EMPTY, finalize, map, of, switchMap } from 'rxjs';

import { Ingredient, IngredientCreateInput, IngredientUpdateInput } from '../../../../graphql.generated';
import { IngredientImagePipe } from '../../../../pipes';
import {
    CreateIngredientGQL,
    UpdateIngredientGQL,
    UploadIngredientImageGQL,
} from '../ingredients.generated';

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
        NgOptimizedImage,
    ],
})
export class IngredientDialogComponent implements AfterContentInit, OnDestroy {
    public readonly data: { ingredient?: Ingredient } = inject(MAT_DIALOG_DATA);
    public readonly form = new FormGroup({
        name: new FormControl('', [Validators.required]),
        initial_count: new FormControl<number | null>(null, [Validators.min(1)]),
    });

    readonly #createIngredientGQL = inject(CreateIngredientGQL);
    readonly #updateIngredientGQL = inject(UpdateIngredientGQL);
    readonly #uploadIngredientImageGQL = inject(UploadIngredientImageGQL);
    readonly #matDialogRef = inject(MatDialogRef<IngredientDialogComponent>);
    readonly #ingredientImagePipe = new IngredientImagePipe();

    #pendingImageFile: File | null = null;
    #previewObjectUrl: string | null = null;

    public imageError: string | null = null;

    ngAfterContentInit(): void {
        const { ingredient } = this.data;
        if (!ingredient) {
            return;
        }

        setTimeout(
            () =>
                this.form.patchValue({
                    name: ingredient.name,
                    initial_count: ingredient.initial_count,
                }),
            0,
        );
    }

    ngOnDestroy(): void {
        this.clearPreviewUrl();
    }

    get previewImageSrc(): string | null {
        if (this.#previewObjectUrl) {
            return this.#previewObjectUrl;
        }

        if (this.data.ingredient?.image) {
            return this.#ingredientImagePipe.transform(this.data.ingredient.image);
        }

        return null;
    }

    onImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        this.imageError = null;
        this.#pendingImageFile = file;
        this.clearPreviewUrl();
        this.#previewObjectUrl = URL.createObjectURL(file);
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

        const isCreate = !this.data.ingredient;
        if (isCreate && !this.#pendingImageFile) {
            this.imageError = 'Image is required for a new ingredient';
            return;
        }

        this.form.disable();
        this.imageError = null;

        const upload$ = this.#pendingImageFile
            ? this.#uploadIngredientImageGQL
                  .mutate({ variables: { input: { image: this.#pendingImageFile } } })
                  .pipe(map(result => result.data?.uploadIngredientImage ?? null))
            : of<string | null>(null);

        upload$
            .pipe(
                switchMap(uploadedImageUrl => {
                    const formValues = this.form.getRawValue();
                    const ingredient = this.data.ingredient;

                    if (isCreate) {
                        if (!uploadedImageUrl) {
                            this.imageError = 'Failed to upload image';
                            return EMPTY;
                        }

                        const createInput: IngredientCreateInput = {
                            name: formValues.name!,
                            image: uploadedImageUrl,
                            initial_count: formValues.initial_count ?? undefined,
                        };

                        return this.#createIngredientGQL.mutate({
                            variables: { ingredient: createInput },
                            refetchQueries: ['PaginateIngredient'],
                        });
                    }

                    const updateInput = {} as IngredientUpdateInput;

                    if (ingredient!.name !== formValues.name) {
                        Object.assign(updateInput, { name: formValues.name });
                    }

                    if (ingredient!.initial_count !== formValues.initial_count) {
                        Object.assign(updateInput, { initial_count: formValues.initial_count });
                    }

                    if (uploadedImageUrl && uploadedImageUrl !== ingredient!.image) {
                        Object.assign(updateInput, { image: uploadedImageUrl });
                    }

                    if (Object.keys(updateInput).length === 0) {
                        this.#matDialogRef.close();
                        return EMPTY;
                    }

                    return this.#updateIngredientGQL.mutate({
                        variables: {
                            ingredient: updateInput,
                            id: ingredient!.id,
                        },
                        refetchQueries: ['PaginateIngredient'],
                    });
                }),
                finalize(() => this.form.enable()),
            )
            .subscribe({
                next: result => {
                    if (result) {
                        this.#matDialogRef.close(result);
                    }
                },
                error: () => {
                    this.imageError = 'Failed to save ingredient';
                },
            });
    }

    private clearPreviewUrl(): void {
        if (this.#previewObjectUrl) {
            URL.revokeObjectURL(this.#previewObjectUrl);
            this.#previewObjectUrl = null;
        }
    }
}
