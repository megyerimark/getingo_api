import { Component, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../../services/admin';
import { AdminRevenueResponse, AdminStats, AdminSubscriptionResponse } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard implements OnInit {
  stats: AdminStats | null = null;
  subscriptions: AdminSubscriptionResponse | null = null;
  revenue: AdminRevenueResponse | null = null;
  loading = true;
  businessLoading = true;
  errorMessage = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadBusiness();
  }

  loadStats(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getStats().subscribe({
      next: stats => {
        this.stats = stats;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Nem sikerült betölteni az admin statisztikákat.';
        this.loading = false;
      }
    });
  }

  loadBusiness(): void {
    this.businessLoading = true;
    forkJoin({
      subscriptions: this.adminService.getSubscriptions('', 'all'),
      revenue: this.adminService.getRevenue(12)
    }).subscribe({
      next: result => {
        this.subscriptions = result.subscriptions;
        this.revenue = result.revenue;
        this.businessLoading = false;
      },
      error: () => {
        this.businessLoading = false;
      }
    });
  }

  money(amount: number | null | undefined): string {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0
    }).format((amount ?? 0) / 100);
  }

  get lessonCompletionRate(): number {
    return this.stats?.performance.lesson_completion_rate ?? 0;
  }

  get quizCompletionRate(): number {
    return this.stats?.performance.quiz_completion_rate ?? 0;
  }

  get engagementScore(): number {
    return this.stats?.performance.engagement_score ?? 0;
  }
}
