import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { Category } from '../../core/models/category.model';
import { Lesson } from '../../core/models/lesson.model';
import { CategoryService } from '../../services/category';
import { LessonService } from '../../services/lesson';
import { CodeRunner } from '../../shared/code-runner/code-runner';

interface FeaturedLesson extends Lesson {
  categoryName: string;
  categoryId: number;
}

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, RouterLink, CodeRunner],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  categories: Category[] = [];
  latestLessons: FeaturedLesson[] = [];
  loading = true;
  lessonsLoading = true;
  search = new FormControl('', { nonNullable: true });

  readonly demoHtml = '<h1>Szia, Getingo!</h1>\n<p>Ez az első weboldalam.</p>';
  readonly demoCss = 'body { font-family: system-ui; }\nh1 { color: #1677ff; }';
  readonly demoJavascript = "console.log('Kód fut!');";

  constructor(
    private categoryService: CategoryService,
    private lessonService: LessonService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: categories => {
        this.categories = categories;
        this.loading = false;
        this.loadLatestLessons(categories);
      },
      error: () => {
        this.loading = false;
        this.lessonsLoading = false;
      }
    });
  }

  searchContent(): void {
    const query = this.search.value.trim();

    if (query.length < 2) {
      return;
    }

    this.router.navigate(['/search'], {
      queryParams: { q: query }
    });
  }

  searchCategory(category: Category): void {
    this.search.setValue(category.name);
    this.searchContent();
  }

  categoryShort(category: Category): string {
    const value = category.name.trim().toLowerCase();

    if (value.includes('javascript')) return 'JS';
    if (value === 'html' || value.includes('html')) return 'HTML';
    if (value === 'css' || value.includes('css')) return 'CSS';
    if (value.includes('angular')) return 'A';
    if (value.includes('laravel')) return 'L';

    return category.name.slice(0, 2).toUpperCase();
  }

  categoryTone(category: Category): string {
    const value = `${category.name} ${category.slug}`.toLowerCase();

    if (value.includes('javascript')) return 'javascript';
    if (value.includes('html')) return 'html';
    if (value.includes('css')) return 'css';
    if (value.includes('angular')) return 'angular';
    if (value.includes('laravel')) return 'laravel';

    return 'default';
  }

  lessonExcerpt(lesson: Lesson): string {
    const clean = lesson.content.replace(/\s+/g, ' ').trim();
    return clean.length > 108 ? `${clean.slice(0, 108)}…` : clean;
  }

  private loadLatestLessons(categories: Category[]): void {
    if (!categories.length) {
      this.lessonsLoading = false;
      return;
    }

    const requests = categories.slice(0, 6).map(category =>
      this.lessonService.getByCategory(category.id).pipe(
        catchError(() => of([] as Lesson[])),
        map(lessons => lessons.map(lesson => ({
          ...lesson,
          categoryName: category.name,
          categoryId: category.id
        } as FeaturedLesson)))
      )
    );

    forkJoin(requests).subscribe({
      next: groups => {
        this.latestLessons = groups
          .flat()
          .sort((a, b) => {
            const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
            return bDate - aDate || b.id - a.id;
          })
          .slice(0, 3);
        this.lessonsLoading = false;
      },
      error: () => {
        this.lessonsLoading = false;
      }
    });
  }
}
