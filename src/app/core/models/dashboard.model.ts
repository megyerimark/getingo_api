export interface DashboardUserSummary {
  id: number;
  name: string;
  xp_points: number;
  current_streak: number;
  longest_streak: number;
  last_learning_activity_on?: string | null;
}

export interface DashboardStats {
  progress_percentage: number;
  completed_lessons_count: number;
  total_lessons_count: number;
  completed_quizzes_count: number;
  completed_projects_count: number;
  achievements_count: number;
}

export interface NextLesson {
  id: number;
  title: string;
  slug: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  url: string;
}

export interface LearningPathItem {
  id: number;
  name: string;
  slug: string;
  completed_lessons: number;
  total_lessons: number;
  progress_percentage: number;
  is_completed: boolean;
  next_lesson_id: number | null;
}

export interface DailyGoal {
  key: 'lesson' | 'quiz' | 'project';
  title: string;
  description: string;
  completed: boolean;
  url: string;
}

export interface AchievementItem {
  slug: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

export interface DashboardLearningData {
  user: DashboardUserSummary;
  stats: DashboardStats;
  next_lesson: NextLesson | null;
  learning_path: LearningPathItem[];
  daily_goals: DailyGoal[];
  daily_progress_percentage: number;
  recent_achievements: AchievementItem[];
}
