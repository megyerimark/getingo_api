import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);

  const isBackend =
    req.url.startsWith('/api') ||
    req.url.startsWith('/sanctum');

  const request = isBackend
    ? req.clone({
        withCredentials: true,
        setHeaders: {
          Accept: 'application/json'
        }
      })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.clearAuth();
      }

      return throwError(() => error);
    })
  );
};


/* import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import { inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  catchError,
  throwError
} from 'rxjs';

import { Auth } from '../../services/auth';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const auth = inject(Auth);
  const router = inject(Router);

  const token = auth.getToken();

  let request = req;

  // Csak a saját backendünkhöz küldjük a tokent.
  if (
    token &&
    req.url.startsWith(environment.apiUrl)
  ) {

    request = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

  } else if (
    req.url.startsWith(environment.apiUrl)
  ) {

    request = req.clone({
      setHeaders: {
        Accept: 'application/json'
      }
    });
  }

  return next(request).pipe(

    catchError((error: HttpErrorResponse) => {

      if (error.status === 401) {

        auth.clearAuth();

        router.navigate(['/login']);
      }

      return throwError(() => error);
    })

  );
}; */