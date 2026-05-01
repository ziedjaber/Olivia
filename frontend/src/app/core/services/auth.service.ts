import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpBackend, HttpHeaders } from '@angular/common/http';
import { Observable, tap, from, switchMap, of } from 'rxjs';
import { auth, googleProvider } from '../config/firebase.config';
import { signInWithEmailAndPassword, signOut, User as FirebaseUser, signInWithPopup,getAuth } from 'firebase/auth';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string | null;
  avatarUrl?: string;
  password?: string;
  active: boolean;
}

export interface AuthResponse {
  id: string;
  token: string;
  email: string;
  fullName: string;
  role: string | null;
  active: boolean;
  avatarUrl?: string;
  needsProfile?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  
  currentUser = signal<User | null>(null);

  constructor(
    private http: HttpClient,
    private handler: HttpBackend,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem('user');
      console.log('[AuthService] Restoring identity from storage. Found:', !!savedUser);
      if (savedUser) {
        const user = JSON.parse(savedUser);
        this.currentUser.set(user);
        console.log('[AuthService] user identity set for UID:', user.id);
        
        // Use a clean HttpClient (bypassing interceptors) for the initial sync 
        // to avoid circular dependency with AuthInterceptor.
        const cleanHttp = new HttpClient(this.handler);
        const token = localStorage.getItem('token');
        let headers = new HttpHeaders();
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }
        
        cleanHttp.get<User>('http://localhost:8080/api/users/me', { headers }).subscribe({
          next: (refreshedUser) => {
            const updated = { ...user, ...refreshedUser };
            localStorage.setItem('user', JSON.stringify(updated));
            this.currentUser.set(updated);
          },
          error: (err) => {
            console.warn('[Auth] Profile sync failed, using cached data.', err);
          }
        });
      }
    }
  }

  googleLogin(): Observable<AuthResponse> {
    return from(signInWithPopup(auth, googleProvider)).pipe(
      switchMap(userCredential => from(userCredential.user.getIdToken())),
      switchMap(token => this.http.post<AuthResponse>(`${this.apiUrl}/login`, { idToken: token }).pipe(
        tap(res => this.handleAuthSuccess(res))
      ))
    );
  }

  completeSocialRegistration(role: string, fullName: string): Observable<AuthResponse> {
    const token = this.getToken();
    return this.http.post<AuthResponse>(`${this.apiUrl}/complete-social-registration`, {
      idToken: token,
      role: role,
      fullName: fullName
    }).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  private handleAuthSuccess(res: AuthResponse) {
    console.log('[Auth] Handling auth success. needsProfile:', res.needsProfile);
    if (isPlatformBrowser(this.platformId)) {
      if (res.token) localStorage.setItem('token', res.token);
      
      const user: User = { 
        id: res.id, 
        email: res.email, 
        fullName: res.fullName, 
        role: res.role,
        active: res.active,
        avatarUrl: res.avatarUrl
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUser.set(user);
    }
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    const email = credentials.email.toLowerCase();
    return from(signInWithEmailAndPassword(auth, email, credentials.password)).pipe(
      switchMap(userCredential => from(userCredential.user.getIdToken())),
      switchMap(token => this.http.post<AuthResponse>(`${this.apiUrl}/login`, { idToken: token }).pipe(
        tap(res => this.handleAuthSuccess(res))
      ))
    );
  }

  register(userData: any): Observable<any> {
    const normalizedData = { ...userData, email: userData.email.toLowerCase() };
    return this.http.post(`${this.apiUrl}/register`, normalizedData);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email: email.toLowerCase() });
  }

  logout() {
    signOut(auth);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.currentUser.set(null);
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  isLoggedIn(): boolean {
    const user = this.currentUser();
    return !!this.getToken() && !!user && !!user.role;
  }

  getAvatarUrl(path: string | undefined): string {
    if (!path) return 'https://ui-avatars.com/api/?name=User&background=random&color=fff&size=512';
    if (path.startsWith('http')) return path;
    return `http://localhost:8080${path}`;
  }
}
