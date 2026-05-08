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
  user = { email: '', password: '', fullName: '', role: 'OUVRIER_RECOLTE' };
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
          return throwError(() => new Error('Le serveur met trop de temps a repondre. Verifiez votre connexion ou reessayez.'));
        }
        return throwError(() => err);
      })
    ).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.message = 'Inscription reussie ! Redirection vers la connexion...';
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err: any) => {
        this.success = false;
        this.message = err.error || err.message || 'Erreur lors de la creation du compte. Veuillez reessayer.';
        this.loading = false;
      }
    });
  }

  onGoogleSignUp() {
    this.loading = true;
    this.message = '';
    this.authService.googleLogin().subscribe({
      next: (res) => {
        if (res.needsProfile) {
          // Automation: Default to OUVRIER_RECOLTE as per requirements
          this.authService.completeSocialRegistration('OUVRIER_RECOLTE', res.fullName).subscribe({
            next: () => {
              this.router.navigate(['/dashboard']);
            },
            error: (err) => {
              this.message = 'Echec de finalisation du profil. Veuillez reessayer.';
              this.loading = false;
            }
          });
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.message = 'Echec de l\'inscription Google. Veuillez reessayer.';
        this.loading = false;
      }
    });
  }
}
