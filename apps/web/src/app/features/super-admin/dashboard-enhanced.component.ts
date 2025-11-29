import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SuperAdminService, GlobalStats } from '../../core/services/super-admin.service';
import { AlertsService } from '../../core/services/alerts.service';
import { AlertsPanelComponent } from './alerts-panel.component';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartType,
  registerables,
} from 'chart.js';

// Enregistrer tous les composants Chart.js nécessaires
Chart.register(...registerables);

@Component({
  selector: 'bt-super-admin-dashboard-enhanced',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, RouterModule, BaseChartDirective, AlertsPanelComponent],
  template: `
    <div class="super-admin-dashboard">
      <div class="layout-toolbar">
        <button class="btn-refresh" (click)="loadStats()" [disabled]="loading">
          🔄 Actualiser
        </button>
      </div>
      <section class="dashboard-sections">
        <!-- Stats Cards -->
        <div class="stats-grid" *ngIf="stats">
          <div class="stat-card primary">
            <div class="stat-icon">🏢</div>
            <div class="stat-content">
              <h3>{{ stats.tenantsCount }}</h3>
              <p>Organisations</p>
              <div class="stat-details">
                <span class="badge success">{{ stats.activeTenantsCount }} actives</span>
                <span class="badge muted"
                  >{{ stats.tenantsCount - stats.activeTenantsCount }} inactives</span
                >
              </div>
            </div>
          </div>

          <div class="stat-card secondary">
            <div class="stat-icon">🎮</div>
            <div class="stat-content">
              <h3>{{ stats.totalEventsCount }}</h3>
              <p>Événements Total</p>
              <div class="stat-details">
                <span class="badge success">{{ stats.liveEventsCount }} en cours</span>
                <span class="badge muted"
                  >{{ stats.totalEventsCount - stats.liveEventsCount }} terminés</span
                >
              </div>
            </div>
          </div>

          <div class="stat-card accent">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <h3>{{ stats.totalPlayersCount }}</h3>
              <p>Joueurs</p>
              <div class="stat-details">
                <span class="badge info">Toutes organisations</span>
              </div>
            </div>
          </div>

          <div class="stat-card warning">
            <div class="stat-icon">👤</div>
            <div class="stat-content">
              <h3>{{ stats.totalUsersCount }}</h3>
              <p>Administrateurs</p>
              <div class="stat-details">
                <span class="badge info">Utilisateurs actifs</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Alerts Panel -->
        <bt-alerts-panel></bt-alerts-panel>

        <!-- Charts Section -->
        <div class="charts-section" *ngIf="stats">
          <div class="chart-container">
            <div class="chart-header">
              <h3>📊 Répartition des Organisations par Plan</h3>
            </div>
            <div class="chart-body">
              <canvas baseChart [data]="planChartData" [type]="'doughnut'" [options]="chartOptions">
              </canvas>
            </div>
          </div>

          <div class="chart-container">
            <div class="chart-header">
              <h3>📈 Statistiques Événements</h3>
            </div>
            <div class="chart-body">
              <canvas baseChart [data]="eventsChartData" [type]="'bar'" [options]="barChartOptions">
              </canvas>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="recent-activity" *ngIf="recentLogs.length > 0">
          <h3>🔔 Activité Récente</h3>
          <div class="activity-list">
            <div class="activity-item" *ngFor="let log of recentLogs.slice(0, 5)">
              <div class="activity-icon">
                {{ getActionIcon(log.action) }}
              </div>
              <div class="activity-content">
                <p class="activity-title">{{ getActionLabel(log.action) }}</p>
                <p class="activity-meta">
                  {{ log.admin?.email || 'Système' }} •
                  {{ formatDate(log.timestamp) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions-section">
          <h3>⚡ Actions Rapides</h3>
          <div class="quick-actions">
            <button class="action-btn primary" routerLink="/backstage/organizations">
              <span class="action-icon">🏢</span>
              <span class="action-label">Gérer les Organisations</span>
            </button>
            <button class="action-btn secondary" routerLink="/backstage/events">
              <span class="action-icon">🎮</span>
              <span class="action-label">Superviser les Événements</span>
            </button>
            <button class="action-btn accent" routerLink="/backstage/logs">
              <span class="action-icon">📋</span>
              <span class="action-label">Consulter les Logs</span>
            </button>
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
      </section>
    </div>
  `,
  styles: [
    `
      .super-admin-dashboard {
        background: transparent;
      }

      .layout-toolbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 1rem;
      }

      .btn-refresh {
        padding: 0.5rem 1rem;
        background: #667eea;
        border: 1px solid #667eea;
        border-radius: 6px;
        color: white;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s;
      }

      .btn-refresh:hover:not(:disabled) {
        background: #5a67d8;
      }

      .btn-refresh:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .dashboard-sections {
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
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
        display: flex;
        align-items: center;
        gap: 1rem;
        transition:
          transform 0.2s,
          box-shadow 0.2s;
        border-left: 4px solid #667eea;
      }

      .stat-card.primary {
        border-left-color: #667eea;
      }
      .stat-card.secondary {
        border-left-color: #48bb78;
      }
      .stat-card.accent {
        border-left-color: #ed8936;
      }
      .stat-card.warning {
        border-left-color: #f56565;
      }

      .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.12);
      }

      .stat-icon {
        font-size: 2.5rem;
        line-height: 1;
      }

      .stat-content {
        flex: 1;
      }

      .stat-content h3 {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
        color: #2d3748;
      }

      .stat-content p {
        margin: 0.25rem 0;
        color: #718096;
        font-size: 0.9rem;
      }

      .stat-details {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
        flex-wrap: wrap;
      }

      .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .badge.success {
        background: #c6f6d5;
        color: #22543d;
      }

      .badge.muted {
        background: #e2e8f0;
        color: #4a5568;
      }

      .badge.info {
        background: #bee3f8;
        color: #2c5282;
      }

      .charts-section {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .chart-container {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
      }

      .chart-header h3 {
        margin: 0 0 1rem 0;
        color: #2d3748;
        font-size: 1.1rem;
      }

      .chart-body {
        position: relative;
        height: 300px;
      }

      .recent-activity {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
        margin-bottom: 2rem;
      }

      .recent-activity h3 {
        margin: 0 0 1rem 0;
        color: #2d3748;
      }

      .activity-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .activity-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: #f7fafc;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .activity-item:hover {
        background: #edf2f7;
      }

      .activity-icon {
        font-size: 1.5rem;
      }

      .activity-content {
        flex: 1;
      }

      .activity-title {
        margin: 0;
        font-weight: 600;
        color: #2d3748;
      }

      .activity-meta {
        margin: 0.25rem 0 0 0;
        font-size: 0.85rem;
        color: #718096;
      }

      .quick-actions-section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
      }

      .quick-actions-section h3 {
        margin: 0 0 1rem 0;
        color: #2d3748;
      }

      .quick-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 1rem;
      }

      .action-btn.primary {
        background: #667eea;
      }
      .action-btn.secondary {
        background: #48bb78;
      }
      .action-btn.accent {
        background: #ed8936;
      }

      .action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .action-icon {
        font-size: 1.5rem;
      }

      .action-label {
        font-weight: 600;
      }

      .loading-state {
        text-align: center;
        padding: 3rem;
      }

      .spinner {
        border: 4px solid #e2e8f0;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .error-state {
        text-align: center;
        padding: 2rem;
        background: #fed7d7;
        border-radius: 8px;
        color: #c53030;
      }

      .btn-retry {
        margin-top: 1rem;
        padding: 0.75rem 1.5rem;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
      }

      @media (max-width: 768px) {
        .stats-grid {
          grid-template-columns: 1fr;
        }

        .charts-section {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SuperAdminDashboardEnhancedComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  stats: GlobalStats | null = null;
  admin: any = null;
  loading = false;
  error = '';
  recentLogs: any[] = [];
  tenants: any[] = [];

  // Chart configurations
  planChartData: ChartData<'doughnut'> = {
    labels: ['DEMO', 'PER_EVENT', 'MONTHLY'],
    datasets: [
      {
        data: [1, 0, 2],
        backgroundColor: ['#667eea', '#48bb78', '#ed8936'],
        borderWidth: 0,
      },
    ],
  };

  eventsChartData: ChartData<'bar'> = {
    labels: ['Total', 'En cours', 'Terminés'],
    datasets: [
      {
        label: 'Événements',
        data: [13, 13, 0],
        backgroundColor: '#667eea',
        borderRadius: 6,
      },
    ],
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  constructor(
    private superAdminService: SuperAdminService,
    private alertsService: AlertsService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.admin = this.superAdminService.getAdmin();
    this.loadStats();
    this.loadRecentLogs();
    this.loadTenants();

    // Simuler des alertes pour la démo (à retirer en production)
    setTimeout(() => {
      this.alertsService.simulateAlerts();
    }, 2000);
  }

  loadTenants(): void {
    this.superAdminService.getAllTenants().subscribe({
      next: (tenants) => {
        this.tenants = tenants;
        // Vérifier automatiquement les alertes
        if (this.stats) {
          this.alertsService.checkAutoAlerts(this.stats, tenants);
        }
      },
      error: (err) => console.error('Erreur chargement tenants:', err),
    });
  }

  loadStats(): void {
    this.loading = true;
    this.error = '';

    this.superAdminService.getGlobalStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.updateCharts();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des statistiques';
        this.loading = false;
        console.error(err);
      },
    });
  }

  loadRecentLogs(): void {
    this.superAdminService.getAuditLogs({ limit: 10 }).subscribe({
      next: (logs) => {
        this.recentLogs = logs;
      },
      error: (err) => console.error('Erreur chargement logs:', err),
    });
  }

  updateCharts(): void {
    if (!this.stats) return;

    // Update events chart
    this.eventsChartData = {
      labels: ['Total', 'En cours', 'Terminés'],
      datasets: [
        {
          label: 'Événements',
          data: [
            this.stats.totalEventsCount,
            this.stats.liveEventsCount,
            this.stats.totalEventsCount - this.stats.liveEventsCount,
          ],
          backgroundColor: '#667eea',
          borderRadius: 6,
        },
      ],
    };
  }

  logout(): void {
    this.superAdminService.logout();
    this.router.navigate(['/backstage/login']);
  }

  getActionIcon(action: string): string {
    const icons: { [key: string]: string } = {
      login: '🔐',
      suspend_tenant: '⏸️',
      reactivate_tenant: '▶️',
      update_plan: '📝',
      delete_tenant: '🗑️',
      create_tenant: '➕',
    };
    return icons[action] || '📋';
  }

  getActionLabel(action: string): string {
    const labels: { [key: string]: string } = {
      login: 'Connexion au super-admin',
      suspend_tenant: "Suspension d'organisation",
      reactivate_tenant: "Réactivation d'organisation",
      update_plan: 'Modification du plan',
      delete_tenant: "Suppression d'organisation",
      create_tenant: "Création d'organisation",
    };
    return labels[action] || action;
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  }
}
