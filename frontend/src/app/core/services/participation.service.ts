import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Participation {
  id?: string;
  collecteId: string;
  ouvrierUid: string;
  ouvrierName: string;
  ouvrierEmail: string;
  collecteDescription: string;
  collecteType: string;
  collecteDate: Date | string;
  collecteEndDate?: Date | string;
  collecteLocation?: string;
  status: string; // 'INVITED' | 'ACCEPTED' | 'REJECTED' | 'ASSIGNED' | 'COMPLETED'
  dateInvitation: Date | string;
  dateReponse?: Date | string;
  invitedByUid: string;
  invitedByName: string;
  salaryPaid: boolean;
  dateRemoved?: Date | string;
  dailySalary?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ParticipationService {
  private apiUrl = 'http://localhost:8080/api/participations';
  private http = inject(HttpClient);

  getMyParticipations(): Observable<Participation[]> {
    return this.http.get<Participation[]>(`${this.apiUrl}/mine`);
  }

  getActiveParticipations(): Observable<Participation[]> {
    return this.http.get<Participation[]>(`${this.apiUrl}/active`);
  }

  acceptInvitation(id: string): Observable<Participation> {
    return this.http.put<Participation>(`${this.apiUrl}/${id}/accept`, {});
  }

  rejectInvitation(id: string): Observable<Participation> {
    return this.http.put<Participation>(`${this.apiUrl}/${id}/reject`, {});
  }

  payWorker(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/pay`, {}, { responseType: 'text' });
  }

  removeWorker(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/remove`, { responseType: 'text' });
  }
}
