import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Quiz, QuizAnswer, QuizResult } from '../core/models/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getByLesson(lessonId: number): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${this.apiUrl}/lessons/${lessonId}/quizzes`);
  }

  check(quizId: number, answer: QuizAnswer): Observable<QuizResult> {
    return this.http.post<QuizResult>(`${this.apiUrl}/quizzes/${quizId}/check`, {
      answer
    });
  }

  submit(quizId: number, answer: QuizAnswer): Observable<QuizResult> {
    return this.http.post<QuizResult>(`${this.apiUrl}/quizzes/${quizId}/submit`, {
      answer
    });
  }
}