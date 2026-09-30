import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminLesson, AdminQuiz } from '../../../core/models/admin.model';
import { AdminService } from '../../../services/admin';

@Component({
  selector: 'app-admin-quizzes',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-quizzes.html',
  styleUrl: './admin-quizzes.scss'
})
export class AdminQuizzes implements OnInit {
  quizzes: AdminQuiz[] = [];
  lessons: AdminLesson[] = [];
  editingId: number | null = null;

  form = new FormGroup({
    lesson_id: new FormControl<number | null>(null, Validators.required),
    question: new FormControl('', { nonNullable: true, validators: Validators.required }),
    option_a: new FormControl('', { nonNullable: true, validators: Validators.required }),
    option_b: new FormControl('', { nonNullable: true, validators: Validators.required }),
    option_c: new FormControl('', { nonNullable: true, validators: Validators.required }),
    option_d: new FormControl('', { nonNullable: true, validators: Validators.required }),
    correct_answer: new FormControl<'a' | 'b' | 'c' | 'd'>('a', { nonNullable: true })
  });

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
    this.adminService.getLessons().subscribe(lessons => this.lessons = lessons);
  }

  load(): void {
    this.adminService.getQuizzes().subscribe(quizzes => this.quizzes = quizzes);
  }

  edit(quiz: AdminQuiz): void {
    this.editingId = quiz.id;
    this.form.patchValue(quiz);
  }

 cancel(): void {
  this.editingId = null;

  this.form.reset({
    lesson_id: null,
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'a'
  });
}

  save(): void {
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    const data = { ...value, lesson_id: Number(value.lesson_id) };

    const request = this.editingId
      ? this.adminService.updateQuiz(this.editingId, data)
      : this.adminService.createQuiz(data);

    request.subscribe(() => {
      this.cancel();
      this.load();
    });
  }

  delete(id: number): void {
    if (!confirm('Biztosan törlöd?')) return;

    this.adminService.deleteQuiz(id).subscribe(() => this.load());
  }
}