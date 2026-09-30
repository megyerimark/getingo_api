import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AccountService } from '../../services/account';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './account.html',
  styleUrl: './account.scss'
})
export class Account implements OnInit {
  profileMessage = '';
  profileError = '';
  passwordMessage = '';
  passwordError = '';
  deleteError = '';
  isSavingProfile = false;
  isChangingPassword = false;
  isExporting = false;
  isDeleting = false;

  profileForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)]
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    current_password: new FormControl('', { nonNullable: true })
  });

  passwordForm = new FormGroup({
    current_password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(12)]
    }),
    password_confirmation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  deleteForm = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    confirm: new FormControl(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue]
    })
  });

  constructor(
    public auth: Auth,
    private accountService: AccountService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.auth.me().subscribe({
      next: user => {
        this.profileForm.patchValue({
          name: user.name,
          email: user.email
        });
      },
      error: () => this.router.navigate(['/login'])
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileMessage = '';
    this.profileError = '';
    this.isSavingProfile = true;

    const value = this.profileForm.getRawValue();

    this.accountService.updateProfile({
      name: value.name,
      email: value.email,
      current_password: value.current_password || undefined
    })
      .pipe(finalize(() => this.isSavingProfile = false))
      .subscribe({
        next: response => {
          this.auth.currentUser.set(response.user);
          this.profileMessage = response.message;
          this.profileForm.controls.current_password.setValue('');

          if (!response.user.email_verified_at) {
            this.router.navigate(['/verify-email']);
          }
        },
        error: error => {
          this.profileError = this.firstError(error, 'Nem sikerült menteni a fiókadatokat.');
        }
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const value = this.passwordForm.getRawValue();

    if (value.password !== value.password_confirmation) {
      this.passwordError = 'A két új jelszó nem egyezik.';
      return;
    }

    this.passwordMessage = '';
    this.passwordError = '';
    this.isChangingPassword = true;

    this.accountService.changePassword(value)
      .pipe(finalize(() => this.isChangingPassword = false))
      .subscribe({
        next: response => {
          this.passwordMessage = response.message;
          this.passwordForm.reset();
          this.auth.clearAuth();
          this.router.navigate(['/login']);
        },
        error: error => {
          this.passwordError = this.firstError(error, 'Nem sikerült megváltoztatni a jelszót.');
        }
      });
  }

  exportData(): void {
    this.isExporting = true;

    this.accountService.exportData()
      .pipe(finalize(() => this.isExporting = false))
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'getingo-szemelyes-adataim.json';
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        }
      });
  }

  deleteAccount(): void {
    if (this.deleteForm.invalid) {
      this.deleteForm.markAllAsTouched();
      return;
    }

    this.deleteError = '';
    this.isDeleting = true;

    this.accountService.deleteAccount(this.deleteForm.controls.password.value)
      .pipe(finalize(() => this.isDeleting = false))
      .subscribe({
        next: () => {
          this.auth.clearAuth();
          this.router.navigate(['/']);
        },
        error: error => {
          this.deleteError = this.firstError(error, 'Nem sikerült törölni a fiókot.');
        }
      });
  }

  private firstError(error: any, fallback: string): string {
    const errors = error.error?.errors;

    if (errors) {
      const firstKey = Object.keys(errors)[0];
      return errors[firstKey]?.[0] ?? fallback;
    }

    return error.error?.message ?? fallback;
  }
}
