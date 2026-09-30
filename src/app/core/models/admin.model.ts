export interface AdminStats {
  summary: {
    total_users: number;
    students: number;
    admins: number;
    banned_users: number;
    total_lessons: number;
    total_projects: number;
    total_quizzes: number;
    total_categories: number;
    total_notes: number;
    total_favorites: number;
    completed_lessons: number;
    completed_quizzes: number;
  };
  growth: {
    users_today: number;
    users_this_week: number;
    users_this_month: number;
  };
  performance: {
    lesson_completion_rate: number;
    quiz_completion_rate: number;
    engagement_score: number;
  };
  top_categories: {
    id: number;
    name: string;
    lessons_count: number;
  }[];
  recent_users: {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
  }[];
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'admin';
  is_banned: boolean;
  created_at: string;
}

export interface AdminLessonSection {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description?: string | null;
  sort_order: number;
  lessons_count?: number;
  category?: { id: number; name: string };
}

export interface AdminLesson {
  id: number;
  category_id: number;
  lesson_section_id: number;
  sort_order: number;
  title: string;
  slug: string;
  content: string;
  example_code?: string | null;
  example_html?: string | null;
  example_css?: string | null;
  example_javascript?: string | null;
  section?: { id: number; category_id: number; name: string; slug: string; sort_order: number } | null;
}

export interface AdminQuiz {
  id: number;
  lesson_id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'a' | 'b' | 'c' | 'd';
}

export interface AdminExercise {
  id: number;
  category_id: number;
  title: string;
  description: string;
  difficulty: string;
  solution?: string | null;
}

export interface AdminProject {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: number;
  solution?: string | null;
  starter_html?: string | null;
  starter_css?: string | null;
  starter_javascript?: string | null;
  validation_type: 'console_exact' | 'console_contains';
  expected_output?: string | null;
  xp_reward: number;
}

export interface AuditLog {
  id: number;
  action: string;
  user_id?: number | null;
  actor_user_id?: number | null;
  target_type?: string | null;
  target_id?: number | null;
  metadata?: Record<string, unknown> | string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface AdminSubscriptionSummary {
  total: number;
  active: number;
  trialing: number;
  past_due: number;
  canceled: number;
}

export interface AdminSubscription {
  id: number;
  name: string;
  email: string;
  plan: 'free' | 'premium';
  is_premium: boolean;
  status: string | null;
  billing_cycle: 'monthly' | 'yearly' | null;
  current_period_end: string | null;
  premium_started_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

export interface AdminSubscriptionResponse {
  summary: AdminSubscriptionSummary;
  subscriptions: AdminSubscription[];
}

export interface AdminRevenueMonth {
  key: string;
  label: string;
  amount: number;
  payments: number;
}

export interface AdminRevenuePayment {
  id: number;
  user: { id: number; name: string; email: string } | null;
  status: string;
  amount_paid: number;
  currency: string;
  billing_reason: string | null;
  paid_at: string | null;
  hosted_invoice_url: string | null;
}

export interface AdminRevenueResponse {
  summary: {
    total_revenue: number;
    current_month_revenue: number;
    previous_month_revenue: number;
    month_growth_percentage: number;
    mrr: number;
    active_subscriptions: number;
    successful_payments: number;
    failed_payments: number;
    currency: string;
  };
  plans: {
    monthly: { active: number; unit_amount: number | null };
    yearly: { active: number; unit_amount: number | null };
  };
  monthly: AdminRevenueMonth[];
  recent_payments: AdminRevenuePayment[];
  last_synced_payment_at: string | null;
}
