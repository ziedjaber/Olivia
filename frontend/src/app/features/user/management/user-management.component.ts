import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService, User } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  authService = inject(AuthService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  users: User[] = [];
  loading = false;
  showCreateForm = false;

  newUser = {
    email: '',
    password: '',
    fullName: '',
    role: 'OUVRIER_RECOLTE'
  };

  roles = [
    'DIRECTEUR',
    'RESPONSABLE_LOGISTIQUE',
    'CHEF_EQUIPE_RECOLTE',
    'OLEICULTEUR',
    'OUVRIER_RECOLTE'
  ];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.cdr.markForCheck();
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.users = data;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.toastService.show('Failed to load users. Permissions denied?', 'error');
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  onCreateUser() {
    if (!this.newUser.email || !this.newUser.password || !this.newUser.fullName) {
      this.toastService.show('Please fill in all fields', 'error');
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.userService.adminCreateUser(this.newUser).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.toastService.show('User account created successfully!', 'success');
          this.showCreateForm = false;
          this.newUser = { email: '', password: '', fullName: '', role: 'OUVRIER_RECOLTE' };
          this.loadUsers();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.toastService.show('Failed to create user. Email may already exist.', 'error');
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  onRoleChange(user: User, newRole: string) {
    this.userService.updateRole(user.id, newRole).subscribe({
      next: () => {
        this.ngZone.run(() => {
          user.role = newRole;
          this.toastService.show('Role updated successfully.', 'success');
          this.cdr.detectChanges();
        });
      },
      error: () => this.toastService.show('Failed to update role', 'error')
    });
  }

  onToggleStatus(user: User) {
    const newStatus = !user.active;
    this.userService.toggleStatus(user.id, newStatus).subscribe({
      next: () => {
        this.ngZone.run(() => {
          user.active = newStatus;
          this.toastService.show(newStatus ? 'Account reactivated.' : 'Account suspended.', newStatus ? 'success' : 'info');
          this.cdr.detectChanges();
        });
      },
      error: () => this.toastService.show('Failed to update user status', 'error')
    });
  }
}
