import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventService, Event } from '../../../core/services/event.service';
import { QrCodeModalComponent } from '../../../shared/components/qr-code-modal.component';

@Component({
  selector: 'bt-events-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, QrCodeModalComponent],
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
            <button
              *ngIf="isEventCompleted(event)"
              (click)="viewScores(event)"
              class="btn btn-sm btn-success">
              📊 Voir les scores
            </button>
            <button
              (click)="showQRCode(event)"
              class="btn btn-sm btn-accent">
              📱 QR Code
            </button>
            <a
              [href]="'/dj/' + event.code"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-sm btn-primary">
              🎧 Interface DJ
            </a>
            <a
              [href]="'/display/' + event.code"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-sm btn-display">
              📺 Affichage
            </a>
            <a
              [href]="'/join/' + event.code"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-sm btn-player">
              🎮 Joueur
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
            <button
              (click)="regenerateDjPin(event, $event)"
              class="btn btn-sm btn-ghost"
              title="Régénérer le code PIN DJ">
              🔄 PIN DJ
            </button>
            <button
              (click)="confirmDelete(event)"
              class="btn btn-sm btn-danger"
              title="Supprimer l'événement">
              🗑️ Supprimer
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

      <!-- QR Code Modal -->
      <bt-qr-code-modal
        #qrModal
        [eventCode]="selectedEvent?.code || ''"
        [eventName]="selectedEvent?.name || ''">
      </bt-qr-code-modal>

      <!-- Delete Confirmation Modal -->
      <div class="modal-overlay" *ngIf="showDeleteModal" (click)="cancelDelete()">
        <div class="modal-content delete-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">🗑️ Confirmer la suppression</h2>
          </div>
          <div class="modal-body">
            <div class="warning-message">
              <span class="warning-icon">⚠️</span>
              <div class="warning-text">
                <p class="warning-title">Attention : Cette action est irréversible !</p>
                <p>
                  Vous êtes sur le point de supprimer l'événement
                  <strong>{{ eventToDelete?.name }}</strong> ({{ eventToDelete?.code }}).
                </p>
                <p>
                  Toutes les données associées seront définitivement supprimées :
                </p>
                <ul class="deletion-list">
                  <li>Tous les rounds et chansons</li>
                  <li>Toutes les équipes et joueurs</li>
                  <li>Toutes les réponses et scores</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              (click)="cancelDelete()"
              class="btn btn-secondary"
              [disabled]="isDeleting">
              ❌ Annuler
            </button>
            <button
              (click)="deleteEvent()"
              class="btn btn-danger"
              [disabled]="isDeleting">
              {{ isDeleting ? '⏳ Suppression...' : '🗑️ Supprimer définitivement' }}
            </button>
          </div>
        </div>
      </div>
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

    .btn-accent {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: none;
    }

    .btn-accent:hover {
      background: linear-gradient(135deg, #059669, #047857);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
    }

    .btn-display {
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;
      border: none;
    }

    .btn-display:hover {
      background: linear-gradient(135deg, #7c3aed, #6d28d9);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
    }

    .btn-player {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      border: none;
    }

    .btn-player:hover {
      background: linear-gradient(135deg, #d97706, #b45309);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
    }

    .btn-success {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      border: none;
    }

    .btn-success:hover {
      background: linear-gradient(135deg, #16a34a, #15803d);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(34, 197, 94, 0.3);
    }

    .btn-danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border: none;
    }

    .btn-danger:hover:not(:disabled) {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
    }

    .btn-danger:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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

    /* Delete Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-width: 500px;
      width: 90%;
      animation: modalFadeIn 0.3s ease-out;
    }

    @keyframes modalFadeIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .delete-modal .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .delete-modal .modal-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #dc2626;
    }

    .delete-modal .modal-body {
      padding: 1.5rem;
    }

    .warning-message {
      display: flex;
      gap: 1rem;
      background: linear-gradient(135deg, #fef2f2, #fee2e2);
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #ef4444;
    }

    .warning-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .warning-text {
      flex: 1;
    }

    .warning-title {
      font-weight: 700;
      color: #991b1b;
      margin: 0 0 0.5rem 0;
    }

    .warning-text p {
      margin: 0 0 0.75rem 0;
      color: #374151;
      line-height: 1.5;
    }

    .warning-text strong {
      color: #dc2626;
      font-weight: 600;
    }

    .deletion-list {
      margin: 0.5rem 0 0 1rem;
      padding: 0;
      color: #64748b;
    }

    .deletion-list li {
      margin: 0.25rem 0;
    }

    .delete-modal .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .delete-modal .modal-footer .btn {
      min-width: 150px;
      justify-content: center;
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
  @ViewChild('qrModal') qrModal!: QrCodeModalComponent;

  events: Event[] = [];
  selectedEvent: Event | null = null;
  eventToDelete: Event | null = null;
  showDeleteModal = false;
  isDeleting = false;

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
    const newName = prompt(
      'Entrez le nom du nouvel événement:',
      `${event.name} (Copie)`
    );

    // User cancelled the prompt
    if (newName === null) {
      return;
    }

    // Use default name if empty
    const eventName = newName.trim() || `${event.name} (Copie)`;

    this.eventService.duplicateEvent(event.id, eventName).subscribe({
      next: (response) => {
        console.log('✅ Événement dupliqué avec succès:', response);
        alert(
          `Événement "${response.name}" créé avec succès!\n\n` +
          `Code: ${response.code}\n` +
          `Rounds dupliqués: ${response.roundsCount}\n\n` +
          `L'événement a été créé en mode BROUILLON.`
        );
      },
      error: (error) => {
        console.error('❌ Erreur lors de la duplication:', error);
        alert(
          `Erreur lors de la duplication de l'événement.\n\n` +
          `${error.error?.error?.message || error.message || 'Erreur inconnue'}`
        );
      }
    });
  }

  showQRCode(event: Event) {
    this.selectedEvent = event;
    setTimeout(() => {
      this.qrModal.open();
    }, 0);
  }

  regenerateDjPin(event: Event, clickEvent: MouseEvent): void {
    clickEvent.stopPropagation();

    const confirmed = confirm(
      `⚠️ Régénérer le code PIN DJ pour "${event.name}" ?\n\n` +
      'Attention :\n' +
      '• L\'ancien PIN ne fonctionnera plus\n' +
      '• Le DJ devra utiliser le nouveau PIN pour se connecter\n\n' +
      'Continuer ?'
    );

    if (!confirmed) return;

    this.eventService.regenerateDjPin(event.id).subscribe({
      next: (response) => {
        const newPin = response.djPin;

        // Afficher le nouveau PIN (modal ou alert)
        const message =
          `✅ Nouveau code PIN généré avec succès !\n\n` +
          `📋 Code PIN DJ : ${newPin}\n\n` +
          `⚠️ Notez-le maintenant, il ne sera plus affiché.`;

        // Copier automatiquement dans le presse-papiers
        navigator.clipboard.writeText(newPin).then(() => {
          alert(message + '\n\n✅ Code PIN copié dans le presse-papiers !');
        }).catch(() => {
          alert(message);
        });
      },
      error: (error) => {
        console.error('[Events List] Regenerate PIN error:', error);
        alert('❌ Erreur lors de la régénération du PIN.');
      }
    });
  }

  /**
   * Vérifie si un événement est terminé (status = completed)
   */
  isEventCompleted(event: Event): boolean {
    return event.status === 'completed';
  }

  /**
   * Ouvre la page de visualisation des scores pour l'événement
   */
  viewScores(event: Event): void {
    // Ouvrir dans un nouvel onglet la page du leaderboard
    window.open(`/player/${event.code}/leaderboard`, '_blank');
  }

  /**
   * Affiche la popup de confirmation de suppression
   */
  confirmDelete(event: Event): void {
    this.eventToDelete = event;
    this.showDeleteModal = true;
  }

  /**
   * Annule la suppression et ferme la popup
   */
  cancelDelete(): void {
    this.eventToDelete = null;
    this.showDeleteModal = false;
    this.isDeleting = false;
  }

  /**
   * Supprime l'événement après confirmation
   */
  deleteEvent(): void {
    if (!this.eventToDelete) return;

    this.isDeleting = true;
    const eventId = this.eventToDelete.id;
    const eventName = this.eventToDelete.name;

    this.eventService.deleteEvent(eventId).subscribe({
      next: () => {
        console.log(`✅ Événement "${eventName}" supprimé avec succès`);
        // Recharger la liste des événements
        this.loadEvents();
        // Fermer la popup
        this.cancelDelete();
      },
      error: (error) => {
        console.error('[Events List] Delete error:', error);
        this.isDeleting = false;
        alert(`❌ Erreur lors de la suppression de l'événement "${eventName}"`);
      }
    });
  }
}