import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  credentials = { email: '', password: '' };
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.loading = true;
    this.error = '';
    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        if (res.needsProfile) {
          this.router.navigate(['/auth/select-role']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.error = 'Invalid email or password';
        this.loading = false;
      }
    });
  }

  onGoogleLogin() {
    this.loading = true;
    this.error = '';
    this.authService.googleLogin().subscribe({
      next: (res) => {
        if (res.needsProfile) {
          this.router.navigate(['/auth/select-role']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.error = 'Google Sign-in failed. Please try again.';
        this.loading = false;
      }
    });
  }

  onForgotPassword() {
    // Strategic trigger for automated credential recovery
    if (!this.credentials.email) {
      this.error = 'Please enter your email address first.';
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.authService.forgotPassword(this.credentials.email).subscribe({
      next: () => {
        alert('A security recovery link has been dispatched to your email.');
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Could not process recovery. Verify your email.';
        this.loading = false;
      }
    });
  }

}
