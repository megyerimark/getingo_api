import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Lesson, LessonCurriculum } from '../core/models/lesson.model';

@Injectable({
  providedIn: 'root'
})
export class LessonService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getByCategory(categoryId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/categories/${categoryId}/lessons`);
  }

  getCurriculum(categoryId: number): Observable<LessonCurriculum> {
    return this.http.get<LessonCurriculum>(`${this.apiUrl}/categories/${categoryId}/curriculum`);
  }
}
