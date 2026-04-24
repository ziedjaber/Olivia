import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpBackend, HttpHeaders } from '@angular/common/http';
import { Observable, tap, from, switchMap, of } from 'rxjs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';

// TODO: Replace with your actual Firebase config from Firebase Console
// Project Settings > General > Your apps > Web apps
const firebaseConfig = {
  apiKey: "AIzaSyD5kS2u6WXDitIlP_451quH4V9pqbhuX7M",
  authDomain: "olivia-4339f.firebaseapp.com",
  projectId: "olivia-4339f",
  storageBucket: "olivia-4339f.firebasestorage.app",
  messagingSenderId: "246023736485",
  appId: "1:246023736485:web:ab81aa122a50a8f52f114c",
  measurementId: "G-JZY1BD1S6X"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  password?: string;
  active: boolean;
}

export interface AuthResponse {
  id: string;
  token: string;
  email: string;
  fullName: string;
  role: string;
  active: boolean;
  avatarUrl?: string;
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

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    const email = credentials.email.toLowerCase();
    // 1. Sign in with Firebase SDK on the frontend
    return from(signInWithEmailAndPassword(auth, email, credentials.password)).pipe(
      // 2. Get the IdToken
      switchMap(userCredential => from(userCredential.user.getIdToken())),
      // 3. Send the token to the backend in a JSON object for better compatibility
      switchMap(token => this.http.post<AuthResponse>(`${this.apiUrl}/login`, { idToken: token }).pipe(
        tap(res => {
          console.log('[Auth] Backend Login Response:', res);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('token', res.token);
            const user: User = { 
              id: res.id, 
              email: res.email, 
              fullName: res.fullName, 
              role: res.role,
              active: res.active,
              avatarUrl: res.avatarUrl
            };
            console.log('[Auth] User object constructed for storage:', user);
            localStorage.setItem('user', JSON.stringify(user));
            this.currentUser.set(user);
          }
        })
      ))
    );
  }

  register(userData: any): Observable<any> {
    const normalizedData = { ...userData, email: userData.email.toLowerCase() };
    // Registration still happens on the backend so we can set Custom Claims and Firestore profile
    return this.http.post(`${this.apiUrl}/register`, normalizedData);
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
    return !!this.getToken();
  }

  getAvatarUrl(path: string | undefined): string {
    if (!path) return 'https://ui-avatars.com/api/?name=User&background=random&color=fff&size=512';
    if (path.startsWith('http')) return path;
    return `http://localhost:8080${path}`;
  }
}
