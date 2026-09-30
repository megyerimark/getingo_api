export interface Lesson {
  id: number;
  category_id: number;
  lesson_section_id: number | null;
  sort_order: number;
  title: string;
  slug: string;
  content: string;
  completed?: boolean;
  example_code?: string | null;
  example_html?: string | null;
  example_css?: string | null;
  example_javascript?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LessonSectionProgress {
  completed: number;
  total: number;
  percentage: number;
}

export interface LessonSection {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description?: string | null;
  sort_order: number;
  progress: LessonSectionProgress;
  lessons: Lesson[];
}

export interface LessonCurriculum {
  category: {
    id: number;
    name: string;
    slug: string;
    sort_order: number;
  };
  progress: LessonSectionProgress;
  sections: LessonSection[];
}
