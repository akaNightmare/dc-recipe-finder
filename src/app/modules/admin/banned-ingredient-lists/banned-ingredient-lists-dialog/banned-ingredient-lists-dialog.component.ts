import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import {
    FormArray,
    FormBuilder,
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
import { cloneDeep } from 'lodash-es';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { combineLatest, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';

import { BannedIngredientListsFacade } from '../../../../../store/banned-ingredient-lists';
import { BannedIngredientList } from '../../../../../store/banned-ingredient-lists/banned-ingredient-lists.types';
import { IngredientsFacade } from '../../../../../store/ingredients';
import { ReplacePipe } from '../../../../pipes/replace.pipe';

@Component({
    selector: 'banned-ingredient-lists-dialog',
    templateUrl: './banned-ingredient-lists-dialog.component.html',
    styleUrls: ['./banned-ingredient-lists-dialog.component.scss'],
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
        NgxMatSelectSearchModule,
        NgIf,
        NgForOf,
        NgClass,
        ReplacePipe,
        MatDialogModule,
    ],
})
export class BannedIngredientListsDialogComponent implements OnInit {
    public bilForm: FormGroup;
    public readonly data: { banned_ingredient_list?: BannedIngredientList } = inject(MAT_DIALOG_DATA);

    private readonly bilFacade = inject(BannedIngredientListsFacade);
    private readonly ingredientFacade = inject(IngredientsFacade);
    private readonly bannedIngredientListsFacade = inject(BannedIngredientListsFacade);
    private readonly matDialogRef = inject(MatDialogRef<BannedIngredientListsDialogComponent>);
    private readonly formBuilder = inject(FormBuilder);

    public readonly searchIngredientsCtrl = new FormControl('');

    public readonly ingredients$ = combineLatest([
        this.searchIngredientsCtrl.valueChanges.pipe(startWith(undefined), debounceTime(200), distinctUntilChanged()),
        this.ingredientFacade.ingredients$,
    ]).pipe(
        map(([search, ingredients]) => {
            search = search?.toLowerCase().trim();
            if (search) {
                ingredients = ingredients.filter(ingredient => ingredient.name.toLowerCase().includes(search));
            }
            return ingredients;
        }),
    );

    ngOnInit(): void {
        this.bilForm = this.formBuilder.group({
            name: [
                undefined,
                {
                    validators: [Validators.required],
                    asyncValidators: [this.bilFacade.createNameValidator()],
                },
            ],
            ingredients: this.formBuilder.array([], [Validators.minLength(1)]),
        });

        if (this.data.banned_ingredient_list) {
            this.data.banned_ingredient_list.ingredients.forEach(() => {
                this.addIngredientField();
            });
            this.bilForm.patchValue(this.data.banned_ingredient_list);
        } else {
            this.addIngredientField();
        }
    }

    get ingredientsCtrl(): FormArray {
        return this.bilForm.get('ingredients') as FormArray;
    }

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: { name?: string }): string | number {
        return item.name || index;
    }

    removeIngredientField(index: number): void {
        this.ingredientsCtrl.removeAt(index);
    }

    addIngredientField(): void {
        const attrFormGroup = this.formBuilder.group({
            image_path: [null, [Validators.required]],
        });
        this.ingredientsCtrl.push(attrFormGroup);
    }

    /**
     * Close the dialog
     */
    close(): void {
        this.matDialogRef.close();
    }

    /**
     * Save the ingredient
     */
    save(): void {
        if (this.bilForm.invalid) {
            return;
        }

        const bannedIngredientList = cloneDeep(this.bilForm.value);
        for (const ingredient of bannedIngredientList.ingredients) {
            ingredient.name = ingredient.image_path.replace(/(\.png|\.jpg)/, '');
        }
        this.bannedIngredientListsFacade.addBannedIngredientList(bannedIngredientList);
        this.matDialogRef.close(bannedIngredientList);
    }
}
