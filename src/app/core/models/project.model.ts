export type ProjectValidationType = 'console_exact' | 'console_contains';

export interface Project {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: number;
  xp_reward: number;
  is_completed: boolean;
  starter_html?: string;
  starter_css?: string;
  starter_javascript?: string;
  validation_type?: ProjectValidationType;
  validation_configured?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectSubmission {
  html_code: string;
  css_code: string;
  javascript_code: string;
  completed_at?: string | null;
  xp_awarded: number;
}

export interface ProjectListResponse {
  projects: Project[];
}

export interface ProjectResponse {
  project: Project;
  submission: ProjectSubmission | null;
}

export interface ProjectWorkspacePayload {
  html_code: string;
  css_code: string;
  javascript_code: string;
}

export interface ProjectCheckPayload extends ProjectWorkspacePayload {
  console_output: string[];
}

export interface ProjectCheckResponse {
  passed: boolean;
  message: string;
  earned_xp?: number;
  already_completed?: boolean;
  completed_at?: string | null;
  is_completed: boolean;
  xp_points?: number;
  console_output?: string[];
  unlocked_achievements?: ProjectUnlockedAchievement[];
}

export interface ProjectUnlockedAchievement {
  slug: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
}
