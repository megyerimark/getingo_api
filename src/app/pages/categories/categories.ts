import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../core/models/category.model';
import { CategoryService } from '../../services/category';

@Component({
  selector: 'app-categories',
  imports: [RouterLink],
  templateUrl: './categories.html',
  styleUrl: './categories.scss'
})
export class Categories implements OnInit {
  categories: Category[] = [];
  loading = true;
  errorMessage = '';

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: categories => {
        this.categories = categories;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Nem sikerült betölteni a kategóriákat.';
        this.loading = false;
      }
    });
  }

  categoryShort(category: Category): string {
    const value = category.name.toLowerCase();
    if (value.includes('javascript')) return 'JS';
    if (value.includes('html')) return 'HTML';
    if (value.includes('css')) return 'CSS';
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
}
