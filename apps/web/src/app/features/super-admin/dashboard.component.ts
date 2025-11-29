import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SuperAdminService, GlobalStats } from '../../core/services/super-admin.service';

@Component({
  selector: 'bt-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="super-admin-dashboard">
      <main class="dashboard-content">
        <div class="stats-grid" *ngIf="stats">
          <div class="stat-card">
            <div class="stat-icon">🏢</div>
            <div class="stat-content">
              <h3>{{ stats.tenantsCount }}</h3>
              <p>Organisations</p>
              <small>{{ stats.activeTenantsCount }} actives</small>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🎮</div>
            <div class="stat-content">
              <h3>{{ stats.totalEventsCount }}</h3>
              <p>Événements</p>
              <small>{{ stats.liveEventsCount }} en cours</small>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <h3>{{ stats.totalPlayersCount }}</h3>
              <p>Joueurs Connectés</p>
              <small>En temps réel</small>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">👤</div>
            <div class="stat-content">
              <h3>{{ stats.totalUsersCount }}</h3>
              <p>Utilisateurs</p>
              <small>Total admins</small>
            </div>
          </div>
        </div>

        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Chargement des statistiques...</p>
        </div>

        <div class="error-state" *ngIf="error">
          <p>❌ {{ error }}</p>
          <button class="btn-retry" (click)="loadStats()">Réessayer</button>
        </div>

        <div class="welcome-section">
          <h2>Bienvenue sur le panneau d'administration</h2>
          <p>
            Vous avez accès à toutes les fonctionnalités de gestion de la plateforme. Utilisez le
            menu ci-dessus pour naviguer entre les différentes sections.
          </p>

          <div class="quick-actions">
            <button class="action-btn" routerLink="/backstage/organizations">
              <span class="action-icon">🏢</span>
              <span class="action-label">Gérer les Organisations</span>
            </button>
            <button class="action-btn" routerLink="/backstage/events">
              <span class="action-icon">🎮</span>
              <span class="action-label">Superviser les Événements</span>
            </button>
            <button class="action-btn" routerLink="/backstage/logs">
              <span class="action-icon">📋</span>
              <span class="action-label">Consulter les Logs</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .dashboard-content {
        /* Spacing and width handled by layout */
        padding: 0;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        gap: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: all 0.3s;
      }

      .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      }

      .stat-icon {
        font-size: 2.5rem;
      }

      .stat-content h3 {
        margin: 0;
        font-size: 2rem;
        color: #2d3748;
        font-weight: 700;
      }

      .stat-content p {
        margin: 0.25rem 0;
        color: #4a5568;
        font-weight: 500;
      }

      .stat-content small {
        color: #a0aec0;
        font-size: 0.85rem;
      }

      .loading-state {
        text-align: center;
        padding: 3rem;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e2e8f0;
        border-top-color: #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .error-state {
        text-align: center;
        padding: 3rem;
        color: #e53e3e;
      }

      .btn-retry {
        padding: 0.75rem 1.5rem;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        margin-top: 1rem;
      }

      .welcome-section {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .welcome-section h2 {
        margin: 0 0 1rem 0;
        color: #2d3748;
        font-size: 1.5rem;
      }

      .welcome-section p {
        color: #718096;
        margin: 0 0 2rem 0;
        line-height: 1.6;
      }

      .quick-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 1.5rem;
        background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s;
      }

      .action-btn:hover {
        border-color: #667eea;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
      }

      .action-icon {
        font-size: 2rem;
      }

      .action-label {
        font-weight: 600;
        color: #2d3748;
      }

      @media (max-width: 768px) {
        .header-content {
          flex-direction: column;
          gap: 1rem;
          text-align: center;
        }

        .dashboard-nav {
          overflow-x: auto;
          padding: 0 1rem;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .quick-actions {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SuperAdminDashboardComponent implements OnInit {
  stats: GlobalStats | null = null;
  admin: any = null;
  loading = false;
  error = '';

  constructor(
    private superAdminService: SuperAdminService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Vérifier l'authentification
    if (!this.superAdminService.isAuthenticated()) {
      this.router.navigate(['/backstage/login']);
      return;
    }

    this.admin = this.superAdminService.getAdmin();
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = '';

    this.superAdminService.getGlobalStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading stats', err);
        this.error = 'Impossible de charger les statistiques';
        this.loading = false;
      },
    });
  }

  logout(): void {
    this.superAdminService.logout();
    this.router.navigate(['/backstage/login']);
  }
}
