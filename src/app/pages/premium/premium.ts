import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BillingPlan } from '../../core/models/billing.model';
import { Auth } from '../../services/auth';
import { BillingService } from '../../services/billing';

@Component({
  selector: 'app-premium',
  imports: [RouterLink],
  templateUrl: './premium.html',
  styleUrl: './premium.scss'
})
export class Premium implements OnInit {
  plans: BillingPlan[] = [];
  loading = true;
  billingConfigured = true;
  checkoutLoading: 'monthly' | 'yearly' | null = null;
  portalLoading = false;
  errorMessage = '';

  constructor(
    public auth: Auth,
    private billing: BillingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.auth.restoreSession().subscribe();

    this.billing.plans()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: response => {
          this.plans = response.plans;
          this.billingConfigured = response.configured;
        },
        error: () => {
          this.errorMessage = 'A Premium csomagok betöltése most nem sikerült.';
        }
      });
  }

  price(plan: BillingPlan): string {
    if (plan.unit_amount === null) {
      return '—';
    }

    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: plan.currency,
      maximumFractionDigits: 0
    }).format(plan.unit_amount / 100);
  }

  intervalLabel(plan: BillingPlan): string {
    return plan.interval === 'year' ? '/ év' : '/ hó';
  }

  planByKey(key: 'monthly' | 'yearly'): BillingPlan | undefined {
    return this.plans.find(plan => plan.key === key);
  }

  startCheckout(plan: 'monthly' | 'yearly'): void {
    const user = this.auth.currentUser();

    if (!user) {
      this.router.navigate(['/register']);
      return;
    }

    if (!user.email_verified_at) {
      this.router.navigate(['/verify-email']);
      return;
    }

    if (user.is_premium) {
      this.manageBilling();
      return;
    }

    this.errorMessage = '';
    this.checkoutLoading = plan;

    this.billing.checkout(plan)
      .pipe(finalize(() => this.checkoutLoading = null))
      .subscribe({
        next: response => window.location.assign(response.url),
        error: error => {
          this.errorMessage = error.error?.message ?? 'A Stripe Checkout indítása nem sikerült.';
        }
      });
  }

  manageBilling(): void {
    this.errorMessage = '';
    this.portalLoading = true;

    this.billing.portal()
      .pipe(finalize(() => this.portalLoading = false))
      .subscribe({
        next: response => window.location.assign(response.url),
        error: error => {
          this.errorMessage = error.error?.message ?? 'A számlázási felület megnyitása nem sikerült.';
        }
      });
  }
}
