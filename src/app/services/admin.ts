import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Category } from '../core/models/category.model';
import { environment } from '../../environments/environment';
import {
  AdminExercise,
  AdminLesson,
  AdminLessonSection,
  AdminProject,
  AdminQuiz,
  AdminStats,
  AdminSubscriptionResponse,
  AdminRevenueResponse,
  AdminUser,
  AuditLog
} from '../core/models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  private unwrap<T>(response: any): T[] {
    return response?.data ?? response ?? [];
  }

  getStats(): Observable<AdminStats> {
  return this.http.get<AdminStats>(`${this.apiUrl}/dashboard`);
}

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<any>(`${this.apiUrl}/users`).pipe(
      map(response => this.unwrap<AdminUser>(response))
    );
  }

  updateUserRole(id: number, role: 'student' | 'admin'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/${id}/role`, { role });
  }

  toggleBan(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${id}/toggle-ban`, {});
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<any>(`${this.apiUrl}/categories`).pipe(
      map(response => this.unwrap<Category>(response))
    );
  }

  createCategory(
    data: Omit<Category, 'id' | 'lessons_count' | 'exercises_count'>
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories`, data);
  }

  updateCategory(
    id: number,
    data: Omit<Category, 'id' | 'lessons_count' | 'exercises_count'>
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`);
  }

  getLessonSections(categoryId?: number): Observable<AdminLessonSection[]> {
    let params = new HttpParams();
    if (categoryId) params = params.set('category_id', categoryId);

    return this.http.get<any>(`${this.apiUrl}/lesson-sections`, { params }).pipe(
      map(response => this.unwrap<AdminLessonSection>(response))
    );
  }

  createLessonSection(data: Omit<AdminLessonSection, 'id' | 'lessons_count' | 'category'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/lesson-sections`, data);
  }

  updateLessonSection(
    id: number,
    data: Omit<AdminLessonSection, 'id' | 'lessons_count' | 'category'>
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/lesson-sections/${id}`, data);
  }

  deleteLessonSection(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/lesson-sections/${id}`);
  }

  getLessons(): Observable<AdminLesson[]> {
    return this.http.get<any>(`${this.apiUrl}/lessons`).pipe(
      map(response => this.unwrap<AdminLesson>(response))
    );
  }

  createLesson(data: Omit<AdminLesson, 'id'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/lessons`, data);
  }

  updateLesson(
    id: number,
    data: Omit<AdminLesson, 'id'>
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/lessons/${id}`, data);
  }

  deleteLesson(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/lessons/${id}`);
  }

  getExercises(): Observable<AdminExercise[]> {
    return this.http.get<any>(`${this.apiUrl}/exercises`).pipe(
      map(response => this.unwrap<AdminExercise>(response))
    );
  }

  createExercise(data: Omit<AdminExercise, 'id'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/exercises`, data);
  }

  updateExercise(
    id: number,
    data: Omit<AdminExercise, 'id'>
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/exercises/${id}`, data);
  }

  deleteExercise(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/exercises/${id}`);
  }

  getProjects(): Observable<AdminProject[]> {
    return this.http.get<any>(`${this.apiUrl}/projects`).pipe(
      map(response => this.unwrap<AdminProject>(response))
    );
  }

  createProject(data: Omit<AdminProject, 'id'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/projects`, data);
  }

  updateProject(
    id: number,
    data: Omit<AdminProject, 'id'>
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/projects/${id}`, data);
  }

  deleteProject(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/projects/${id}`);
  }

  getQuizzes(): Observable<AdminQuiz[]> {
    return this.http.get<any>(`${this.apiUrl}/quizzes`).pipe(
      map(response => this.unwrap<AdminQuiz>(response))
    );
  }

  createQuiz(data: Omit<AdminQuiz, 'id'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/quizzes`, data);
  }

  updateQuiz(
    id: number,
    data: Omit<AdminQuiz, 'id'>
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/quizzes/${id}`, data);
  }

  deleteQuiz(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/quizzes/${id}`);
  }



  getSubscriptions(search = '', status = 'all'): Observable<AdminSubscriptionResponse> {
    let params = new HttpParams().set('status', status);
    if (search.trim()) params = params.set('search', search.trim());
    return this.http.get<AdminSubscriptionResponse>(`${this.apiUrl}/subscriptions`, { params });
  }

  getRevenue(months = 12): Observable<AdminRevenueResponse> {
    return this.http.get<AdminRevenueResponse>(`${this.apiUrl}/revenue`, {
      params: new HttpParams().set('months', months)
    });
  }

  syncStripeRevenue(): Observable<{ message: string; synced: number }> {
    return this.http.post<{ message: string; synced: number }>(`${this.apiUrl}/revenue/sync`, {});
  }

  getAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<any>(`${this.apiUrl}/audit-logs`).pipe(
      map(response => this.unwrap<AuditLog>(response))
    );
  }
}