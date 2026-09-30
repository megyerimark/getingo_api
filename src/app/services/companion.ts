import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CompanionActionKey,
  CompanionActionResponse,
  BuddyRoomKey,
  CompanionState
} from '../core/models/companion.model';

@Injectable({
  providedIn: 'root'
})
export class CompanionService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getState(): Observable<CompanionState> {
    return this.http.get<CompanionState>(`${this.apiUrl}/companion`, {
      withCredentials: true
    });
  }

  updatePreferences(data: { room?: BuddyRoomKey; skin?: string }): Observable<CompanionState> {
    return this.http.patch<CompanionState>(`${this.apiUrl}/companion/preferences`, data, {
      withCredentials: true
    });
  }

  performAction(action: CompanionActionKey): Observable<CompanionActionResponse> {
    return this.http.post<CompanionActionResponse>(
      `${this.apiUrl}/companion/action`,
      { action },
      { withCredentials: true }
    );
  }
}
