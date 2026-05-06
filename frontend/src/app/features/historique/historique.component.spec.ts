import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoriqueComponent } from './historique.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuditService } from '../../services/audit.service';
import { of } from 'rxjs';

describe('HistoriqueComponent', () => {
  let component: HistoriqueComponent;
  let fixture: ComponentFixture<HistoriqueComponent>;
  let auditService: AuditService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriqueComponent, HttpClientTestingModule],
      providers: [AuditService]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoriqueComponent);
    component = fixture.componentInstance;
    auditService = TestBed.inject(AuditService);
    
    // Default mock for auditService
    vi.spyOn(auditService, 'getAll').mockReturnValue(of([]));
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display empty state when no logs', () => {
    component.isLoading = false;
    component.filteredLogs = [];
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.historique__card')).toBeNull();
    expect(compiled.textContent).toContain('Aucune action enregistrée');
  });
});
