import { Component, Input, OnChanges } from '@angular/core';
import { Quiz, QuizAnswer } from '../../core/models/quiz.model';
import { QuizService } from '../../services/quiz';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-lesson-quiz',
  imports: [],
  templateUrl: './lesson-quiz.html',
  styleUrl: './lesson-quiz.scss'
})
export class LessonQuiz implements OnChanges {
  @Input({ required: true }) lessonId!: number;

  quizzes: Quiz[] = [];
  selectedAnswers: Record<number, QuizAnswer | null> = {};
  results: Record<number, { correct: boolean; message: string }> = {};
  loading = false;

  constructor(
    private quizService: QuizService,
    public auth: Auth
  ) {}

  ngOnChanges(): void {
    if (this.lessonId) {
      this.load();
    }
  }

  load(): void {
    this.loading = true;
    this.selectedAnswers = {};
    this.results = {};

    this.quizService.getByLesson(this.lessonId).subscribe({
      next: quizzes => {
        this.quizzes = quizzes;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  select(quizId: number, answer: QuizAnswer): void {
    this.selectedAnswers[quizId] = answer;
    delete this.results[quizId];
  }

  submit(quiz: Quiz): void {
    const answer = this.selectedAnswers[quiz.id];

    if (!answer) {
      this.results[quiz.id] = {
        correct: false,
        message: 'Először válassz egy választ.'
      };
      return;
    }

    const request = this.auth.isLoggedIn()
      ? this.quizService.submit(quiz.id, answer)
      : this.quizService.check(quiz.id, answer);

    request.subscribe({
      next: result => {
        this.results[quiz.id] = {
          correct: result.correct,
          message: result.message
        };
      },
      error: () => {
        this.results[quiz.id] = {
          correct: false,
          message: 'Nem sikerült ellenőrizni a választ.'
        };
      }
    });
  }

  optionClass(quizId: number, answer: QuizAnswer): string {
    if (this.selectedAnswers[quizId] === answer) {
      return 'quiz-option selected';
    }

    return 'quiz-option';
  }
}