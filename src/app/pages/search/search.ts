import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SearchResponse, SearchService } from '../../services/search';

@Component({
  selector: 'app-search',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './search.html',
  styleUrl: './search.scss'
})
export class Search implements OnInit, OnDestroy {
  query = new FormControl('', { nonNullable: true });
  results: SearchResponse['results'] | null = null;
  loading = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private searchService: SearchService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const query = params.get('q')?.trim() ?? '';

        if (query.length >= 2) {
          this.query.setValue(query, { emitEvent: false });
          this.runSearch(query);
        }
      });
  }

  submit(): void {
    const query = this.query.value.trim();

    if (query.length < 2) {
      this.errorMessage = 'Legalább 2 karaktert adj meg.';
      return;
    }

    this.router.navigate(['/search'], {
      queryParams: { q: query }
    });
  }

  openLesson(categoryId: number, lessonId: number): void {
    this.router.navigate(
      ['/categories', categoryId, 'lessons'],
      { queryParams: { lesson: lessonId } }
    );
  }

  private runSearch(query: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.searchService.search(query).subscribe({
      next: response => {
        this.results = response.results;
        this.loading = false;
      },
      error: error => {
        this.errorMessage = error.status === 429
          ? 'Túl sok keresés. Próbáld újra később.'
          : 'Nem sikerült a keresés.';

        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}