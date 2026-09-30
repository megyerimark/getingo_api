export interface PortfolioProject {
  id: number;
  project_id: number;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: number;
  xp_awarded: number;
  completed_at: string;
  html_code: string;
  css_code: string;
  javascript_code: string;
}

export interface PortfolioResponse {
  projects: PortfolioProject[];
  count: number;
}
