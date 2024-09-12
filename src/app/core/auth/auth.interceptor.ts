import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { GraphQLError } from 'graphql/error';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    readonly #authService = inject(AuthService);

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        return next.handle(req).pipe(
            catchError(error => {
                if (
                    (error instanceof HttpErrorResponse && error.status === 401) ||
                    error.error?.errors?.some(
                        (err: GraphQLError) => err.extensions?.['code'] === 'UNAUTHENTICATED',
                    )
                ) {
                    this.#authService.clearState();
                    location.reload();
                }

                return throwError(error);
            }),
        );
    }
}
