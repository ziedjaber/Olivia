import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  user = { email: '', password: '', fullName: '', role: 'OLEICULTEUR' };
  loading = false;
  message = '';
  success = false;

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    this.loading = true;
    this.message = '';
    this.authService.register(this.user).pipe(
      timeout(15000),
      catchError(err => {
        if (err.name === 'TimeoutError') {
          return throwError(() => new Error('Server took too long to respond. Please check your connection or try again.'));
        }
        return throwError(() => err);
      })
    ).subscribe({
      next: () => {
        this.success = true;
        this.message = 'Registration successful! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err: any) => {
        this.success = false;
        this.message = err.error || err.message || 'Error creating account. Please try again.';
        this.loading = false;
      }
    });
  }
}
