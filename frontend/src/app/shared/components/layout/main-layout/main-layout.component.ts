import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { ToastComponent } from '../../ui/toast/toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, NavbarComponent, ToastComponent],
  template: `
    <div class="min-h-screen bg-background text-on-background antialiased flex">
      <app-sidebar></app-sidebar>
      <div class="flex-grow min-h-screen pl-64 transition-all duration-300">
        <app-navbar></app-navbar>
        <main class="pt-16 p-8">
          <router-outlet></router-outlet>
        </main>
      </div>
      <app-toast></app-toast>
    </div>
  `
})
export class MainLayoutComponent {}
