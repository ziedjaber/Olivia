import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  updateProfile(user: User): Observable<any> {
    return this.http.put(`${this.apiUrl}/me`, user, { responseType: 'text' });
  }

  uploadAvatar(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/avatar`, formData, { responseType: 'text' });
  }

  // Admin methods
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  updateRole(userId: string, role: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}/role`, { role }, { responseType: 'text' });
  }

  toggleStatus(userId: string, active: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}/status`, { active }, { responseType: 'text' });
  }

  adminCreateUser(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/create`, user, { responseType: 'text' });
  }
}
