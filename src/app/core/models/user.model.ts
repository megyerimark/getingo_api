export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  role: 'student' | 'admin';
  is_banned: boolean;
  xp_points: number;
  current_streak: number;
  longest_streak?: number;
  last_learning_activity_on?: string | null;
  plan?: 'free' | 'premium';
  subscription_status?: string | null;
  subscription_billing_cycle?: 'monthly' | 'yearly' | null;
  subscription_current_period_end?: string | null;
  is_premium?: boolean;
  privacy_accepted_at?: string | null;
  privacy_policy_version?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface MeResponse {
  user: User;
}
