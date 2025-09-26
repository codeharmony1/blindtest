import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'bt-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="event-detail">
      <h1>Détail de l'événement</h1>
      <p>Composant en construction...</p>
      <a routerLink="/admin/events" class="btn btn-secondary">← Retour à la liste</a>
    </div>
  `,
  styles: [`
    .event-detail {
      padding: 2rem;
      background: white;
      border-radius: 12px;
    }
    .btn {
      padding: 0.5rem 1rem;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      text-decoration: none;
      color: #475569;
    }
  `]
})
export class EventDetailComponent {}