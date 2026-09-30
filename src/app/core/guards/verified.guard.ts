import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Auth } from '../../services/auth';

export const verifiedGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return auth.me().pipe(
    map(user =>
      user.email_verified_at
        ? true
        : router.createUrlTree(['/verify-email'])
    ),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
