import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminLesson, AdminLessonSection } from '../../../core/models/admin.model';
import { Category } from '../../../core/models/category.model';
import { AdminService } from '../../../services/admin';
import { CategoryService } from '../../../services/category';

@Component({
  selector: 'app-admin-lessons',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-lessons.html',
  styleUrl: './admin-lessons.scss'
})
export class AdminLessons implements OnInit {
  lessons: AdminLesson[] = [];
  categories: Category[] = [];
  sections: AdminLessonSection[] = [];
  editingLesson: AdminLesson | null = null;
  editingSection: AdminLessonSection | null = null;
  loading = true;
  saving = false;
  sectionSaving = false;
  message = '';
  errorMessage = '';

  sectionForm = new FormGroup({
    category_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    sort_order: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] })
  });

  form = new FormGroup({
    category_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    lesson_section_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    sort_order: new FormControl(10, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    content: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    example_html: new FormControl('', { nonNullable: true }),
    example_css: new FormControl('', { nonNullable: true }),
    example_javascript: new FormControl('', { nonNullable: true })
  });

  constructor(
    private adminService: AdminService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadSections();
    this.loadLessons();

    this.form.controls.category_id.valueChanges.subscribe(categoryId => {
      const sectionId = this.form.controls.lesson_section_id.value;
      if (sectionId && !this.sections.some(section => section.id === sectionId && section.category_id === categoryId)) {
        this.form.controls.lesson_section_id.setValue(null);
      }
    });
  }

  get availableSections(): AdminLessonSection[] {
    const categoryId = this.form.controls.category_id.value;
    if (!categoryId) return [];
    return this.sections.filter(section => section.category_id === categoryId);
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: categories => this.categories = categories,
      error: () => this.errorMessage = 'Nem sikerült betölteni a kategóriákat.'
    });
  }

  loadSections(): void {
    this.adminService.getLessonSections().subscribe({
      next: sections => this.sections = sections,
      error: () => this.errorMessage = 'Nem sikerült betölteni a fejezeteket.'
    });
  }

  loadLessons(): void {
    this.loading = true;
    this.adminService.getLessons().subscribe({
      next: lessons => {
        this.lessons = lessons;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Nem sikerült betölteni a leckéket.';
        this.loading = false;
      }
    });
  }

  sectionNameChanged(): void {
    if (this.editingSection) return;
    this.sectionForm.controls.slug.setValue(this.slugify(this.sectionForm.controls.name.value));
  }

  titleChanged(): void {
    if (this.editingLesson) return;
    this.form.controls.slug.setValue(this.slugify(this.form.controls.title.value));
  }

  saveSection(): void {
    if (this.sectionForm.invalid) {
      this.sectionForm.markAllAsTouched();
      return;
    }

    const categoryId = this.sectionForm.controls.category_id.value;
    if (!categoryId) return;

    const data = {
      category_id: categoryId,
      name: this.sectionForm.controls.name.value,
      slug: this.sectionForm.controls.slug.value,
      description: this.sectionForm.controls.description.value || null,
      sort_order: this.sectionForm.controls.sort_order.value
    };

    this.sectionSaving = true;
    this.message = '';
    this.errorMessage = '';

    const request = this.editingSection
      ? this.adminService.updateLessonSection(this.editingSection.id, data)
      : this.adminService.createLessonSection(data);

    request.subscribe({
      next: response => {
        this.message = response.message ?? 'Fejezet elmentve.';
        this.sectionSaving = false;
        this.resetSectionForm();
        this.loadSections();
      },
      error: error => {
        this.errorMessage = error.error?.message ?? 'Nem sikerült menteni a fejezetet.';
        this.sectionSaving = false;
      }
    });
  }

  editSection(section: AdminLessonSection): void {
    this.editingSection = section;
    this.sectionForm.setValue({
      category_id: section.category_id,
      name: section.name,
      slug: section.slug,
      description: section.description ?? '',
      sort_order: section.sort_order
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteSection(section: AdminLessonSection): void {
    if (!confirm(`Biztosan törlöd ezt a fejezetet: ${section.name}?`)) return;

    this.adminService.deleteLessonSection(section.id).subscribe({
      next: response => {
        this.message = response.message ?? 'Fejezet törölve.';
        this.sections = this.sections.filter(item => item.id !== section.id);
      },
      error: error => this.errorMessage = error.error?.message ?? 'Nem sikerült törölni a fejezetet.'
    });
  }

  cancelSectionEdit(): void {
    this.resetSectionForm();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const categoryId = this.form.controls.category_id.value;
    const sectionId = this.form.controls.lesson_section_id.value;
    if (!categoryId || !sectionId) return;

    const data = {
      category_id: categoryId,
      lesson_section_id: sectionId,
      sort_order: this.form.controls.sort_order.value,
      title: this.form.controls.title.value,
      slug: this.form.controls.slug.value,
      content: this.form.controls.content.value,
      example_html: this.form.controls.example_html.value,
      example_css: this.form.controls.example_css.value,
      example_javascript: this.form.controls.example_javascript.value
    };

    this.saving = true;
    this.message = '';
    this.errorMessage = '';

    const request = this.editingLesson
      ? this.adminService.updateLesson(this.editingLesson.id, data)
      : this.adminService.createLesson(data);

    request.subscribe({
      next: response => {
        this.message = response.message ?? 'Tananyag elmentve.';
        this.saving = false;
        this.resetForm();
        this.loadLessons();
        this.loadSections();
      },
      error: error => {
        this.errorMessage = error.error?.message ?? 'Nem sikerült menteni a tananyagot.';
        this.saving = false;
      }
    });
  }

  edit(lesson: AdminLesson): void {
    this.editingLesson = lesson;
    this.message = '';
    this.errorMessage = '';

    this.form.setValue({
      category_id: lesson.category_id,
      lesson_section_id: lesson.lesson_section_id,
      sort_order: lesson.sort_order ?? 10,
      title: lesson.title,
      slug: lesson.slug,
      content: lesson.content,
      example_html: lesson.example_html ?? '',
      example_css: lesson.example_css ?? '',
      example_javascript: lesson.example_javascript ?? lesson.example_code ?? ''
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteLesson(lesson: AdminLesson): void {
    if (!confirm(`Biztosan törlöd ezt a leckét: ${lesson.title}?`)) return;

    this.adminService.deleteLesson(lesson.id).subscribe({
      next: response => {
        this.message = response.message ?? 'Lecke törölve.';
        this.lessons = this.lessons.filter(item => item.id !== lesson.id);
        if (this.editingLesson?.id === lesson.id) this.resetForm();
        this.loadSections();
      },
      error: error => this.errorMessage = error.error?.message ?? 'Nem sikerült törölni a leckét.'
    });
  }

  sectionCountForCategory(categoryId: number): number {
    return this.sections.filter(section => section.category_id === categoryId).length;
  }

  getCategoryName(categoryId: number): string {
    return this.categories.find(category => category.id === categoryId)?.name ?? 'Ismeretlen kategória';
  }

  getSectionName(sectionId: number | null): string {
    if (!sectionId) return 'Nincs fejezet';
    return this.sections.find(section => section.id === sectionId)?.name ?? 'Ismeretlen fejezet';
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private resetSectionForm(): void {
    this.editingSection = null;
    this.sectionForm.reset({
      category_id: null,
      name: '',
      slug: '',
      description: '',
      sort_order: 0
    });
  }

  private resetForm(): void {
    this.editingLesson = null;
    this.form.reset({
      category_id: null,
      lesson_section_id: null,
      sort_order: 10,
      title: '',
      slug: '',
      content: '',
      example_html: '',
      example_css: '',
      example_javascript: ''
    });
  }
}
