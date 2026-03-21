import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Skip snackbar for export requests (blob downloads)
      const isExport = req.url.includes('/export');

      switch (err.status) {
        case 401:
          auth.logout();
          break;

        case 403:
          if (!isExport) {
            snackBar.open('No tenés permiso para realizar esta acción.', 'Cerrar', {
              duration: 4000,
              panelClass: ['snack-error'],
            });
          }
          break;

        case 429:
          snackBar.open('Demasiadas solicitudes. Esperá un momento.', 'Cerrar', {
            duration: 5000,
            panelClass: ['snack-warn'],
          });
          break;

        case 0:
          // Network error / backend down
          snackBar.open('No se pudo conectar al servidor. Verificá tu conexión.', 'Cerrar', {
            duration: 6000,
            panelClass: ['snack-error'],
          });
          break;

        case 500:
        case 502:
        case 503:
          if (!isExport) {
            const message = err.error?.message ?? 'Error interno del servidor.';
            snackBar.open(message, 'Cerrar', {
              duration: 5000,
              panelClass: ['snack-error'],
            });
          }
          break;

        default:
          break;
      }

      return throwError(() => err);
    }),
  );
};
