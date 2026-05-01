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
        this.error = 'Adresse e-mail ou mot de passe invalide';
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
        this.error = 'Echec de connexion Google. Veuillez reessayer.';
        this.loading = false;
      }
    });
  }

  onForgotPassword() {
    // Strategic trigger for automated credential recovery
    if (!this.credentials.email) {
      this.error = "Veuillez d'abord saisir votre adresse e-mail.";
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.authService.forgotPassword(this.credentials.email).subscribe({
      next: () => {
        alert('Un lien de recuperation securise a ete envoye a votre adresse e-mail.');
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Impossible de traiter la recuperation. Verifiez votre adresse e-mail.';
        this.loading = false;
      }
    });
  }

}
