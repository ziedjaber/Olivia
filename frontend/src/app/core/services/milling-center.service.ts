import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MillingCenter {
  id?: string;
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
  contactNumber: string;
  dailyCapacityKg: number;
  status: string; // 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
}

@Injectable({
  providedIn: 'root'
})
export class MillingCenterService {
  private apiUrl = 'http://localhost:8080/api/milling-centers';
  private http = inject(HttpClient);

  getCenters(): Observable<MillingCenter[]> {
    return this.http.get<MillingCenter[]>(this.apiUrl);
  }

  getCenterById(id: string): Observable<MillingCenter> {
    return this.http.get<MillingCenter>(`${this.apiUrl}/${id}`);
  }

  createCenter(center: MillingCenter): Observable<MillingCenter> {
    return this.http.post<MillingCenter>(this.apiUrl, center);
  }

  updateCenter(id: string, center: MillingCenter): Observable<MillingCenter> {
    return this.http.put<MillingCenter>(`${this.apiUrl}/${id}`, center);
  }

  deleteCenter(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
