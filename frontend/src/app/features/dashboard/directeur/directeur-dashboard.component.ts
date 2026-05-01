import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CollecteService, Collecte } from '../../../core/services/collecte.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/services/auth.service';
import { ResourceOrderService, ResourceOrder } from '../../../core/services/resource-order.service';
import { DirecteurAnalyticsComponent } from './directeur-analytics.component';
import { DirectorLogisticsComponent } from './director-logistics.component';

@Component({
  selector: 'app-directeur-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DirecteurAnalyticsComponent,
    DirectorLogisticsComponent
  ],
  templateUrl: './directeur-dashboard.component.html'
})
export class DirecteurDashboardComponent implements OnInit {
  private collecteService = inject(CollecteService);
  private userService = inject(UserService);
  private http = inject(HttpClient);
  private resourceOrderService = inject(ResourceOrderService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  recentCollectes: Collecte[] = [];
  myOrders: ResourceOrder[] = [];
  workers: User[] = [];
  chefs: User[] = [];
  activeCollects = 0;
  matureCount = 0;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.collecteService.getCollectes().subscribe(data => {
      this.recentCollectes = (data || []).slice(0, 5);
      this.activeCollects = (data || []).filter(c => c.statut === 'en_cours').length;
      this.cdr.detectChanges();
    });

    this.resourceOrderService.getMyOrders().subscribe((orders: ResourceOrder[]) => {
      this.myOrders = (orders || []).slice(0, 10);
      this.cdr.detectChanges();
    });

    this.userService.getAllUsers().subscribe(users => {
      this.chefs = users.filter(u => u.role === 'CHEF_EQUIPE_RECOLTE');
      this.workers = users.filter(u => u.role === 'OUVRIER_RECOLTE');
      this.cdr.detectChanges();
    });

    this.http.get<any[]>('http://localhost:8080/api/vergers').subscribe(v => {
      this.matureCount = (v || []).filter(verger => verger.niveauMaturite >= 100).length;
      this.cdr.detectChanges();
    });
  }
}
