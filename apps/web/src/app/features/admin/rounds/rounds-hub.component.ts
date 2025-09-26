import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { EventService, Event } from '../../../core/services/event.service';

@Component({
  selector: 'bt-rounds-hub',
  standalone: true,
  imports: [CommonModule, RouterLink, HttpClientModule],
  template: `
    <div class="rounds-hub">
      <div class="page-header">
        <h1 class="page-title">Gestion des Rounds</h1>
        <p class="page-description">Sélectionnez un événement pour gérer ses rounds</p>
      </div>

      <div class="actions">
        <a routerLink="/admin/events" class="btn btn-secondary">← Retour aux événements</a>
        <a routerLink="/admin/events/new" class="btn btn-primary">➕ Nouvel évènement</a>
      </div>

      <div *ngIf="isLoading" class="state">Chargement des événements...</div>
      <div *ngIf="error" class="state error">{{ error }}</div>

      <div *ngIf="!isLoading && !error && events.length === 0" class="empty">
        <div class="empty-icon">🎪</div>
        <h3>Aucun évènement</h3>
        <p>Créez un évènement pour commencer à gérer vos rounds.</p>
        <a routerLink="/admin/events/new" class="btn btn-primary">Créer un évènement</a>
      </div>

      <div *ngIf="events.length > 0" class="events-grid">
        <div class="event-card" *ngFor="let ev of events">
          <div class="event-header">
            <div>
              <h3 class="event-title">{{ ev.name }}</h3>
              <div class="event-code">Code: {{ ev.code }}</div>
            </div>
            <div class="event-stats">
              <span>🎵 {{ ev.rounds_count || 0 }} rounds</span>
              <span>👥 {{ ev.teams_count || 0 }} équipes</span>
            </div>
          </div>
          <div class="event-actions">
            <a [routerLink]="['/admin/events', ev.id, 'rounds']" class="btn btn-primary"
              >Gérer les rounds →</a
            >
            <a [routerLink]="['/admin/events', ev.id, 'edit']" class="btn btn-secondary"
              >Modifier l’évènement</a
            >
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .rounds-hub {
        max-width: 1100px;
        margin: 0 auto;
        padding: 2rem;
      }
      .page-title {
        font-size: 1.75rem;
        font-weight: 800;
        margin: 0 0 0.25rem 0;
      }
      .page-description {
        color: #64748b;
        margin: 0 0 1rem 0;
      }
      .actions {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .btn {
        padding: 0.6rem 1.1rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
        border: 1px solid transparent;
      }
      .btn-primary {
        background: #3b82f6;
        color: #fff;
      }
      .btn-secondary {
        background: #f1f5f9;
        color: #475569;
        border-color: #cbd5e1;
      }
      .state {
        padding: 2rem;
        text-align: center;
        color: #475569;
      }
      .state.error {
        color: #b91c1c;
      }
      .empty {
        text-align: center;
        padding: 3rem 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background: #fff;
      }
      .empty-icon {
        font-size: 3rem;
        opacity: 0.3;
        margin-bottom: 0.5rem;
      }
      .events-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1rem;
      }
      .event-card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1rem;
      }
      .event-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.75rem;
      }
      .event-title {
        margin: 0.25rem 0;
        font-size: 1.125rem;
      }
      .event-code {
        color: #64748b;
        font-size: 0.85rem;
      }
      .event-stats {
        display: flex;
        gap: 0.75rem;
        color: #64748b;
        font-size: 0.85rem;
      }
      .event-actions {
        display: flex;
        gap: 0.5rem;
      }
    `,
  ],
})
export class RoundsHubComponent implements OnInit {
  events: Event[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.eventService.getEvents().subscribe({
      next: (res) => {
        this.events = res.events;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Impossible de charger les évènements';
        this.isLoading = false;
      },
    });
  }
}
