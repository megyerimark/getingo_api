export type QuizAnswer = 'a' | 'b' | 'c' | 'd';

export interface Quiz {
  id: number;
  lesson_id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

export interface QuizResult {
  correct: boolean;
  message: string;
  xp_awarded?: number;
  current_xp?: number;
}