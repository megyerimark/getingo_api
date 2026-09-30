import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Lesson } from '../core/models/lesson.model';

export interface SearchExercise {
  id: number;
  category_id: number;
  title: string;
  description: string;
  difficulty: string;
}

export interface SearchProject {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: number;
}

export interface SearchResponse {
  query: string;
  results: {
    lessons: Lesson[];
    exercises: SearchExercise[];
    projects: SearchProject[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  search(query: string): Observable<SearchResponse> {
    const params = new HttpParams().set('q', query);
    return this.http.get<SearchResponse>(`${this.apiUrl}/search`, { params });
  }
}