import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Auth } from '../../services/auth';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return auth.me().pipe(
    map(user => {
      if (!user.email_verified_at) {
        return router.createUrlTree(['/verify-email']);
      }

      return user.role === 'admin'
        ? true
        : router.createUrlTree(['/dashboard']);
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
