import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Verger {
  id?: string;
  nom: string;
  typeOlive: string;
  niveauMaturite: number;
  localisation: string;
  proprietaireId?: string;
  nombreArbres: number;
  statut: string;
}

@Injectable({
  providedIn: 'root'
})
export class VergerService {
  private apiUrl = 'http://localhost:8080/api/vergers';

  constructor(private http: HttpClient) {}

  getAllVergers(): Observable<Verger[]> {
    return this.http.get<Verger[]>(this.apiUrl);
  }

  getMyVergers(): Observable<Verger[]> {
    return this.http.get<Verger[]>(`${this.apiUrl}/my`);
  }

  getVergerById(id: string): Observable<Verger> {
    return this.http.get<Verger>(`${this.apiUrl}/${id}`);
  }

  createVerger(verger: Verger): Observable<Verger> {
    return this.http.post<Verger>(this.apiUrl, verger);
  }

  updateVerger(id: string, verger: Verger): Observable<Verger> {
    return this.http.put<Verger>(`${this.apiUrl}/${id}`, verger);
  }

  deleteVerger(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }
}
