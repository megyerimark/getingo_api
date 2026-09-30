import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardLearningData } from '../core/models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getLearningDashboard(): Observable<DashboardLearningData> {
    return this.http.get<DashboardLearningData>(`${this.apiUrl}/dashboard`, {
      withCredentials: true
    });
  }
}
