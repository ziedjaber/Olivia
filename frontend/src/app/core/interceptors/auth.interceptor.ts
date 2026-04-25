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

    // Get fresh token from Firebase
    const currentUser = auth.currentUser;
    
    // Force refresh the token to ensure it's valid for administrative actions
    const tokenObservable = currentUser 
      ? from(getIdToken(currentUser, true)) 
      : of(localStorage.getItem('token'));

    return tokenObservable.pipe(
      switchMap(token => {
        if (token) {
          console.log('[AuthInterceptor] Attaching fresh token to request:', req.url);
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
