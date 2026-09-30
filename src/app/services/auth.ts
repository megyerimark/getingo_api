
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, MeResponse, User } from '../core/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly apiUrl = environment.apiUrl;
  private readonly csrfUrl = environment.csrfUrl;

  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient) {}

  private csrf(): Observable<void> {
    return this.http.get<void>(this.csrfUrl, {
      withCredentials: true
    });
  }

  register(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    privacy_accepted: boolean;
  }): Observable<AuthResponse> {
    return this.csrf().pipe(
      switchMap(() =>
        this.http.post<AuthResponse>(
          `${this.apiUrl}/regisztracio`,
          data,
          { withCredentials: true }
        )
      ),
      tap(response => this.currentUser.set(response.user))
    );
  }

  login(data: {
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.csrf().pipe(
      switchMap(() =>
        this.http.post<AuthResponse>(
          `${this.apiUrl}/bejelentkezes`,
          data,
          { withCredentials: true }
        )
      ),
      tap(response => this.currentUser.set(response.user))
    );
  }

  me(): Observable<User> {
    return this.http.get<MeResponse>(
      `${this.apiUrl}/user`,
      { withCredentials: true }
    ).pipe(
      tap(response => this.currentUser.set(response.user)),
      switchMap(response => of(response.user))
    );
  }

  restoreSession(): Observable<User | null> {
    return this.me().pipe(
      catchError(() => {
        this.clearAuth();
        return of(null);
      })
    );
  }

  resendVerificationEmail(): Observable<{ message: string; verified: boolean }> {
    return this.csrf().pipe(
      switchMap(() =>
        this.http.post<{ message: string; verified: boolean }>(
          `${this.apiUrl}/email/verification-notification`,
          {},
          { withCredentials: true }
        )
      )
    );
  }

  logout(): Observable<{ message: string }> {
    return this.csrf().pipe(
      switchMap(() =>
        this.http.post<{ message: string }>(
          `${this.apiUrl}/logout`,
          {},
          { withCredentials: true }
        )
      ),
      tap(() => this.clearAuth())
    );
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  clearAuth(): void {
    this.currentUser.set(null);
  }
}




/* import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, User } from '../core/models/user.model';

interface MeResponse {
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly apiUrl = environment.apiUrl;
  private readonly tokenKey = 'auth_token';

  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient) {}

  register(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/regisztracio`, data).pipe(
      tap(response => {
        this.saveToken(response.access_token);
        this.currentUser.set(response.user);
      })
    );
  }

  login(data: {
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/bejelentkezes`, data).pipe(
      tap(response => {
        this.saveToken(response.access_token);
        this.currentUser.set(response.user);
      })
    );
  }

  me(): Observable<User> {
    return this.http.get<MeResponse>(`${this.apiUrl}/user`).pipe(
      map(response => response.user),
      tap(user => this.currentUser.set(user))
    );
  }

  resendVerificationEmail(): Observable<{ message: string; verified: boolean }> {
    return this.csrf().pipe(
      switchMap(() =>
        this.http.post<{ message: string; verified: boolean }>(
          `${this.apiUrl}/email/verification-notification`,
          {},
          { withCredentials: true }
        )
      )
    );
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.clearAuth())
    );
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUser.set(null);
  }
} */