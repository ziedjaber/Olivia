import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Trituration {
  id?: string;
  collecteId: string;
  vergerId: string;
  vergerName: string;
  oliveType: string;
  inputWeightKg: number;
  millId: string;
  millName: string;
  status: string; // 'PLANNED' | 'PROCESSING' | 'COMPLETED'
  plannedDate: Date | string;
  oilProducedLiters?: number;
  acidity?: number;
  quality?: string;
  workerNotes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TriturationService {
  private apiUrl = 'http://localhost:8080/api/triturations';
  private http = inject(HttpClient);

  getTriturations(): Observable<Trituration[]> {
    return this.http.get<Trituration[]>(this.apiUrl);
  }

  getTriturationById(id: string): Observable<Trituration> {
    return this.http.get<Trituration>(`${this.apiUrl}/${id}`);
  }

  createTrituration(trituration: Trituration): Observable<Trituration> {
    return this.http.post<Trituration>(this.apiUrl, trituration);
  }

  updateTrituration(id: string, trituration: Trituration): Observable<Trituration> {
    return this.http.put<Trituration>(`${this.apiUrl}/${id}`, trituration);
  }

  deleteTrituration(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
