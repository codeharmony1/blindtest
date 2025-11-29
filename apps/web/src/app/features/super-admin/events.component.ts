import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SuperAdminService } from '../../core/services/super-admin.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface LiveEvent {
  id: string;
  event_code: string;
  theme_id: string;
  tenant_id: string;
  tenant_name: string;
  current_round?: number;
  total_rounds: number;
  active_players: number;
  created_at: string;
  status: 'active' | 'paused' | 'ended';
}

@Component({
  selector: 'bt-super-admin-events',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-content">
      <div class="content-header">
        <div>
          <h1>🎵 Événements en direct</h1>
          <p>
            {{ events.length }} événement{{ events.length > 1 ? 's' : '' }} actif{{
              events.length > 1 ? 's' : ''
            }}
          </p>
        </div>
      </div>
      <div class="filters-bar">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (input)="applyFilter()"
          placeholder="Rechercher un événement ou organisation..."
          class="search-input"
        />

        <label class="checkbox-label">
          <input type="checkbox" [(ngModel)]="autoRefresh" (change)="toggleAutoRefresh()" />
          Actualisation automatique (5s)
        </label>

        <button class="btn-refresh" (click)="loadEvents()" [disabled]="loading">
          🔄 Rafraîchir
        </button>
      </div>

      <div class="loading" *ngIf="loading && events.length === 0">Chargement...</div>
      <div class="error" *ngIf="error">{{ error }}</div>

      <div class="events-grid" *ngIf="!loading || events.length > 0">
        <div
          class="event-card"
          *ngFor="let event of filteredEvents"
          [class.status-active]="event.status === 'active'"
        >
          <div class="event-header">
            <div>
              <h3>{{ event.event_code }}</h3>
              <span class="tenant-badge">{{ event.tenant_name }}</span>
            </div>
            <span class="event-status" [class]="'status-' + event.status">
              {{
                event.status === 'active'
                  ? '🔴 En cours'
                  : event.status === 'paused'
                    ? '⏸️ Pause'
                    : '✅ Terminé'
              }}
            </span>
          </div>

          <div class="event-info">
            <div class="info-row">
              <span class="label">Thème:</span>
              <span>{{ event.theme_id }}</span>
            </div>
            <div class="info-row">
              <span class="label">Progression:</span>
              <span>Round {{ event.current_round || 0 }} / {{ event.total_rounds }}</span>
            </div>
            <div class="info-row">
              <span class="label">Joueurs actifs:</span>
              <span class="player-count">{{ event.active_players }}</span>
            </div>
            <div class="info-row">
              <span class="label">Démarré:</span>
              <span>{{ event.created_at | date: 'dd/MM/yyyy HH:mm' }}</span>
            </div>
          </div>

          <div class="event-actions">
            <button
              class="btn-action btn-stop"
              (click)="stopEvent(event)"
              [disabled]="event.status === 'ended'"
            >
              🛑 Arrêter
            </button>
            <button
              class="btn-action btn-control"
              (click)="takeDjControl(event)"
              [disabled]="event.status !== 'active'"
            >
              🎛️ Prendre contrôle DJ
            </button>
          </div>
        </div>

        <div class="empty-state" *ngIf="filteredEvents.length === 0 && !loading">
          <p>Aucun événement en cours</p>
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
        align-items: center;
      }

      .search-input {
        flex: 1;
        padding: 0.75rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: white;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        cursor: pointer;
        white-space: nowrap;
      }

      .checkbox-label input[type='checkbox'] {
        cursor: pointer;
      }

      .btn-refresh {
        padding: 0.75rem 1.25rem;
        background: #48bb78;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
      }

      .btn-refresh:hover:not(:disabled) {
        background: #38a169;
      }

      .btn-refresh:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .events-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
        gap: 1.5rem;
      }

      .event-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: all 0.3s;
        border-left: 4px solid #cbd5e0;
      }

      .event-card.status-active {
        border-left-color: #f56565;
        box-shadow: 0 2px 8px rgba(245, 101, 101, 0.2);
      }

      .event-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      }

      .event-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 1rem;
      }

      .event-header h3 {
        margin: 0 0 0.5rem 0;
        color: #2d3748;
        font-size: 1.25rem;
        font-weight: 700;
      }

      .tenant-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: #e6fffa;
        color: #234e52;
        border-radius: 4px;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .event-status {
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .event-status.status-active {
        background: #fed7d7;
        color: #c53030;
      }

      .event-status.status-paused {
        background: #feebc8;
        color: #c05621;
      }

      .event-status.status-ended {
        background: #c6f6d5;
        color: #22543d;
      }

      .event-info {
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

      .player-count {
        font-weight: 700;
        color: #667eea;
        font-size: 1.1rem;
      }

      .event-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
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

      .btn-action:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .btn-stop {
        background: #fed7d7;
        color: #c53030;
      }

      .btn-stop:hover:not(:disabled) {
        background: #fc8181;
        color: white;
      }

      .btn-control {
        background: #bee3f8;
        color: #2c5282;
      }

      .btn-control:hover:not(:disabled) {
        background: #4299e1;
        color: white;
      }

      .loading,
      .error {
        text-align: center;
        padding: 3rem;
      }

      .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 4rem 2rem;
        color: #718096;
        font-size: 1.1rem;
      }

      @media (max-width: 768px) {
        .filters-bar {
          flex-direction: column;
        }

        .events-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SuperAdminEventsComponent implements OnInit, OnDestroy {
  events: LiveEvent[] = [];
  filteredEvents: LiveEvent[] = [];
  loading = false;
  error = '';
  searchQuery = '';
  autoRefresh = true;
  private refreshSubscription?: Subscription;

  constructor(
    private superAdminService: SuperAdminService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.superAdminService.isAuthenticated()) {
      this.router.navigate(['/backstage/login']);
      return;
    }
    this.loadEvents();
    this.toggleAutoRefresh();
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  loadEvents(): void {
    this.loading = true;
    this.error = '';

    this.superAdminService.getLiveEvents().subscribe({
      next: (events: any[]) => {
        this.events = events.map((e) => ({
          id: e.id,
          event_code: e.code,
          theme_id: e.theme_id || 'default',
          tenant_id: e.tenant_id,
          tenant_name: e.tenant?.name || 'Organisation inconnue',
          current_round: e.currentRound || 0,
          total_rounds: e.totalRounds || 0,
          active_players: e.playersCount || 0,
          created_at: e.created_at,
          status: 'active' as const,
        }));
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading live events', err);
        this.error = 'Erreur lors du chargement des événements';
        this.loading = false;
      },
    });
  }

  applyFilter(): void {
    const query = this.searchQuery.toLowerCase();
    this.filteredEvents = this.events.filter(
      (event) =>
        event.event_code.toLowerCase().includes(query) ||
        event.tenant_name.toLowerCase().includes(query) ||
        event.theme_id.toLowerCase().includes(query),
    );
  }

  toggleAutoRefresh(): void {
    this.refreshSubscription?.unsubscribe();

    if (this.autoRefresh) {
      this.refreshSubscription = interval(5000)
        .pipe(
          switchMap(() => {
            this.loadEvents();
            return [];
          }),
        )
        .subscribe();
    }
  }

  stopEvent(event: LiveEvent): void {
    const reason = prompt(
      `Arrêter l'événement "${event.event_code}" ?\n\nMotif de l'arrêt (optionnel):`,
    );

    if (reason !== null) {
      // User clicked OK (even if empty)
      this.superAdminService.forceStopEvent(event.id, reason || undefined).subscribe({
        next: (response) => {
          alert(`✅ ${response.message}\n\nÉvénement "${event.event_code}" arrêté avec succès.`);
          this.loadEvents(); // Refresh the list
        },
        error: (err) => {
          console.error('Force stop error:', err);
          alert("❌ Erreur lors de l'arrêt de l'événement: " + (err.error?.message || err.message));
        },
      });
    }
  }

  takeDjControl(event: LiveEvent): void {
    if (
      confirm(
        `Prendre le contrôle DJ de l'événement "${event.event_code}" ?\n\n⚠️ Cette fonctionnalité sera disponible dans la Phase 3.`,
      )
    ) {
      // TODO: Phase 3 - Implement DJ takeover functionality
      alert('Fonctionnalité "Prendre contrôle DJ" - Phase 3');
    }
  }
}
