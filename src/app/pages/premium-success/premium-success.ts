import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { BillingService } from '../../services/billing';

@Component({
  selector: 'app-premium-success',
  imports: [RouterLink],
  templateUrl: './premium-success.html',
  styleUrl: './premium-success.scss'
})
export class PremiumSuccess implements OnInit, OnDestroy {
  state: 'checking' | 'active' | 'pending' = 'checking';
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private attempts = 0;

  constructor(
    private billing: BillingService,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.checkStatus();
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private checkStatus(): void {
    this.attempts++;

    this.billing.status().subscribe({
      next: status => {
        if (status.is_premium) {
          this.state = 'active';
          this.auth.me().subscribe();
          return;
        }

        if (this.attempts >= 8) {
          this.state = 'pending';
          return;
        }

        this.timeoutId = setTimeout(() => this.checkStatus(), 1500);
      },
      error: () => {
        this.state = 'pending';
      }
    });
  }
}
