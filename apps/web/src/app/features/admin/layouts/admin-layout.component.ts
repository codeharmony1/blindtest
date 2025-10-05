import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TenantAuthService, TenantUser, Tenant } from '../../../core/services/tenant-auth.service';
import { SuperAdminService } from '../../../core/services/super-admin.service';

@Component({
  selector: 'bt-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-layout">
      <!-- Header -->
      <header class="admin-header">
        <div class="header-content">
          <h1 class="header-title">
            <span class="header-icon">⚙️</span>
            Administration Blind Test
          </h1>
          <div class="header-actions">
            <div class="tenant-info" *ngIf="currentTenant">
              <div class="tenant-details">
                <span class="tenant-name">{{ currentTenant.name }}</span>
                <span class="tenant-plan">{{ currentTenant.plan }}</span>
              </div>
              <span class="user-email" *ngIf="currentUser">{{ currentUser.email }}</span>
            </div>
            <a routerLink="/dj/DEMO" class="btn btn-secondary"> 🎧 Interface DJ </a>
            <a routerLink="/join/DEMO" class="btn btn-secondary"> 🎮 Interface Joueur </a>
            <button class="btn btn-outline" (click)="logout()">
              <span>🚪</span>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <!-- Bandeau d'impersonation -->
      <div class="impersonation-banner" *ngIf="isImpersonated">
        <div class="impersonation-content">
          <span class="impersonation-icon">🔒</span>
          <span class="impersonation-text">
            Mode Impersonation - Connecté en tant que <strong>{{ impersonatedTenantName }}</strong>
          </span>
          <button class="btn-exit-impersonation" (click)="exitImpersonation()">
            Quitter le mode impersonation
          </button>
        </div>
      </div>

      <div class="admin-body">
        <!-- Sidebar -->
        <aside class="admin-sidebar">
          <nav class="sidebar-nav">
            <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">📊</span>
              <span class="nav-label">Dashboard</span>
            </a>
            <a routerLink="/admin/events" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">🎪</span>
              <span class="nav-label">Événements</span>
            </a>
            <div class="nav-divider"></div>
            <div class="nav-section">
              <span class="nav-section-title">Gestion</span>
              <a routerLink="/admin/rounds" routerLinkActive="active" class="nav-item nav-sub">
                <span class="nav-icon">🎵</span>
                <span class="nav-label">Rounds</span>
              </a>
              <a routerLink="/admin/billing" routerLinkActive="active" class="nav-item nav-sub">
                <span class="nav-icon">💳</span>
                <span class="nav-label">Mon Abonnement</span>
              </a>
            </div>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="admin-main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-layout {
        height: 100vh;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        font-family: 'Inter', sans-serif;
      }

      /* Impersonation Banner */
      .impersonation-banner {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: #78350f;
        padding: 0.75rem 0;
        border-bottom: 2px solid #d97706;
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.9; }
      }

      .impersonation-content {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 2rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        justify-content: center;
      }

      .impersonation-icon {
        font-size: 1.5rem;
      }

      .impersonation-text {
        font-weight: 500;
        font-size: 0.95rem;
      }

      .impersonation-text strong {
        font-weight: 700;
      }

      .btn-exit-impersonation {
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.9);
        color: #78350f;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        margin-left: auto;
      }

      .btn-exit-impersonation:hover {
        background: white;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      /* Header */
      .admin-header {
        background: white;
        border-bottom: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
      }

      .header-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }

      .header-icon {
        font-size: 1.75rem;
      }

      .header-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .tenant-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        margin-right: 1rem;
      }

      .tenant-details {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .tenant-name {
        font-weight: 600;
        color: #1f2937;
        font-size: 0.9rem;
      }

      .tenant-plan {
        background: linear-gradient(135deg, #22d3ee, #a855f7);
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .user-email {
        color: #6b7280;
        font-size: 0.8rem;
      }

      .btn {
        padding: 0.5rem 1rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.875rem;
        transition: all 0.2s ease;
        border: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn-secondary {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #cbd5e1;
      }

      .btn-secondary:hover {
        background: #e2e8f0;
        border-color: #94a3b8;
      }

      .btn-outline {
        background: transparent;
        color: #6b7280;
        border: 1px solid #d1d5db;
      }

      .btn-outline:hover {
        background: #f9fafb;
        border-color: #9ca3af;
        color: #374151;
      }

      /* Body Layout */
      .admin-body {
        display: flex;
        height: calc(100vh - 80px);
      }

      /* Sidebar */
      .admin-sidebar {
        width: 260px;
        background: white;
        border-right: 1px solid #e2e8f0;
        overflow-y: auto;
      }

      .sidebar-nav {
        padding: 1.5rem 1rem;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        text-decoration: none;
        color: #64748b;
        font-weight: 500;
        transition: all 0.2s ease;
        margin-bottom: 0.25rem;
      }

      .nav-item:hover {
        background: #f8fafc;
        color: #374151;
      }

      .nav-item.active {
        background: #3b82f6;
        color: white;
      }

      .nav-icon {
        font-size: 1.125rem;
        width: 20px;
        text-align: center;
      }

      .nav-label {
        font-size: 0.875rem;
      }

      .nav-divider {
        height: 1px;
        background: #e2e8f0;
        margin: 1rem 0;
      }

      .nav-section {
        margin-bottom: 1rem;
      }

      .nav-section-title {
        display: block;
        padding: 0.5rem 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .nav-sub {
        margin-left: 1rem;
        padding-left: 0.75rem;
      }

      /* Main Content */
      .admin-main {
        flex: 1;
        padding: 2rem;
        overflow-y: auto;
        background: #f8fafc;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .admin-sidebar {
          width: 200px;
        }

        .admin-main {
          padding: 1rem;
        }

        .header-content {
          padding: 1rem;
          flex-direction: column;
          gap: 1rem;
        }
      }

      @media (max-width: 640px) {
        .admin-sidebar {
          display: none;
        }

        .header-actions {
          flex-direction: column;
          width: 100%;
        }
      }
    `,
  ],
})
export class AdminLayoutComponent implements OnInit {
  currentUser: TenantUser | null = null;
  currentTenant: Tenant | null = null;
  isImpersonated = false;
  impersonatedTenantName = '';

  constructor(
    private authService: TenantAuthService,
    private superAdminService: SuperAdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.authService.currentTenant$.subscribe(tenant => {
      this.currentTenant = tenant;
    });

    // Vérifier si on est en mode impersonation
    this.checkImpersonationMode();
  }

  checkImpersonationMode(): void {
    const impersonationToken = localStorage.getItem('bt_impersonation_token');
    const impersonatedTenant = localStorage.getItem('bt_impersonated_tenant');

    if (impersonationToken && impersonatedTenant) {
      this.isImpersonated = true;
      const tenant = JSON.parse(impersonatedTenant);
      this.impersonatedTenantName = tenant.name;
    }
  }

  exitImpersonation(): void {
    if (confirm('Quitter le mode impersonation et retourner au panneau super-admin ?')) {
      // Supprimer les données d'impersonation
      localStorage.removeItem('bt_impersonation_token');
      localStorage.removeItem('bt_impersonated_tenant');
      localStorage.removeItem('bt_impersonated_user');

      // Appeler l'API pour logger la sortie
      this.superAdminService.exitImpersonation().subscribe({
        next: () => {
          // Rediriger vers le dashboard super-admin
          window.location.href = '/backstage/dashboard';
        },
        error: (err) => {
          console.error('Exit impersonation error:', err);
          // Rediriger quand même
          window.location.href = '/backstage/dashboard';
        }
      });
    }
  }

  logout(): void {
    // Si en mode impersonation, on quitte d'abord
    if (this.isImpersonated) {
      this.exitImpersonation();
    } else {
      this.authService.logout();
    }
  }
}
