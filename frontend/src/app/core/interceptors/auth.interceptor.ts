// // import { HttpInterceptorFn } from '@angular/common/http';
// // import { isPlatformBrowser } from '@angular/common';
// // import { inject, PLATFORM_ID } from '@angular/core';

// // export const authInterceptor: HttpInterceptorFn = (req, next) => {
// //   const platformId = inject(PLATFORM_ID);

// //   if (isPlatformBrowser(platformId)) {
// //     const token = localStorage.getItem('token');
// //     if (token) {
// //       console.log('[AuthInterceptor] Attaching token to request:', req.url);
// //       const cloned = req.clone({
// //         setHeaders: {
// //           Authorization: `Bearer ${token}`
// //         }
// //       });
// //       return next(cloned);
// //     } else {
// //       console.warn('[AuthInterceptor] No token found in localStorage for request:', req.url);
// //     }
// //   }

// //   return next(req);
// // };


// import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { from, switchMap } from 'rxjs';
// import { getAuth } from 'firebase/auth';
// import { AuthService } from '../services/auth.service';

// export const authInterceptor: HttpInterceptorFn = (
//   req: HttpRequest<unknown>,
//   next: HttpHandlerFn
// ) => {
//   const authService = inject(AuthService);
//   const firebaseAuth = getAuth();
//   const firebaseUser = firebaseAuth.currentUser;

//   // si pas d'utilisateur Firebase connecté, on envoie sans token
//   if (!firebaseUser) {
//     const token = authService.getToken();
//     if (token) {
//       console.log('[AuthInterceptor] Attaching token to request:', req.url);
//       const cloned = req.clone({
//         setHeaders: { Authorization: `Bearer ${token}` }
//       });
//       return next(cloned);
//     }
//     return next(req);
//   }

//   // on force le refresh du token Firebase avant chaque requête
//   return from(firebaseUser.getIdToken(false)).pipe(
//     switchMap(freshToken => {
//       console.log('[AuthInterceptor] Attaching fresh token to request:', req.url);

//       // on met à jour le localStorage avec le token frais
//       localStorage.setItem('token', freshToken);

//       const cloned = req.clone({
//         setHeaders: { Authorization: `Bearer ${freshToken}` }
//       });
//       return next(cloned);
//     })
//   );
// };

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { getAuth } from 'firebase/auth';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);

  const attachToken = (token: string) => {
    console.log('[AuthInterceptor] Attaching fresh token to request:', req.url);
    return next(req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    }));
  };

  // ne pas intercepter les requêtes Firebase elles-mêmes
  if (req.url.includes('googleapis.com') ||
    req.url.includes('firebaseio.com') ||
    req.url.includes('securetoken.google')) {
    return next(req);
  }

  const firebaseUser = getAuth().currentUser;

  if (!firebaseUser) {
    const token = authService.getToken();
    if (token) return attachToken(token);
    return next(req);
  }

  // getIdToken(false) = depuis le cache Firebase si pas expiré
  // getIdToken(true)  = force un appel réseau pour rafraîchir
  return from(firebaseUser.getIdToken(false)).pipe(
    switchMap(token => {
      localStorage.setItem('token', token);
      return attachToken(token);
    }),
    catchError(() => {
      // token expiré ET pas d'internet → fallback localStorage
      console.warn('[AuthInterceptor] Token expiré, fallback localStorage');
      const token = authService.getToken();
      if (token) return attachToken(token);
      return next(req);
    })
  );
};