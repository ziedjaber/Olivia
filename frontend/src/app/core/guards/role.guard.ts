import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (requiredRoles: string[]) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (user && requiredRoles.includes(user.role)) {
    return true;
  }
  
  router.navigate(['/auth/login']);
  return false;
};
