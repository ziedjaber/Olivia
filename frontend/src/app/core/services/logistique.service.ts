import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export interface LogisticResource {
  id?: string;
  sku?: string;
  name: string;
  type: string;
  description: string;
  pricePerHour: number;
  images: string[];
  stockLevel: number;
  location: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class LogistiqueService {
  private apiUrl = 'http://localhost:8080/api/logistics';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  getAllResources(): Observable<LogisticResource[]> {
    return this.http.get<LogisticResource[]>(this.apiUrl);
  }

  createResource(resource: LogisticResource): Observable<LogisticResource> {
    return this.http.post<LogisticResource>(this.apiUrl, resource);
  }

  updateResource(id: string, resource: LogisticResource): Observable<LogisticResource> {
    return this.http.put<LogisticResource>(`${this.apiUrl}/${id}`, resource);
  }

  deleteResource(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  uploadImages(files: File[]): Observable<string[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post<string[]>(`${this.apiUrl}/image`, formData);
  }
}
