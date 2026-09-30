import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PersonalCodeResponse {
  saved: boolean;
  html: string;
  css: string;
  javascript: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PersonalCodeService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get(lessonId: number): Observable<PersonalCodeResponse> {
    return this.http.get<PersonalCodeResponse>(
      `${this.apiUrl}/lessons/${lessonId}/personal-code`
    );
  }

  save(
    lessonId: number,
    html: string,
    css: string,
    javascript: string
  ): Observable<PersonalCodeResponse> {
    return this.http.put<PersonalCodeResponse>(
      `${this.apiUrl}/lessons/${lessonId}/personal-code`,
      {
        html,
        css,
        javascript
      }
    );
  }

  reset(lessonId: number): Observable<PersonalCodeResponse> {
    return this.http.delete<PersonalCodeResponse>(
      `${this.apiUrl}/lessons/${lessonId}/personal-code`
    );
  }
}