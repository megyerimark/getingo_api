import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminSubscription, AdminSubscriptionSummary } from '../../../core/models/admin.model';
import { AdminService } from '../../../services/admin';

@Component({
  selector: 'app-admin-subscriptions',
  imports: [FormsModule],
  templateUrl: './admin-subscriptions.html',
  styleUrl: './admin-subscriptions.scss'
})
export class AdminSubscriptions implements OnInit {
  subscriptions: AdminSubscription[] = [];
  summary: AdminSubscriptionSummary = { total: 0, active: 0, trialing: 0, past_due: 0, canceled: 0 };
  search = '';
  status = 'all';
  loading = true;
  error = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.adminService.getSubscriptions(this.search, this.status)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: response => {
          this.summary = response.summary;
          this.subscriptions = response.subscriptions;
        },
        error: err => this.error = err?.error?.message ?? 'Az előfizetések nem tölthetők be.'
      });
  }

  clearFilters(): void {
    this.search = '';
    this.status = 'all';
    this.load();
  }

  statusLabel(status: string | null): string {
    const labels: Record<string, string> = {
      active: 'Aktív', trialing: 'Próbaidő', past_due: 'Fizetési hiba', canceled: 'Lemondva',
      unpaid: 'Nem fizetett', incomplete: 'Folyamatban', incomplete_expired: 'Lejárt'
    };
    return status ? (labels[status] ?? status) : 'Nincs előfizetés';
  }

  cycleLabel(cycle: string | null): string {
    if (cycle === 'yearly') return 'Éves';
    if (cycle === 'monthly') return 'Havi';
    return '—';
  }

  formatDate(value: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium' }).format(new Date(value));
  }
}
