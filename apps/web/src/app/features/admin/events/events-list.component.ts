import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventService, Event } from '../../../core/services/event.service';

@Component({
  selector: 'bt-events-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="events-list">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div>
            <h1 class="page-title">Événements</h1>
            <p class="page-description">
              Gérez tous vos événements de blind test
            </p>
          </div>
          <a routerLink="/admin/events/new" class="btn btn-primary">
            <span>➕</span>
            Nouvel Événement
          </a>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="filters">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher un événement..."
            class="search-input"
            [(ngModel)]="searchTerm">
        </div>
        <div class="filter-tabs">
          <button
            *ngFor="let tab of filterTabs"
            (click)="activeFilter = tab.value"
            [class.active]="activeFilter === tab.value"
            class="filter-tab">
            {{ tab.label }}
            <span class="tab-count">{{ getFilteredEvents(tab.value).length }}</span>
          </button>
        </div>
      </div>

      <!-- Events Grid -->
      <div class="events-grid" *ngIf="filteredEvents.length > 0; else emptyState">
        <div
          *ngFor="let event of filteredEvents"
          class="event-card">

          <div class="event-header">
            <div class="event-info">
              <h3 class="event-title">{{ event.name }}</h3>
              <p class="event-code">Code: {{ event.code }}</p>
            </div>
            <div
              class="event-status"
              [ngClass]="'status-' + event.status">
              {{ getStatusLabel(event.status) }}
            </div>
          </div>

          <div class="event-stats">
            <div class="event-stat">
              <span class="stat-icon">🎵</span>
              <span>{{ event.rounds_count || 0 }} Round(s)</span>
            </div>
            <div class="event-stat">
              <span class="stat-icon">👥</span>
              <span>{{ event.teams_count || 0 }} Équipe(s)</span>
            </div>
            <div class="event-stat">
              <span class="stat-icon">📅</span>
              <span>{{ formatDate(event.created_at) }}</span>
            </div>
          </div>

          <div class="event-actions">
            <a
              [routerLink]="['/dj', event.code]"
              class="btn btn-sm btn-primary">
              🎧 Contrôler
            </a>
            <a
              [routerLink]="['/admin/events', event.id, 'rounds']"
              class="btn btn-sm btn-secondary">
              🎵 Rounds
            </a>
            <a
              [routerLink]="['/admin/events', event.id, 'edit']"
              class="btn btn-sm btn-secondary">
              📝 Modifier
            </a>
            <button
              (click)="duplicateEvent(event)"
              class="btn btn-sm btn-ghost">
              📋 Dupliquer
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <ng-template #emptyState>
        <div class="empty-state">
          <div class="empty-icon">🎪</div>
          <h3 class="empty-title">Aucun événement trouvé</h3>
          <p class="empty-description">
            {{ searchTerm ? 'Aucun événement ne correspond à votre recherche.' : 'Créez votre premier événement pour commencer.' }}
          </p>
          <a
            *ngIf="!searchTerm"
            routerLink="/admin/events/new"
            class="btn btn-primary">
            ➕ Créer le premier événement
          </a>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .events-list {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Page Header */
    .page-header {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
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

    .btn {
      padding: 0.75rem 1.5rem;
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

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn-ghost {
      background: transparent;
      color: #64748b;
      border: 1px solid transparent;
    }

    .btn-ghost:hover {
      background: #f8fafc;
      color: #374151;
    }

    /* Filters */
    .filters {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .search-box {
      position: relative;
      margin-bottom: 1rem;
      max-width: 400px;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 1rem;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 3rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .filter-tabs {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filter-tab {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 20px;
      background: white;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-tab:hover {
      border-color: #94a3b8;
    }

    .filter-tab.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .tab-count {
      background: rgba(0, 0, 0, 0.1);
      padding: 0.125rem 0.375rem;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .filter-tab.active .tab-count {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Events Grid */
    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 1.5rem;
    }

    .event-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .event-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .event-title {
      margin: 0 0 0.25rem 0;
      font-size: 1.25rem;
      font-weight: 700;
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

    .status-inactive {
      background: #f1f5f9;
      color: #64748b;
    }

    .status-completed {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .event-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
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
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.3;
    }

    .empty-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #374151;
      margin: 0 0 0.5rem 0;
    }

    .empty-description {
      color: #64748b;
      margin: 0 0 2rem 0;
      font-size: 1rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .events-grid {
        grid-template-columns: 1fr;
      }

      .event-actions {
        justify-content: space-between;
      }

      .filter-tabs {
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .event-stats {
        flex-direction: column;
        gap: 0.5rem;
      }

      .event-actions {
        flex-direction: column;
      }
    }
  `]
})
export class EventsListComponent implements OnInit {
  events: Event[] = [];

  constructor(private eventService: EventService) {}

  searchTerm = '';
  activeFilter = 'all';

  filterTabs = [
    { label: 'Tous', value: 'all' },
    { label: 'Actifs', value: 'active' },
    { label: 'Inactifs', value: 'inactive' },
    { label: 'Terminés', value: 'completed' }
  ];

  get filteredEvents(): Event[] {
    return this.getFilteredEvents(this.activeFilter).filter(event =>
      event.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      event.code.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  ngOnInit() {
    this.loadEvents();

    // Subscribe to events updates
    this.eventService.events$.subscribe(events => {
      this.events = events;
    });
  }

  loadEvents() {
    this.eventService.getEvents().subscribe({
      next: (response) => {
        console.log('✅ Événements chargés:', response.events);
        this.events = response.events;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des événements:', error);
      }
    });
  }

  getFilteredEvents(filter: string): Event[] {
    if (filter === 'all') return this.events;
    return this.events.filter(event => event.status === filter);
  }

  getStatusLabel(status: string): string {
    const labels = {
      active: 'Actif',
      inactive: 'Inactif',
      completed: 'Terminé'
    };
    return labels[status as keyof typeof labels] || status;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  duplicateEvent(event: Event) {
    // TODO: Implémenter la duplication d'événement
    console.log('Dupliquer événement:', event);
    alert(`Fonctionnalité à venir: dupliquer "${event.name}"`);
  }
}