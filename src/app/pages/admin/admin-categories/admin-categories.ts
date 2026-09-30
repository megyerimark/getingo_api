import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { AdminService } from '../../../services/admin';

@Component({
  selector: 'app-admin-categories',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.scss'
})
export class AdminCategories implements OnInit {
  categories: Category[] = [];
  editingId: number | null = null;
  message = '';
  errorMessage = '';

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(255)] }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)] }),
    sort_order: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] })
  });

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.adminService.getCategories().subscribe({
      next: categories => this.categories = categories,
      error: () => this.errorMessage = 'Nem sikerült betölteni a kategóriákat.'
    });
  }

  edit(category: Category): void {
    this.editingId = category.id;
    this.form.patchValue({
      name: category.name,
      slug: category.slug,
      sort_order: category.sort_order
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancel(): void {
    this.editingId = null;
    this.form.reset({
      name: '',
      slug: '',
      sort_order: 0
    });
  }

  generateSlug(): void {
    if (this.editingId) return;

    const slug = this.form.controls.name.value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    this.form.controls.slug.setValue(slug);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.message = '';
    this.errorMessage = '';

    const data = this.form.getRawValue();
    const request = this.editingId
      ? this.adminService.updateCategory(this.editingId, data)
      : this.adminService.createCategory(data);

    request.subscribe({
      next: response => {
        this.message = response.message;
        this.cancel();
        this.load();
      },
      error: error => this.errorMessage = this.getError(error)
    });
  }

  delete(category: Category): void {
    if (!confirm(`Biztosan törlöd a(z) "${category.name}" kategóriát?`)) return;

    this.message = '';
    this.errorMessage = '';

    this.adminService.deleteCategory(category.id).subscribe({
      next: response => {
        this.message = response.message;
        this.load();
      },
      error: error => this.errorMessage = this.getError(error)
    });
  }

  private getError(error: any): string {
    if (error.status === 409) return error.error?.message ?? 'A kategória nem törölhető.';
    if (error.status === 422) {
      const errors = error.error?.errors;

      if (errors) {
        const key = Object.keys(errors)[0];
        return errors[key]?.[0] ?? 'Hibás adatok.';
      }
    }

    return error.error?.message ?? 'Hiba történt.';
  }
}