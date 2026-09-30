export interface Category {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  lessons_count?: number;
  lesson_sections_count?: number;
  exercises_count?: number;
}