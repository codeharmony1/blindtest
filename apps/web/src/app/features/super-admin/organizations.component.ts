import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SuperAdminService, Tenant } from '../../core/services/super-admin.service';

@Component({
  selector: 'bt-super-admin-organizations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-content">
      <div class="content-header">
        <div>
          <h1>🏢 Gestion des Organisations</h1>
          <p>{{ tenants.length }} organisation{{ tenants.length > 1 ? 's' : '' }} au total</p>
        </div>
      </div>
      <div class="filters-bar">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (input)="applyFilters()"
          placeholder="Rechercher une organisation..."
          class="search-input"
        />

        <select [(ngModel)]="filterStatus" (change)="applyFilters()" class="filter-select">
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="EXPIRED">Expiré</option>
          <option value="CANCELLED">Annulé</option>
        </select>

        <select [(ngModel)]="filterPlan" (change)="applyFilters()" class="filter-select">
          <option value="">Tous les plans</option>
          <option value="DEMO">DEMO</option>
          <option value="PER_EVENT">Par événement</option>
          <option value="MONTHLY">Mensuel</option>
        </select>
      </div>

      <div class="loading" *ngIf="loading">Chargement...</div>
      <div class="error" *ngIf="error">{{ error }}</div>

      <div class="tenants-grid" *ngIf="!loading && !error">
        <div class="tenant-card" *ngFor="let tenant of tenants">
          <div class="tenant-header">
            <h3>{{ tenant.name }}</h3>
            <span class="tenant-status" [class.active]="tenant.is_active">
              {{ tenant.is_active ? 'Actif' : 'Inactif' }}
            </span>
          </div>

          <div class="tenant-info">
            <div class="info-row">
              <span class="label">Email:</span>
              <span>{{ tenant.billing_email }}</span>
            </div>
            <div class="info-row">
              <span class="label">Plan:</span>
              <span class="plan-badge">{{ tenant.subscription_plan }}</span>
            </div>
            <div class="info-row">
              <span class="label">Créé le:</span>
              <span>{{ tenant.created_at | date: 'dd/MM/yyyy' }}</span>
            </div>
          </div>

          <div class="tenant-stats" *ngIf="tenant.stats">
            <div class="stat-item">
              <strong>{{ tenant.stats.usersCount }}</strong>
              <span>Utilisateurs</span>
            </div>
            <div class="stat-item">
              <strong>{{ tenant.stats.eventsCount }}</strong>
              <span>Événements</span>
            </div>
            <div class="stat-item">
              <strong>{{ tenant.stats.activeEventsCount }}</strong>
              <span>Actifs</span>
            </div>
          </div>

          <div class="tenant-actions">
            <button
              class="btn-action btn-impersonate"
              (click)="impersonateTenant(tenant)"
              *ngIf="tenant.is_active"
            >
              🔐 Se connecter en tant que
            </button>
            <button
              class="btn-action btn-suspend"
              *ngIf="tenant.is_active"
              (click)="suspendTenant(tenant)"
            >
              ⏸️ Suspendre
            </button>
            <button
              class="btn-action btn-reactivate"
              *ngIf="!tenant.is_active"
              (click)="reactivateTenant(tenant)"
            >
              ▶️ Réactiver
            </button>
            <button class="btn-action btn-plan" (click)="changePlan(tenant)">
              📋 Changer plan
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page-content {
        padding: 0; /* layout already provides padding and max-width */
      }

      .content-header {
        margin-bottom: 1.5rem;
      }

      .content-header h1 {
        margin: 0 0 0.25rem 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: #2d3748;
      }

      .content-header p {
        margin: 0;
        color: #718096;
      }

      .filters-bar {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .search-input {
        flex: 1;
        padding: 0.75rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
      }

      .filter-select {
        padding: 0.75rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
        background: white;
        min-width: 150px;
      }

      .tenants-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;
      }

      .tenant-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: all 0.3s;
      }

      .tenant-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      }

      .tenant-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 1rem;
      }

      .tenant-header h3 {
        margin: 0;
        color: #2d3748;
        font-size: 1.25rem;
      }

      .tenant-status {
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 600;
        background: #fed7d7;
        color: #c53030;
      }

      .tenant-status.active {
        background: #c6f6d5;
        color: #22543d;
      }

      .tenant-info {
        margin-bottom: 1rem;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f7fafc;
      }

      .label {
        font-weight: 600;
        color: #718096;
      }

      .plan-badge {
        padding: 0.25rem 0.5rem;
        background: #667eea;
        color: white;
        border-radius: 4px;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .tenant-stats {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: #f7fafc;
        border-radius: 8px;
        margin-bottom: 1rem;
      }

      .stat-item {
        flex: 1;
        text-align: center;
      }

      .stat-item strong {
        display: block;
        font-size: 1.5rem;
        color: #2d3748;
      }

      .stat-item span {
        font-size: 0.85rem;
        color: #718096;
      }

      .tenant-actions {
        display: flex;
        gap: 0.5rem;
      }

      .btn-action {
        flex: 1;
        padding: 0.5rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.2s;
      }

      .btn-suspend {
        background: #fed7d7;
        color: #c53030;
      }

      .btn-reactivate {
        background: #c6f6d5;
        color: #22543d;
      }

      .btn-plan {
        background: #bee3f8;
        color: #2c5282;
      }

      .btn-impersonate {
        background: #faf089;
        color: #744210;
        font-weight: 600;
      }

      .btn-impersonate:hover {
        background: #f6e05e;
      }

      .loading,
      .error {
        text-align: center;
        padding: 3rem;
      }

      @media (max-width: 768px) {
        .filters-bar {
          flex-direction: column;
        }

        .tenants-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SuperAdminOrganizationsComponent implements OnInit {
  tenants: Tenant[] = [];
  loading = false;
  error = '';
  searchQuery = '';
  filterStatus = '';
  filterPlan = '';

  constructor(
    private superAdminService: SuperAdminService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.superAdminService.isAuthenticated()) {
      this.router.navigate(['/backstage/login']);
      return;
    }
    this.loadTenants();
  }

  loadTenants(): void {
    this.loading = true;
    this.error = '';

    this.superAdminService.getAllTenants().subscribe({
      next: (tenants) => {
        this.tenants = tenants;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading tenants', err);
        this.error = 'Erreur lors du chargement';
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.loading = true;
    this.superAdminService
      .getAllTenants({
        status: this.filterStatus || undefined,
        plan: this.filterPlan || undefined,
        search: this.searchQuery || undefined,
      })
      .subscribe({
        next: (tenants) => {
          this.tenants = tenants;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  suspendTenant(tenant: Tenant): void {
    if (confirm(`Suspendre l'organisation "${tenant.name}" ?`)) {
      this.superAdminService.suspendTenant(tenant.id, 'Suspendu par admin').subscribe({
        next: () => {
          alert('Organisation suspendue');
          this.loadTenants();
        },
        error: (err) => alert('Erreur: ' + err.message),
      });
    }
  }

  reactivateTenant(tenant: Tenant): void {
    this.superAdminService.reactivateTenant(tenant.id).subscribe({
      next: () => {
        alert('Organisation réactivée');
        this.loadTenants();
      },
      error: (err) => alert('Erreur: ' + err.message),
    });
  }

  changePlan(tenant: Tenant): void {
    const newPlan = prompt(`Nouveau plan pour "${tenant.name}"?\nDEMO, PER_EVENT, MONTHLY`);
    if (newPlan && ['DEMO', 'PER_EVENT', 'MONTHLY'].includes(newPlan.toUpperCase())) {
      this.superAdminService.updateTenantPlan(tenant.id, newPlan.toUpperCase()).subscribe({
        next: () => {
          alert('Plan mis à jour');
          this.loadTenants();
        },
        error: (err) => alert('Erreur: ' + err.message),
      });
    }
  }

  impersonateTenant(tenant: Tenant): void {
    if (
      confirm(
        `Se connecter en tant que "${tenant.name}" ?\n\n⚠️ Vous allez accéder à leur interface d'administration avec leurs permissions.\nToutes vos actions seront enregistrées dans l'audit log.`,
      )
    ) {
      this.superAdminService.impersonateTenant(tenant.id).subscribe({
        next: (response) => {
          // Stocker le token d'impersonation et les infos (pour trace)
          localStorage.setItem('bt_impersonation_token', response.impersonationToken);
          localStorage.setItem('bt_impersonated_tenant', JSON.stringify(response.tenant));
          localStorage.setItem('bt_impersonated_user', JSON.stringify(response.user));

          // Copier dans les clés utilisées par l'application tenant normale
          localStorage.setItem('tenant_auth_token', response.impersonationToken);
          localStorage.setItem('tenant_user', JSON.stringify(response.user));
          localStorage.setItem('tenant_info', JSON.stringify(response.tenant));

          alert(
            `✅ ${response.warning}\n\nVous allez être redirigé vers l'interface d'administration de "${tenant.name}".`,
          );

          // Rediriger vers l'interface admin du tenant
          window.location.href = '/admin/dashboard';
        },
        error: (err) => {
          console.error('Impersonation error:', err);
          alert("Erreur lors de l'impersonation: " + (err.error?.message || err.message));
        },
      });
    }
  }
}
