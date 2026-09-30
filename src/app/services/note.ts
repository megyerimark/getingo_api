import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Note {
  id: number;
  user_id: number;
  lesson_id: number;
  content: string;
  created_at?: string;
  updated_at?: string;
  lesson?: {
    id: number;
    title: string;
    category_id: number;
  };
}

export interface NoteResponse {
  message: string;
  note: Note;
}

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.apiUrl}/notes`);
  }

  save(lessonId: number, content: string): Observable<NoteResponse> {
    return this.http.post<NoteResponse>(`${this.apiUrl}/notes`, {
      lesson_id: lessonId,
      content
    });
  }

  update(id: number, content: string): Observable<NoteResponse> {
    return this.http.put<NoteResponse>(`${this.apiUrl}/notes/${id}`, { content });
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/notes/${id}`);
  }
}