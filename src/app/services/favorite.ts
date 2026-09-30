import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  toggle(lessonId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/favorites/toggle`, {
      lesson_id: lessonId
    });
  }
}