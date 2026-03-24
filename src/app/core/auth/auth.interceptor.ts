import { HttpErrorResponse, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const tenantId = auth.getTenantId();

  const addAuthHeaders = (t: string | null) =>
    req.clone({
      setHeaders: {
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
      },
    });

  const authReq = token ? addAuthHeaders(token) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        req.url.includes('/auth/refresh')
      ) {
        return throwError(() => error);
      }

      const refresh$ = auth.refreshToken();
      if (!refresh$) {
        auth.logout();
        return throwError(() => error);
      }

      return refresh$.pipe(
        switchMap(() => {
          const newToken = auth.getToken();
          return next(addAuthHeaders(newToken));
        }),
        catchError((refreshError: unknown) => {
          auth.logout();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};