import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog } from '../models/audit-log.model';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private apiUrl = 'http://localhost:8080/api/audit';
  private http = inject(HttpClient);

  getAll(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(this.apiUrl);
  }

  getFiltered(action?: string, entite?: string): Observable<AuditLog[]> {
    let params = new HttpParams();
    if (action) params = params.set('action', action);
    if (entite) params = params.set('entite', entite);
    
    return this.http.get<AuditLog[]>(`${this.apiUrl}/filter`, { params });
  }
}
