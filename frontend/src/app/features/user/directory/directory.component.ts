import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService, User } from '../../../core/services/auth.service';
import { ChatService } from '../../chat/services/chat';
import { ToastService } from '../../../core/services/toast.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-user-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './directory.component.html',
  animations: [
    trigger('listAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class UserDirectoryComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  searchQuery = '';
  loading = signal(true);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        // Exclude current user from directory
        const currentUserId = this.authService.currentUser()?.id;
        const list = data.filter(u => u.id !== currentUserId && u.active);
        this.users.set(list);
        this.applyFilter();
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastService.show("Erreur lors du chargement de l'annuaire.", "error");
        this.loading.set(false);
      }
    });
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredUsers.set(this.users());
    } else {
      const filtered = this.users().filter(u => 
        u.fullName.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) ||
        (u.role?.toLowerCase().includes(q) || false)
      );
      this.filteredUsers.set(filtered);
    }
  }

  onStartChat(user: User) {
    this.chatService.startConversation(user.id).subscribe({
      next: () => {
        this.chatService.setChatOpen(true);
      },
      error: () => this.toastService.show("Impossible de démarrer la discussion.", "error")
    });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'DIRECTEUR': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'RESPONSABLE_LOGISTIQUE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CHEF_EQUIPE_RECOLTE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'OLEICULTEUR': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }
}
