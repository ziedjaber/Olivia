import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Alerte {
  id?: string;
  vergerId?: string;
  collecteId?: string;
  type: string; // MACHINE, ACCIDENT, INFRASTRUCTURE, WEATHER, OTHER
  description: string;
  importance: string; // LOW, MEDIUM, URGENT
  imageUrl?: string;
  imageUrls?: string[];
  localisation: string; // lat,lng
  senderUid: string;
  senderName: string;
  statut: string; // PENDING, SOLVED
  date?: string | Date;
}

@Injectable({
  providedIn: 'root'
})
export class AlerteService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/alertes';

  reportAlerte(alerte: Alerte): Observable<string> {
    return this.http.post(this.apiUrl, alerte, { 
      responseType: 'text' 
    });
  }

  getMyAlertes(uid: string): Observable<Alerte[]> {
    return this.http.get<Alerte[]>(`${this.apiUrl}/mine/${uid}`);
  }

  deleteAlerte(id: string): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { 
      responseType: 'text' 
    });
  }

  updateAlerte(id: string, alerte: Partial<Alerte>): Observable<string> {
    return this.http.put(`${this.apiUrl}/${id}`, alerte, { 
      responseType: 'text' 
    });
  }

  getAllAlertes(): Observable<Alerte[]> {
    return this.http.get<Alerte[]>(this.apiUrl);
  }

  solveAlerte(id: string): Observable<string> {
    return this.http.put(`${this.apiUrl}/${id}/solve`, {}, { 
      responseType: 'text' 
    });
  }
}
