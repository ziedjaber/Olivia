import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService, User } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  editUser: any = { fullName: '' };
  updating = false;
  toastService = inject(ToastService);

  constructor(public userService: UserService, public authService: AuthService) {}

  ngOnInit() {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.user = currentUser;
      this.editUser = { ...currentUser };
    }
  }

  onUpdate() {
    this.updating = true;
    this.userService.updateProfile(this.editUser).subscribe({
      next: () => {
        this.toastService.show('Digital identity updated successfully!', 'success');
        this.updating = false;
        this.user = { ...this.editUser };
        // Sync with global auth state
        this.authService.currentUser.set(this.user);
        // Also update localStorage
        localStorage.setItem('user', JSON.stringify(this.user));
      },
      error: (err) => {
        this.toastService.show('Failed to synchronize profile changes.', 'error');
        this.updating = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.toastService.show('Uploading new avatar...', 'info', 2000);
      this.userService.uploadAvatar(file).subscribe({
        next: (url) => {
          if (this.user) {
            this.toastService.show('Avatar synchronized.', 'success');
            this.user.avatarUrl = url;
            this.editUser.avatarUrl = url;
            // Sync with global auth state
            this.authService.currentUser.set({ ...this.user });
            // Also update localStorage
            localStorage.setItem('user', JSON.stringify(this.user));
          }
        },
        error: (err) => {
          this.toastService.show('Avatar upload failed.', 'error');
        }
      });
    }
  }

  onLogout() {
    this.authService.logout();
    window.location.reload();
  }
}
