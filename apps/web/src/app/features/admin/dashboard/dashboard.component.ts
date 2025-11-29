import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../../core/services/api.service';

interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalRounds: number;
  totalSongs: number;
  totalTeams: number;
}

interface RecentEvent {
  id: string;
  code: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  gameMode: 'TEAM' | 'SOLO';
  created_at: string;
  roundCount?: number;
  teamCount?: number;
}

@Component({
  selector: 'bt-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, HttpClientModule],
  template: `
    <div class="dashboard">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-description">Vue d'ensemble de votre plateforme de blind test</p>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2 class="section-title">Actions rapides</h2>
        <div class="actions-grid">
          <a routerLink="/admin/events/new" class="action-card action-primary">
            <span class="action-icon">➕</span>
            <div class="action-content">
              <h3>Nouvel Événement</h3>
              <p>Créer un nouveau blind test</p>
            </div>
          </a>
          <a routerLink="/admin/events" class="action-card">
            <span class="action-icon">🎪</span>
            <div class="action-content">
              <h3>Gérer les Événements</h3>
              <p>Voir tous les événements</p>
            </div>
          </a>
          <a
            [routerLink]="firstEventCode ? '/dj/' + firstEventCode : '/admin/events'"
            class="action-card"
            [class.disabled]="!firstEventCode"
          >
            <span class="action-icon">🎧</span>
            <div class="action-content">
              <h3>Interface DJ</h3>
              <p>{{ getDjActionText() }}</p>
            </div>
          </a>
          <a
            [routerLink]="firstEventCode ? '/display/' + firstEventCode : '/admin/events'"
            class="action-card"
            [class.disabled]="!firstEventCode"
          >
            <span class="action-icon">🖥️</span>
            <div class="action-content">
              <h3>Interface Affichage</h3>
              <p>{{ getDisplayActionText() }}</p>
            </div>
          </a>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-section">
        <h2 class="section-title">Statistiques</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🎪</div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.totalEvents }}</div>
              <div class="stat-label">Événements Total</div>
            </div>
          </div>
          <div class="stat-card stat-success">
            <div class="stat-icon">🟢</div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.activeEvents }}</div>
              <div class="stat-label">Événements Actifs</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎵</div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.totalRounds }}</div>
              <div class="stat-label">Rounds Totaux</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎶</div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.totalSongs }}</div>
              <div class="stat-label">Chansons</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.totalTeams }}</div>
              <div class="stat-label">Équipes</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Events -->
      <div class="recent-section">
        <div class="section-header">
          <h2 class="section-title">Événements Récents</h2>
          <a routerLink="/admin/events" class="section-link">Voir tous →</a>
        </div>
        <div class="recent-grid">
          <!-- Liste des événements récents -->
          <div class="event-card" *ngFor="let event of recentEvents">
            <div class="event-header">
              <div class="event-info">
                <h3 class="event-title">{{ event.name }}</h3>
                <p class="event-code">Code: {{ event.code }}</p>
              </div>
              <div
                class="event-status"
                [class.status-active]="event.status === 'ACTIVE'"
                [class.status-draft]="event.status === 'DRAFT'"
                [class.status-completed]="event.status === 'COMPLETED'"
              >
                {{ getStatusLabel(event.status) }}
              </div>
            </div>
            <div class="event-stats">
              <div class="event-stat">
                <span class="stat-icon">🎮</span>
                <span>{{ event.gameMode === 'TEAM' ? 'Mode Équipe' : 'Mode Solo' }}</span>
              </div>
              <div class="event-stat" *ngIf="event.roundCount !== undefined">
                <span class="stat-icon">🎵</span>
                <span>{{ event.roundCount }} Round{{ event.roundCount > 1 ? 's' : '' }}</span>
              </div>
              <div class="event-stat" *ngIf="event.teamCount !== undefined && event.gameMode === 'TEAM'">
                <span class="stat-icon">👥</span>
                <span>{{ event.teamCount }} Équipe{{ event.teamCount > 1 ? 's' : '' }}</span>
              </div>
            </div>
            <div class="event-actions">
              <a [routerLink]="'/dj/' + event.code" class="btn btn-sm btn-primary"> 🎧 Contrôler </a>
              <a [routerLink]="'/display/' + event.code" class="btn btn-sm btn-secondary">
                🖥️ Affichage
              </a>
              <a [routerLink]="'/admin/events/' + event.id" class="btn btn-sm btn-secondary">
                📝 Modifier
              </a>
            </div>
          </div>

          <!-- Placeholder si aucun événement -->
          <div class="event-card event-placeholder" *ngIf="recentEvents.length === 0">
            <div class="placeholder-content">
              <span class="placeholder-icon">➕</span>
              <p>Créez votre premier événement pour commencer</p>
              <a routerLink="/admin/events/new" class="btn btn-sm btn-primary">
                Créer un événement
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard {
        max-width: 1200px;
        margin: 0 auto;
      }

      /* Page Header */
      .page-header {
        margin-bottom: 2rem;
      }

      .page-title {
        font-size: 2rem;
        font-weight: 800;
        color: #1e293b;
        margin: 0 0 0.5rem 0;
      }

      .page-description {
        color: #64748b;
        font-size: 1rem;
        margin: 0;
      }

      /* Section Styling */
      .section-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #374151;
        margin: 0 0 1rem 0;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .section-link {
        color: #3b82f6;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.875rem;
      }

      .section-link:hover {
        color: #1d4ed8;
      }

      /* Quick Actions */
      .quick-actions {
        margin-bottom: 3rem;
      }

      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
      }

      .action-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        text-decoration: none;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .action-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-color: #cbd5e1;
      }

      .action-primary {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        border-color: #3b82f6;
      }

      .action-primary:hover {
        background: linear-gradient(135deg, #1d4ed8, #1e40af);
      }

      .action-icon {
        font-size: 2rem;
        background: rgba(255, 255, 255, 0.2);
        padding: 0.75rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .action-card:not(.action-primary) .action-icon {
        background: #f1f5f9;
      }

      .action-content h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.125rem;
        font-weight: 600;
      }

      .action-content p {
        margin: 0;
        opacity: 0.8;
        font-size: 0.875rem;
      }

      /* Stats Grid */
      .stats-section {
        margin-bottom: 3rem;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .stat-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .stat-success {
        border-color: #10b981;
        background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
      }

      .stat-icon {
        font-size: 2rem;
        background: #f1f5f9;
        padding: 0.75rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stat-success .stat-icon {
        background: rgba(16, 185, 129, 0.1);
      }

      .stat-number {
        font-size: 1.75rem;
        font-weight: 800;
        color: #1e293b;
        line-height: 1;
      }

      .stat-label {
        color: #64748b;
        font-size: 0.875rem;
        font-weight: 500;
      }

      /* Recent Events */
      .recent-section {
        margin-bottom: 3rem;
      }

      .recent-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 1rem;
      }

      .event-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .event-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
      }

      .event-title {
        margin: 0 0 0.25rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1e293b;
      }

      .event-code {
        margin: 0;
        font-size: 0.875rem;
        color: #64748b;
        font-family: 'JetBrains Mono', monospace;
      }

      .event-status {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .status-active {
        background: #dcfce7;
        color: #15803d;
      }

      .status-draft {
        background: #fef3c7;
        color: #92400e;
      }

      .status-completed {
        background: #e0e7ff;
        color: #3730a3;
      }

      .action-card.disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .action-card.disabled:hover {
        transform: none;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .event-stats {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #f1f5f9;
      }

      .event-stat {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #64748b;
        font-size: 0.875rem;
      }

      .event-actions {
        display: flex;
        gap: 0.75rem;
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

      .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
      }

      .btn-primary {
        background: #3b82f6;
        color: white;
      }

      .btn-primary:hover {
        background: #1d4ed8;
      }

      .btn-secondary {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #cbd5e1;
      }

      .btn-secondary:hover {
        background: #e2e8f0;
      }

      /* Placeholder */
      .event-placeholder {
        border: 2px dashed #cbd5e1;
        background: #fafafa;
      }

      .placeholder-content {
        text-align: center;
        padding: 2rem 1rem;
      }

      .placeholder-icon {
        font-size: 3rem;
        opacity: 0.3;
        display: block;
        margin-bottom: 1rem;
      }

      .placeholder-content p {
        margin: 0 0 1rem 0;
        color: #64748b;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .actions-grid {
          grid-template-columns: 1fr;
        }

        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .recent-grid {
          grid-template-columns: 1fr;
        }

        .event-actions {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalEvents: 0,
    activeEvents: 0,
    totalRounds: 0,
    totalSongs: 0,
    totalTeams: 0,
  };

  recentEvents: RecentEvent[] = [];
  firstEventCode: string | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadDashboardStats();
    this.loadRecentEvents();
  }

  loadDashboardStats() {
    this.isLoading = true;
    this.error = null;

    this.api.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = {
          totalEvents: data.totalEvents,
          activeEvents: data.activeEvents,
          totalRounds: data.totalRounds,
          totalSongs: data.totalSongs,
          totalTeams: data.totalTeams || 0,
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
        this.error = 'Impossible de charger les statistiques.';
        this.isLoading = false;
      },
    });
  }

  loadRecentEvents() {
    this.api.getEvents().subscribe({
      next: (events: Array<{
        id: string;
        code: string;
        name: string;
        gameMode: 'TEAM' | 'SOLO';
        created_at: string;
        status: string;
        rounds_count: number;
        teams_count: number;
      }>) => {
        // Trier par date de création (plus récent en premier) et prendre les 6 premiers
        this.recentEvents = events
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 6)
          .map((event) => ({
            id: event.id,
            code: event.code,
            name: event.name,
            status: (event.status || 'ACTIVE') as 'DRAFT' | 'ACTIVE' | 'COMPLETED',
            gameMode: event.gameMode,
            created_at: event.created_at,
            roundCount: event.rounds_count,
            teamCount: event.teams_count,
          }));

        // Définir le premier événement pour les liens rapides
        if (this.recentEvents.length > 0) {
          this.firstEventCode = this.recentEvents[0].code;
        }
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des événements récents:', error);
      },
    });
  }

  getStatusLabel(status: 'DRAFT' | 'ACTIVE' | 'COMPLETED'): string {
    const labels = {
      DRAFT: 'Brouillon',
      ACTIVE: 'Actif',
      COMPLETED: 'Terminé',
    };
    return labels[status] || status;
  }

  getDjActionText(): string {
    return this.firstEventCode ? 'Contrôler un événement' : "Créez un événement d'abord";
  }

  getDisplayActionText(): string {
    return this.firstEventCode ? "Écran public de l'événement" : "Créez un événement d'abord";
  }
}
