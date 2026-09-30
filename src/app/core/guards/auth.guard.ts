import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Auth } from '../../services/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return auth.me().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};



/* import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
  catchError,
  map,
  of
} from 'rxjs';

import { Auth } from '../../services/auth';

export const authGuard: CanActivateFn = () => {

  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree([
      '/login'
    ]);
  }

  return auth.me().pipe(

    map(() => true),

    catchError(() => {

      auth.clearAuth();

      return of(
        router.createUrlTree([
          '/login'
        ])
      );

    })

  );
}; */