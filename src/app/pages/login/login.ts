import { Component } from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  finalize
} from 'rxjs';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  errorMessage = '';
  isLoading = false;

  loginForm = new FormGroup({

    email: new FormControl(
      '',
      {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.email
        ]
      }
    ),

    password: new FormControl(
      '',
      {
        nonNullable: true,
        validators: [
          Validators.required
        ]
      }
    )

  });

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  onSubmit(): void {

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.auth
      .login(this.loginForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({

        next: response => {

          if (!response.user.email_verified_at) {
            this.router.navigate(['/verify-email']);
            return;
          }

          if (response.user.role === 'admin') {

            this.router.navigate([
              '/admin'
            ]);

            return;
          }

          this.router.navigate([
            '/dashboard'
          ]);
        },

        error: error => {

          if (error.status === 401) {

            this.errorMessage =
              'Hibás email cím vagy jelszó.';

          } else if (error.status === 403) {

            this.errorMessage =
              error.error?.message ??
              'A felhasználói fiók le van tiltva.';

          } else if (error.status === 429) {

            this.errorMessage =
              'Túl sok bejelentkezési próbálkozás. Próbáld újra később.';

          } else {

            this.errorMessage =
              'Hiba történt. Ellenőrizd, hogy fut-e a backend.';

          }

        }

      });
  }
}