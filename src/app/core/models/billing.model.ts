export interface BillingPlan {
  key: 'monthly' | 'yearly';
  price_id: string;
  unit_amount: number | null;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year' | null;
  interval_count: number | null;
}

export interface BillingPlansResponse {
  plans: BillingPlan[];
  configured: boolean;
}

export interface BillingStatus {
  plan: 'free' | 'premium';
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  is_premium: boolean;
}
