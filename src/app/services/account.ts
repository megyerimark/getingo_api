import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../core/models/user.model';

interface AccountResponse {
  message: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly apiUrl = environment.apiUrl;
  private readonly csrfUrl = environment.csrfUrl;

  constructor(private http: HttpClient) {}

  private csrf(): Observable<void> {
    return this.http.get<void>(this.csrfUrl, { withCredentials: true });
  }

  updateProfile(data: {
    name: string;
    email: string;
    current_password?: string;
  }): Observable<AccountResponse> {
    return this.csrf().pipe(
      switchMap(() =>
        this.http.patch<AccountResponse>(`${this.apiUrl}/account`, data, {
          withCredentials: true
        })
      )
    );
  }

  changePassword(data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Observable<{ message: string }> {
    return this.csrf().pipe(
      switchMap(() =>
        this.http.put<{ message: string }>(`${this.apiUrl}/account/password`, data, {
          withCredentials: true
        })
      )
    );
  }

  exportData(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/gdpr/export`, {
      withCredentials: true,
      responseType: 'blob'
    });
  }

  deleteAccount(password: string): Observable<{ message: string }> {
    return this.csrf().pipe(
      switchMap(() =>
        this.http.delete<{ message: string }>(`${this.apiUrl}/gdpr/delete-account`, {
          withCredentials: true,
          body: { password }
        })
      )
    );
  }
}
