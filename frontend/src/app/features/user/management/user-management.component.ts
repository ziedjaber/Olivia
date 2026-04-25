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
  isEditing = false;
  selectedUserId: string | null = null;

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

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  resetForm() {
    this.newUser = { email: '', password: '', fullName: '', role: 'OUVRIER_RECOLTE' };
    this.isEditing = false;
    this.selectedUserId = null;
  }

  onEditUser(user: User) {
    this.selectedUserId = user.id;
    this.newUser = {
      email: user.email,
      password: '', // We don't load the password
      fullName: user.fullName,
      role: (user.role as any) || 'OUVRIER_RECOLTE'
    };
    this.isEditing = true;
    this.showCreateForm = true;
    this.cdr.markForCheck();
  }

  onSubmitUser() {
    if (!this.newUser.email || (!this.isEditing && !this.newUser.password) || !this.newUser.fullName) {
      this.toastService.show('Please fill in all required fields', 'error');
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    if (this.isEditing && this.selectedUserId) {
      // Update
      const updatedUser: User = { 
        ...this.users.find(u => u.id === this.selectedUserId)!, 
        fullName: this.newUser.fullName,
        email: this.newUser.email,
        role: this.newUser.role as any
      };
      
      this.userService.updateUser(this.selectedUserId, updatedUser).subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.toastService.show('User updated successfully!', 'success');
            this.resetForm();
            this.showCreateForm = false;
            this.loadUsers();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.toastService.show('Failed to update user.', 'error');
            this.loading = false;
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      // Create
      this.userService.adminCreateUser(this.newUser).subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.toastService.show('User account created successfully!', 'success');
            this.showCreateForm = false;
            this.resetForm();
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
  }

  onDeleteUser(userId: string) {
    if (!confirm('Are you absolutely sure? This action cannot be undone.')) return;
    
    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.toastService.show('User deleted permanently.', 'success');
          this.loadUsers();
        });
      },
      error: () => this.toastService.show('Failed to delete user.', 'error')
    });
  }

  onRoleChange(user: User, newRole: string) {
    this.userService.updateRole(user.id, newRole).subscribe({
      next: () => {
        this.ngZone.run(() => {
          user.role = newRole as any;
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
