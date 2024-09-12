import { Routes } from '@angular/router';
import { RecipeGeneratorCreateComponent } from './components/recipe-generator-create/recipe-generator-create.component';
import { RecipesGeneratorComponent } from './recipes-generator.component';

export default [
    {
        path: '',
        component: RecipesGeneratorComponent,
    },
    {
        path: 'create',
        component: RecipeGeneratorCreateComponent,
    },
] as Routes;
