import { HttpInterceptorFn } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { from, switchMap, of } from 'rxjs';
import { getIdToken } from 'firebase/auth';
import { auth } from '../config/firebase.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    // Bypass interceptor for external AI APIs
    if (req.url.includes('googleapis.com')) {
      return next(req);
    }

    // Wait for Firebase auth to finish restoring the session from storage,
    // THEN get the token. This prevents the race condition where currentUser
    // is null on the first few requests after page load.
    const tokenObservable = from(auth.authStateReady()).pipe(
      switchMap(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          return from(getIdToken(currentUser, false));
        }
        // Fallback: try localStorage token (for SSR or edge cases)
        const stored = localStorage.getItem('token');
        return of(stored);
      })
    );

    return tokenObservable.pipe(
      switchMap(token => {
        if (token) {
          // Keep localStorage in sync
          localStorage.setItem('token', token);
          const cloned = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          return next(cloned);
        } else {
          console.warn('[AuthInterceptor] No token available for request:', req.url);
          return next(req);
        }
      })
    );
  }

  return next(req);
};
