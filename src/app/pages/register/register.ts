import { Component } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  errorMessage = '';
  isLoading = false;

  registerForm = new FormGroup(
    {
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(255)]
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email]
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(12)]
      }),
      password_confirmation: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      privacy_accepted: new FormControl(false, {
        nonNullable: true,
        validators: [Validators.requiredTrue]
      })
    },
    { validators: [Register.passwordMatchValidator] }
  );

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  static passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmation = control.get('password_confirmation')?.value;

    if (!password || !confirmation) {
      return null;
    }

    return password === confirmation ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.auth.register(this.registerForm.getRawValue())
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: response => {
          if (!response.user.email_verified_at) {
            this.router.navigate(['/verify-email']);
            return;
          }

          if (response.user.role === 'admin') {
            this.router.navigate(['/admin']);
            return;
          }

          this.router.navigate(['/dashboard']);
        },
        error: error => {
          if (error.status === 422) {
            const errors = error.error?.errors;
            if (errors) {
              const firstKey = Object.keys(errors)[0];
              this.errorMessage = errors[firstKey]?.[0] ?? 'Hibás adatok.';
            } else {
              this.errorMessage = error.error?.message ?? 'Hibás adatok.';
            }
          } else if (error.status === 429) {
            this.errorMessage = 'Túl sok regisztrációs próbálkozás. Próbáld újra később.';
          } else {
            this.errorMessage = 'Hiba történt a regisztráció során.';
          }
        }
      });
  }
}
