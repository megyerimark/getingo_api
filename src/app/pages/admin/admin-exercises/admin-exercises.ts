import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { AdminExercise } from '../../../core/models/admin.model';
import { AdminService } from '../../../services/admin';

@Component({
  selector: 'app-admin-exercises',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-exercises.html'
})
export class AdminExercises implements OnInit {
  exercises: AdminExercise[] = [];
  categories: Category[] = [];
  editing: AdminExercise | null = null;

  form = new FormGroup({
    category_id: new FormControl<number | null>(null, Validators.required),
    title: new FormControl('', { nonNullable: true, validators: Validators.required }),
    description: new FormControl('', { nonNullable: true, validators: Validators.required }),
    difficulty: new FormControl('kezdő', { nonNullable: true }),
    solution: new FormControl('', { nonNullable: true })
  });

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
    this.adminService.getCategories().subscribe(c => this.categories = c);
  }

  load(): void {
    this.adminService.getExercises().subscribe(e => this.exercises = e);
  }

  save(): void {
    if (this.form.invalid) return;

    const data = this.form.getRawValue();

    if (!data.category_id) return;

    const request = this.editing
      ? this.adminService.updateExercise(this.editing.id, data as any)
      : this.adminService.createExercise(data as any);

    request.subscribe(() => {
      this.reset();
      this.load();
    });
  }

  edit(exercise: AdminExercise): void {
    this.editing = exercise;

    this.form.setValue({
      category_id: exercise.category_id,
      title: exercise.title,
      description: exercise.description,
      difficulty: exercise.difficulty,
      solution: exercise.solution ?? ''
    });
  }

  remove(id: number): void {
    if (!confirm('Biztosan törlöd?')) return;
    this.adminService.deleteExercise(id).subscribe(() => this.load());
  }

  reset(): void {
    this.editing = null;

    this.form.reset({
      category_id: null,
      title: '',
      description: '',
      difficulty: 'kezdő',
      solution: ''
    });
  }
}