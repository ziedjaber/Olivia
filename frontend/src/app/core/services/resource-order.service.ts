import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderedResource {
  resourceId: string;
  resourceName: string;
  quantity: number;
}

export interface ResourceOrder {
  id?: string;
  collecteId: string;
  requesterUid?: string;
  requesterName?: string;
  startDate: string | Date;
  endDate: string | Date;
  resources: OrderedResource[];
  status?: string;
  orderDate?: string | Date;
}

@Injectable({ providedIn: 'root' })
export class ResourceOrderService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/resource-orders';

  getAllOrders(): Observable<ResourceOrder[]> {
    return this.http.get<ResourceOrder[]>(this.apiUrl);
  }

  getMyOrders(): Observable<ResourceOrder[]> {
    return this.http.get<ResourceOrder[]>(`${this.apiUrl}/mine`);
  }

  createOrder(order: ResourceOrder): Observable<ResourceOrder> {
    return this.http.post<ResourceOrder>(this.apiUrl, order);
  }

  approveOrder(id: string): Observable<ResourceOrder> {
    return this.http.put<ResourceOrder>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectOrder(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/reject`, {}, { responseType: 'text' });
  }
}
