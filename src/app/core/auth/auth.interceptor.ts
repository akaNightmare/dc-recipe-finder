import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);

    return next(req).pipe(
        catchError(error => {
            if (
                (error instanceof HttpErrorResponse && error.status === 401) ||
                error.error?.data?.statusCode === 401
            ) {
                authService.clearState();
                location.reload();
            }

            return throwError(() => error);
        }),
    );
};
