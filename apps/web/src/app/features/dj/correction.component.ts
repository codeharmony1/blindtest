import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

interface Answer {
  teamId: string;
  teamName: string;
  textRaw: string;
  submittedAt: string;
  matchTitle: boolean;
  matchArtist: boolean;
  points: number;
  canOverride: boolean;
}

interface SongAnswers {
  songId: string;
  songTitle?: string;
  songArtist?: string;
  status: string;
  answers: Answer[];
  totalAnswers: number;
}

@Component({
  selector: 'bt-correction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="correction-container">
      <div class="correction-header">
        <h1>🎯 Correction des Réponses</h1>
        <div class="song-info" *ngIf="songData">
          <h2>{{ songData.songTitle || 'Titre à définir' }} - {{ songData.songArtist || 'Artiste à définir' }}</h2>
          <span class="status-badge" [class]="'status-' + songData.status">{{ songData.status }}</span>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <p>⏳ Chargement des réponses...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>❌ {{ error }}</p>
        <button class="btn btn-secondary" (click)="loadAnswers()">🔄 Réessayer</button>
      </div>

      <div class="answers-list" *ngIf="songData && !loading">
        <div class="summary">
          <p><strong>{{ songData.totalAnswers }}</strong> réponse(s) reçue(s)</p>
        </div>

        <div class="answer-card" *ngFor="let answer of songData.answers; trackBy: trackByTeamId">
          <div class="answer-header">
            <h3>{{ answer.teamName }}</h3>
            <span class="submission-time">{{ formatTime(answer.submittedAt) }}</span>
          </div>

          <div class="answer-content">
            <div class="submitted-text">
              <strong>Réponse :</strong> "{{ answer.textRaw }}"
            </div>

            <div class="matching-controls">
              <div class="match-group">
                <label>
                  <input
                    type="checkbox"
                    [checked]="answer.matchTitle"
                    (change)="updateMatch(answer, 'title', $event)"
                  />
                  ✓ Titre correct
                </label>
              </div>

              <div class="match-group">
                <label>
                  <input
                    type="checkbox"
                    [checked]="answer.matchArtist"
                    (change)="updateMatch(answer, 'artist', $event)"
                  />
                  ✓ Artiste correct
                </label>
              </div>

              <div class="points-display">
                <span class="points" [class]="'points-' + answer.points">
                  {{ answer.points }} point{{ answer.points > 1 ? 's' : '' }}
                </span>
              </div>
            </div>

            <div class="answer-actions">
              <button
                class="btn btn-primary btn-sm"
                (click)="overrideAnswer(answer)"
                [disabled]="updatingAnswers.has(answer.teamId)"
              >
                {{ updatingAnswers.has(answer.teamId) ? '⏳' : '💾' }} Sauvegarder
              </button>
            </div>
          </div>
        </div>

        <div class="no-answers" *ngIf="songData.answers.length === 0">
          <p>📭 Aucune réponse reçue pour cette chanson</p>
        </div>
      </div>

      <div class="correction-actions" *ngIf="songData && !loading">
        <button class="btn btn-secondary" (click)="loadAnswers()">
          🔄 Actualiser
        </button>
        <button class="btn btn-success" (click)="finalizeCorrection()">
          ✅ Finaliser la correction
        </button>
      </div>
    </div>
  `,
  styles: [`
    .correction-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .correction-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .correction-header h1 {
      font-size: 2.5rem;
      color: var(--autumn-burgundy);
      margin-bottom: 1rem;
    }

    .song-info h2 {
      font-size: 1.8rem;
      color: var(--autumn-brown);
      margin-bottom: 1rem;
    }

    .status-badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.8rem;
    }

    .status-open { background: #e3f2fd; color: #1976d2; }
    .status-closed { background: #fff3e0; color: #f57c00; }
    .status-scored { background: #e8f5e8; color: #388e3c; }
    .status-pending { background: #f3e5f5; color: #7b1fa2; }

    .loading, .error {
      text-align: center;
      padding: 3rem;
      font-size: 1.2rem;
    }

    .error {
      color: #d32f2f;
    }

    .summary {
      background: var(--autumn-cream);
      padding: 1rem;
      border-radius: 10px;
      margin-bottom: 2rem;
      text-align: center;
    }

    .answers-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .answer-card {
      background: white;
      border: 2px solid var(--autumn-gold);
      border-radius: 15px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px var(--autumn-shadow);
      transition: transform 0.2s ease;
    }

    .answer-card:hover {
      transform: translateY(-2px);
    }

    .answer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--autumn-soft-yellow);
    }

    .answer-header h3 {
      margin: 0;
      color: var(--autumn-burgundy);
      font-size: 1.3rem;
    }

    .submission-time {
      color: var(--autumn-brown);
      font-size: 0.9rem;
    }

    .submitted-text {
      background: var(--autumn-soft-yellow);
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 1.1rem;
    }

    .matching-controls {
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .match-group {
      display: flex;
      align-items: center;
    }

    .match-group label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--autumn-brown);
    }

    .match-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .points-display {
      margin-left: auto;
    }

    .points {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .points-0 { background: #ffebee; color: #c62828; }
    .points-1 { background: #fff3e0; color: #ef6c00; }
    .points-2 { background: #e8f5e8; color: #2e7d32; }

    .answer-actions {
      display: flex;
      justify-content: flex-end;
    }

    .no-answers {
      text-align: center;
      padding: 3rem;
      color: var(--autumn-brown);
      font-size: 1.2rem;
      font-style: italic;
    }

    .correction-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 3rem;
    }

    .btn {
      padding: 0.8rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn:hover {
      transform: translateY(-1px);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-primary {
      background: var(--autumn-burgundy);
      color: white;
    }

    .btn-secondary {
      background: var(--autumn-brown);
      color: white;
    }

    .btn-success {
      background: #388e3c;
      color: white;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .correction-container {
        padding: 1rem;
      }

      .correction-header h1 {
        font-size: 2rem;
      }

      .song-info h2 {
        font-size: 1.5rem;
      }

      .matching-controls {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .points-display {
        margin-left: 0;
      }

      .answer-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class CorrectionComponent implements OnInit {
  eventCode!: string;
  songId!: string;
  songData: SongAnswers | null = null;
  loading = false;
  error = '';
  updatingAnswers = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.eventCode = this.route.snapshot.params['eventCode'];
    this.songId = this.route.snapshot.params['songId'];
    this.loadAnswers();
  }

  loadAnswers() {
    this.loading = true;
    this.error = '';

    this.api.getSongAnswers(this.songId).subscribe({
      next: (data) => {
        this.songData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement des réponses';
        this.loading = false;
        console.error('Erreur chargement réponses:', err);
      }
    });
  }

  updateMatch(answer: Answer, type: 'title' | 'artist', event: any) {
    const checked = event.target.checked;

    if (type === 'title') {
      answer.matchTitle = checked;
    } else {
      answer.matchArtist = checked;
    }

    // Recalculer les points
    if (answer.matchTitle && answer.matchArtist) {
      answer.points = 2;
    } else if (answer.matchTitle || answer.matchArtist) {
      answer.points = 1;
    } else {
      answer.points = 0;
    }
  }

  overrideAnswer(answer: Answer) {
    this.updatingAnswers.add(answer.teamId);

    this.api.overrideAnswer(this.songId, answer.teamId, {
      matchTitle: answer.matchTitle,
      matchArtist: answer.matchArtist,
      points: answer.points
    }).subscribe({
      next: (result) => {
        this.updatingAnswers.delete(answer.teamId);
        console.log('Réponse mise à jour:', result);
      },
      error: (err) => {
        this.updatingAnswers.delete(answer.teamId);
        alert('Erreur lors de la mise à jour: ' + (err.error?.message || err.message));
        console.error('Erreur override:', err);
      }
    });
  }

  finalizeCorrection() {
    if (confirm('Finaliser la correction ? Cette action recalculera les scores de toutes les équipes.')) {
      this.api.gradeSong(this.songId).subscribe({
        next: () => {
          alert('✅ Correction finalisée ! Les scores ont été mis à jour.');
          this.loadAnswers();
        },
        error: (err) => {
          alert('❌ Erreur lors de la finalisation: ' + (err.error?.message || err.message));
          console.error('Erreur finalisation:', err);
        }
      });
    }
  }

  trackByTeamId(index: number, answer: Answer): string {
    return answer.teamId;
  }

  formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}