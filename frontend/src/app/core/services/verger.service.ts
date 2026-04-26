import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OliveTree {
  id?: string;
  lat: number;
  lng: number;
  status: string; // A_FAIRE, EN_COURS, TERMINE
}

export interface BoundaryPoint {
  lat: number;
  lng: number;
}

export interface Verger {
  id?: string;
  nom: string;
  typeOlive: string;
  niveauMaturite: number;
  localisation: string;
  proprietaireId?: string;
  responsableUid?: string;
  responsableName?: string;
  descriptionMaturite?: string;
  imageMaturiteUrl?: string;
  dateDerniereMaturite?: string;
  nombreArbres: number;
  statut: string;
  boundary?: BoundaryPoint[];
  trees?: OliveTree[];
  // Prediction de maturite
  varieteOlive?: string;
  datePlantation?: string;
  dateReferenceCalculGDD?: string;
  gddCumules?: number;
  gddSeuilMaturite?: number;
  pourcentageMaturite?: number;
  dateMaturitePrevue?: string;
  derniereMeteoJson?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VergerService {
  private apiUrl = 'http://localhost:8080/api/vergers';

  constructor(private http: HttpClient) { }

  getAllVergers(): Observable<Verger[]> {
    return this.http.get<Verger[]>(this.apiUrl);
  }

  getMyVergers(): Observable<Verger[]> {
    return this.http.get<Verger[]>(`${this.apiUrl}/my`);
  }

  getAssignedVergers(): Observable<Verger[]> {
    return this.http.get<Verger[]>(`${this.apiUrl}/responsable`);
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

  updateMaturite(id: string, update: any): Observable<Verger> {
    return this.http.put<Verger>(`${this.apiUrl}/${id}/maturite`, update);
  }

  deleteVerger(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

  generateTrees(id: string, force: boolean = false): Observable<Verger> {
    return this.http.post<Verger>(`${this.apiUrl}/${id}/init-trees?force=${force}`, {});
  }

  updateTreeStatus(id: string, treeId: string, status: string): Observable<Verger> {
    return this.http.put<Verger>(`${this.apiUrl}/${id}/trees/${treeId}/status`, { status });
  }

  syncPredictions(): Observable<any> {
    return this.http.post('http://localhost:8080/api/prediction/sync', {});
  }
}
