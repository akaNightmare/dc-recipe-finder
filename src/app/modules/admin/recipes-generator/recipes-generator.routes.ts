import { Routes } from '@angular/router';
import { RecipeGeneratorCreateComponent } from './components/recipe-generator-create/recipe-generator-create.component';
import { RecipeGeneratorViewComponent } from './components/recipe-generator-view/recipe-generator-view.component';
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
    {
        path: ':recipeListId',
        component: RecipeGeneratorViewComponent,
    },
] as Routes;
