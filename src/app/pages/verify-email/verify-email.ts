import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth } from '../../services/auth';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss'
})
export class VerifyEmail implements OnInit {
  user: User | null = null;
  message = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.auth.me().subscribe({
      next: user => {
        this.user = user;

        if (user.email_verified_at) {
          this.goToApp(user);
        }
      },
      error: () => this.router.navigate(['/login'])
    });
  }

  resend(): void {
    if (this.isLoading) {
      return;
    }

    this.message = '';
    this.errorMessage = '';
    this.isLoading = true;

    this.auth.resendVerificationEmail()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: response => this.message = response.message,
        error: error => {
          if (error.status === 429) {
            this.errorMessage = 'Túl sok kérés. Várj egy kicsit, majd próbáld újra.';
            return;
          }

          this.errorMessage = error.error?.message ?? 'Nem sikerült újraküldeni az emailt.';
        }
      });
  }

  refreshStatus(): void {
    this.auth.me().subscribe({
      next: user => {
        this.user = user;

        if (user.email_verified_at) {
          this.goToApp(user);
          return;
        }

        this.message = 'Az email cím még nincs megerősítve.';
      }
    });
  }

  private goToApp(user: User): void {
    this.router.navigate([user.role === 'admin' ? '/admin' : '/dashboard']);
  }
}
