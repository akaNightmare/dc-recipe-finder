import { Routes } from '@angular/router';
import { initialDataResolver } from './app.resolvers';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { NoAuthGuard } from './core/auth/guards/noAuth.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
    // Redirect an empty path to '/example'
    { path: '', pathMatch: 'full', redirectTo: 'recipes' },

    // Redirect signed-in user to the '/recipes'
    //
    // After the user signs in, the sign-in page will redirect the user to the 'signed-in-redirect'
    // path.
    // Below is another redirection for that path to redirect the user to the desired location.
    // This is a small convenience to keep all main routes together here on this file.
    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'recipes' },

    // Auth routes for guests
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty',
        },
        children: [
            {
                path: 'sign-in',
                loadChildren: () => import('./modules/auth/sign-in/sign-in.routes'),
            },
        ],
    },

    // Auth routes for authenticated users
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty',
        },
        children: [
            {
                path: 'sign-out',
                loadChildren: () => import('./modules/auth/sign-out/sign-out.routes'),
            },
        ],
    },

    // Admin routes
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: initialDataResolver,
        },
        children: [
            {
                path: 'recipes',
                loadChildren: () => import('./modules/admin/recipes/recipes.routes'),
            },
            {
                path: 'ingredients',
                loadChildren: () => import('./modules/admin/ingredients/ingredients.routes'),
            },
            {
                path: 'ingredient-lists',
                loadChildren: () =>
                    import('./modules/admin/ingredient-lists/ingredient-lists.routes'),
            },
            {
                path: 'recipes-generator',
                loadChildren: () =>
                    import('./modules/admin/recipes-generator/recipes-generator.routes'),
            },
        ],
    },
];
