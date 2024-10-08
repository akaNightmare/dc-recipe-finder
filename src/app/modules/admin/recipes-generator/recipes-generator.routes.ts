import { Routes } from '@angular/router';
import { RecipeCheckerComponent } from './components/recipe-checker/recipe-checker.component';
import { RecipeGeneratorActivityComponent } from './components/recipe-generator-activity/recipe-generator-activity.component';
import { RecipeGeneratorCreateComponent } from './components/recipe-generator-create/recipe-generator-create.component';
import { RecipeGeneratorViewComponent } from './components/recipe-generator-view/recipe-generator-view.component';
import { RecipeListResolver } from './recipe-list.resolver';
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
        path: 'check',
        component: RecipeCheckerComponent,
    },
    {
        path: ':recipeListId',
        component: RecipeGeneratorViewComponent,
        resolve: {
            recipeList: RecipeListResolver,
        },
    },
    {
        path: ':recipeListId/activity',
        component: RecipeGeneratorActivityComponent,
    },
] as Routes;
