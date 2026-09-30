import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { AdminRevenueResponse } from '../../../core/models/admin.model';
import { AdminService } from '../../../services/admin';

@Component({
  selector: 'app-admin-revenue',
  imports: [],
  templateUrl: './admin-revenue.html',
  styleUrl: './admin-revenue.scss'
})
export class AdminRevenue implements OnInit {
  data: AdminRevenueResponse | null = null;
  loading = true;
  syncing = false;
  error = '';
  syncMessage = '';
  months = 12;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.adminService.getRevenue(this.months)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: data => this.data = data,
        error: err => this.error = err?.error?.message ?? 'A bevételi statisztika nem tölthető be.'
      });
  }

  syncStripe(): void {
    if (this.syncing) return;
    this.syncing = true;
    this.syncMessage = '';
    this.adminService.syncStripeRevenue()
      .pipe(finalize(() => this.syncing = false))
      .subscribe({
        next: result => { this.syncMessage = `${result.synced} Stripe számla szinkronizálva.`; this.load(); },
        error: err => this.error = err?.error?.message ?? 'A Stripe szinkronizálás nem sikerült.'
      });
  }

  money(amount: number | null | undefined): string {
    return new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format((amount ?? 0) / 100);
  }

  chartMax(): number {
    return Math.max(1, ...(this.data?.monthly.map(item => item.amount) ?? [1]));
  }

  chartHeight(amount: number): number {
    return Math.max(3, Math.round((amount / this.chartMax()) * 100));
  }

  growthClass(): string { return (this.data?.summary.month_growth_percentage ?? 0) >= 0 ? 'up' : 'down'; }

  date(value: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }

  billingReason(value: string | null): string {
    const map: Record<string, string> = { subscription_create: 'Új előfizetés', subscription_cycle: 'Megújítás', subscription_update: 'Csomagváltás', manual: 'Manuális' };
    return value ? (map[value] ?? value) : 'Stripe számla';
  }
}
