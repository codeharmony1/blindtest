import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Round {
  id: string;
  name: string | null;
  default_duration_s: number;
  total_songs: number;
  created_at: string;
  songCount?: number;
}

interface Event {
  id: string;
  code: string;
  name: string;
}

@Component({
  selector: 'bt-rounds-list',
  standalone: true,
  imports: [CommonModule, RouterLink, HttpClientModule],
  template: `
    <div class="rounds-list">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Rounds</h1>
          <p class="event-info" *ngIf="currentEvent">
            <span class="event-name">{{ currentEvent.name }}</span>
            <span class="event-code">Code: {{ currentEvent.code }}</span>
          </p>
        </div>
        <div class="header-actions">
          <a routerLink="/admin/events" class="btn btn-secondary">← Retour aux événements</a>
          <button
            class="btn btn-primary"
            (click)="createRound()"
            [disabled]="isLoading">
            ✨ Nouveau Round
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Chargement des rounds...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Erreur de chargement</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" (click)="retry()">Réessayer</button>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && !error && rounds.length === 0" class="empty-state">
        <div class="empty-icon">🎵</div>
        <h3>Aucun round créé</h3>
        <p>Créez votre premier round pour commencer à organiser vos musiques</p>
        <button class="btn btn-primary" (click)="createRound()">✨ Créer le premier round</button>
      </div>

      <!-- Rounds Grid -->
      <div *ngIf="!isLoading && !error && rounds.length > 0" class="rounds-grid">
        <div
          *ngFor="let round of rounds; trackBy: trackRound"
          class="round-card"
          (click)="openRound(round)">

          <div class="round-header">
            <h3 class="round-name">
              {{ round.name || 'Round ' + round.id }}
            </h3>
            <div class="round-actions" (click)="$event.stopPropagation()">
              <button
                class="action-btn"
                (click)="editRound(round)"
                title="Modifier">
                ✏️
              </button>
              <button
                class="action-btn delete"
                (click)="deleteRound(round)"
                title="Supprimer">
                🗑️
              </button>
            </div>
          </div>

          <div class="round-stats">
            <div class="stat">
              <span class="stat-icon">🎵</span>
              <span class="stat-value">{{ round.songCount || 0 }}</span>
              <span class="stat-label">Chansons</span>
            </div>
            <div class="stat">
              <span class="stat-icon">⏱️</span>
              <span class="stat-value">{{ round.default_duration_s }}s</span>
              <span class="stat-label">Durée</span>
            </div>
            <div class="stat">
              <span class="stat-icon">🎯</span>
              <span class="stat-value">{{ round.total_songs }}</span>
              <span class="stat-label">Total prévu</span>
            </div>
          </div>

          <div class="round-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                [style.width.%]="getProgressPercentage(round)">
              </div>
            </div>
            <span class="progress-text">
              {{ round.songCount || 0 }} / {{ round.total_songs }} chansons
            </span>
          </div>

          <div class="round-footer">
            <span class="round-date">
              Créé le {{ formatDate(round.created_at) }}
            </span>
            <span class="round-status" [class]="getRoundStatus(round)">
              {{ getRoundStatusText(round) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div *ngIf="rounds.length > 0" class="quick-stats">
        <div class="stat-card">
          <div class="stat-number">{{ rounds.length }}</div>
          <div class="stat-title">Rounds créés</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ getTotalSongs() }}</div>
          <div class="stat-title">Chansons totales</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ getAverageDuration() }}s</div>
          <div class="stat-title">Durée moyenne</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ getCompletedRounds() }}</div>
          <div class="stat-title">Rounds complets</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rounds-list {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      gap: 2rem;
    }

    .header-left {
      flex: 1;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .event-info {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .event-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
    }

    .event-code {
      font-size: 0.875rem;
      color: #64748b;
      font-family: monospace;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    /* Buttons */
    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
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

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* States */
    .loading-state,
    .error-state,
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #f3f4f6;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-icon,
    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state h3,
    .error-state h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .empty-state p,
    .error-state p {
      color: #64748b;
      margin-bottom: 2rem;
    }

    /* Rounds Grid */
    .rounds-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .round-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .round-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .round-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .round-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
      flex: 1;
    }

    .round-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #f8fafc;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: #e2e8f0;
    }

    .action-btn.delete:hover {
      background: #fef2f2;
      color: #dc2626;
    }

    /* Stats */
    .round-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .stat {
      text-align: center;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
    }

    .stat-icon {
      display: block;
      font-size: 1.25rem;
      margin-bottom: 0.25rem;
    }

    .stat-value {
      display: block;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .stat-label {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    /* Progress */
    .round-progress {
      margin-bottom: 1rem;
    }

    .progress-bar {
      height: 8px;
      background: #f1f5f9;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: #3b82f6;
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Footer */
    .round-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }

    .round-date {
      font-size: 0.75rem;
      color: #64748b;
    }

    .round-status {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .round-status.empty {
      background: #f1f5f9;
      color: #64748b;
    }

    .round-status.in-progress {
      background: #fef3c7;
      color: #92400e;
    }

    .round-status.completed {
      background: #d1fae5;
      color: #065f46;
    }

    /* Quick Stats */
    .quick-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 800;
      color: #3b82f6;
      margin-bottom: 0.5rem;
    }

    .stat-title {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .rounds-list {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .rounds-grid {
        grid-template-columns: 1fr;
      }

      .round-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .quick-stats {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class RoundsListComponent implements OnInit {
  rounds: Round[] = [];
  currentEvent: Event | null = null;
  isLoading = false;
  error: string | null = null;
  eventId: string;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
  }

  ngOnInit() {
    this.loadEventInfo();
    this.loadRounds();
  }

  loadEventInfo() {
    this.http.get<Event>(`http://localhost:3000/api/events/id/${this.eventId}`)
      .subscribe({
        next: (event) => {
          this.currentEvent = event;
          // Load rounds after we have the event code
          this.loadRoundsWithCode(event.code);
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'événement:', error);
          this.error = 'Impossible de charger l\'événement. Veuillez réessayer.';
          this.isLoading = false;
        }
      });
  }

  loadRounds() {
    this.isLoading = true;
    this.error = null;
    // This method now only starts loading - actual loading happens in loadRoundsWithCode
  }

  loadRoundsWithCode(eventCode: string) {
    // Admin format with x-client-type header
    const headers = { 'x-client-type': 'admin' };
    this.http.get<{rounds: Round[]}>(`http://localhost:3000/api/events/${eventCode}/rounds`, { headers })
      .subscribe({
        next: (response) => {
          this.rounds = response.rounds;
          this.loadSongCounts();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des rounds:', error);
          this.error = 'Impossible de charger les rounds. Veuillez réessayer.';
          this.isLoading = false;
        }
      });
  }

  loadSongCounts() {
    this.rounds.forEach(round => {
      this.http.get<{count: number}>(`http://localhost:3000/api/rounds/${round.id}/songs/count`)
        .subscribe({
          next: (response) => {
            round.songCount = response.count;
          },
          error: () => {
            round.songCount = 0;
          }
        });
    });
  }

  createRound() {
    this.router.navigate(['/admin/events', this.eventId, 'rounds', 'new']);
  }

  openRound(round: Round) {
    this.router.navigate(['/admin/events', this.eventId, 'rounds', round.id]);
  }

  editRound(round: Round) {
    this.router.navigate(['/admin/events', this.eventId, 'rounds', round.id, 'edit']);
  }

  deleteRound(round: Round) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le round "${round.name || round.id}" ?`)) {
      this.http.delete(`http://localhost:3000/api/rounds/${round.id}`)
        .subscribe({
          next: () => {
            this.rounds = this.rounds.filter(r => r.id !== round.id);
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression du round.');
          }
        });
    }
  }

  trackRound(index: number, round: Round): string {
    return round.id;
  }

  getProgressPercentage(round: Round): number {
    if (!round.total_songs || round.total_songs === 0) return 0;
    return Math.min(100, ((round.songCount || 0) / round.total_songs) * 100);
  }

  getRoundStatus(round: Round): string {
    const songCount = round.songCount || 0;
    if (songCount === 0) return 'empty';
    if (songCount >= round.total_songs) return 'completed';
    return 'in-progress';
  }

  getRoundStatusText(round: Round): string {
    const status = this.getRoundStatus(round);
    switch (status) {
      case 'empty': return 'Vide';
      case 'completed': return 'Complet';
      case 'in-progress': return 'En cours';
      default: return 'Inconnu';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getTotalSongs(): number {
    return this.rounds.reduce((total, round) => total + (round.songCount || 0), 0);
  }

  getAverageDuration(): number {
    if (this.rounds.length === 0) return 0;
    const totalDuration = this.rounds.reduce((total, round) => total + round.default_duration_s, 0);
    return Math.round(totalDuration / this.rounds.length);
  }

  getCompletedRounds(): number {
    return this.rounds.filter(round => this.getRoundStatus(round) === 'completed').length;
  }

  retry() {
    this.loadEventInfo();
    this.loadRounds();
  }
}