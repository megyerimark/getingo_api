import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  complete(lessonId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/progress`, {
      lesson_id: lessonId
    });
  }
}