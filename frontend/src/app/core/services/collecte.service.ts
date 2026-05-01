import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Participation } from './participation.service';

export interface DailyProgress {
  id?: string;
  date?: string;
  treesHarvested: number;
  weightKg: number;
  notes?: string;
}

export interface Collecte {
  id?: string;
  vergerId: string;
  vergerName: string;
  chefUid?: string;
  chefName?: string;
  logisticsUid?: string;
  logisticsName?: string;
  description: string;
  startDate: Date | string;
  endDate: Date | string;
  type: string; // 'planifiee' | 'urgente'
  statut?: string; // 'en_attente' | 'en_cours' | 'termine'
  numberOfWorkers?: number;
  logisticsReady?: boolean;
  workersReady?: boolean;
  lastVerificationDate?: string;
  dailyReports?: DailyProgress[];
  requiredResources?: { resourceId: string, resourceName: string, quantity: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class CollecteService {
  private apiUrl = 'http://localhost:8080/api/collectes';
  private http = inject(HttpClient);

  getCollectes(): Observable<Collecte[]> {
    return this.http.get<Collecte[]>(this.apiUrl);
  }

  createCollecte(collecte: Collecte): Observable<Collecte> {
    return this.http.post<Collecte>(this.apiUrl, collecte);
  }

  updateCollecte(id: string, collecte: Collecte): Observable<Collecte> {
    return this.http.put<Collecte>(`${this.apiUrl}/${id}`, collecte);
  }

  startCollecte(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/start`, {}, { responseType: 'text' });
  }

  endCollecte(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/end`, {}, { responseType: 'text' });
  }

  inviteOuvrier(id: string, ouvrierUid: string, dailySalary?: number): Observable<Participation> {
    return this.http.post<Participation>(`${this.apiUrl}/${id}/invite-ouvrier`, { ouvrierUid, dailySalary });
  }

  getParticipations(id: string): Observable<Participation[]> {
    return this.http.get<Participation[]>(`${this.apiUrl}/${id}/participations`);
  }

  deleteCollecte(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

  verifyDay(id: string): Observable<Collecte> {
    return this.http.put<Collecte>(`${this.apiUrl}/${id}/verify-day`, {});
  }

  addDailyProgress(id: string, progress: DailyProgress): Observable<Collecte> {
    return this.http.post<Collecte>(`${this.apiUrl}/${id}/progress`, progress);
  }

  markLogisticsReady(id: string, ready: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/mark-logistics-ready?ready=${ready}`, {}, { responseType: 'text' });
  }

  markWorkersReady(id: string, ready: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/mark-workers-ready?ready=${ready}`, {}, { responseType: 'text' });
  }
}
