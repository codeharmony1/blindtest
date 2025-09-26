import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Song {
  id: string;
  idx: number;
  title: string | null;
  artist: string | null;
  duration?: number;
  status: 'pending' | 'open' | 'closed' | 'scored';
  mode: 'prepared' | 'freestyle';
}

interface Round {
  id: string;
  name: string | null;
  default_duration_s: number;
  total_songs: number;
}

interface Event {
  id: string;
  code: string;
  name: string;
}

@Component({
  selector: 'bt-songs-manager',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, HttpClientModule],
  template: `
    <div class="songs-manager">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Gestion des chansons</h1>
          <div class="breadcrumb" *ngIf="currentEvent && currentRound">
            <span class="event-name">{{ currentEvent.name }}</span>
            <span class="separator">›</span>
            <span class="round-name">{{ currentRound.name || 'Round ' + currentRound.id }}</span>
          </div>
          <p class="round-info" *ngIf="currentRound">
            {{ songs.length }} / {{ currentRound.total_songs }} chansons ·
            {{ currentRound.default_duration_s }}s par défaut
          </p>
        </div>
        <div class="header-actions">
          <a [routerLink]="['/admin/events', eventId, 'rounds']" class="btn btn-secondary">
            ← Retour aux rounds
          </a>
        </div>
      </div>

      <!-- Add Methods -->
      <div class="add-methods">
        <div class="method-card">
          <h3>➕ Ajouter manuellement</h3>
          <p>Ajoutez des chansons une par une</p>
          <button (click)="showAddForm = !showAddForm" class="btn btn-primary">
            {{ showAddForm ? 'Masquer' : 'Ajouter une chanson' }}
          </button>
        </div>

        <div class="method-card">
          <h3>📄 Import CSV</h3>
          <p>Importez plusieurs chansons depuis un fichier CSV</p>
          <div class="csv-import">
            <input
              type="file"
              accept=".csv"
              (change)="onFileSelected($event)"
              #fileInput
              style="display: none"
            />
            <button (click)="fileInput.click()" class="btn btn-secondary">
              Choisir un fichier CSV
            </button>
            <button
              *ngIf="selectedFile"
              (click)="uploadCSV()"
              [disabled]="isUploading"
              class="btn btn-primary"
            >
              {{ isUploading ? '⏳ Import...' : '✨ Importer' }}
            </button>
          </div>
          <small class="help-text">
            Format: titre,artiste,durée(optionnel),alias1;alias2(optionnel)
          </small>
        </div>
      </div>

      <!-- Add Form -->
      <div *ngIf="showAddForm" class="add-form">
        <form [formGroup]="songForm" (ngSubmit)="addSong()" class="song-form">
          <div class="form-row">
            <div class="form-group">
              <label>Mode</label>
              <select formControlName="mode" class="form-input">
                <option value="prepared">Préparé (titre/artiste connus)</option>
                <option value="freestyle">Freestyle (titre/artiste à deviner)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Position</label>
              <input
                type="number"
                formControlName="idx"
                class="form-input"
                [value]="getNextIndex()"
                min="1"
              />
            </div>
          </div>

          <div class="form-row" *ngIf="songForm.get('mode')?.value === 'prepared'">
            <div class="form-group">
              <label>Titre *</label>
              <input
                type="text"
                formControlName="title"
                class="form-input"
                placeholder="Titre de la chanson"
              />
            </div>
            <div class="form-group">
              <label>Artiste *</label>
              <input
                type="text"
                formControlName="artist"
                class="form-input"
                placeholder="Nom de l'artiste"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Durée (secondes)</label>
              <input
                type="number"
                formControlName="duration"
                class="form-input"
                [placeholder]="currentRound?.default_duration_s + ' (défaut)'"
                min="5"
                max="120"
              />
            </div>
            <div class="form-group">
              <label>Alias (séparés par ;)</label>
              <input
                type="text"
                formControlName="aliases"
                class="form-input"
                placeholder="alias1;alias2;alias3"
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="button" (click)="showAddForm = false" class="btn btn-secondary">
              Annuler
            </button>
            <button
              type="submit"
              [disabled]="songForm.invalid || isSubmitting"
              class="btn btn-primary"
            >
              {{ isSubmitting ? '⏳' : '✨ Ajouter' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Songs List -->
      <div class="songs-section">
        <h2>Chansons du round ({{ songs.length }})</h2>

        <div *ngIf="songs.length === 0" class="empty-state">
          <div class="empty-icon">🎵</div>
          <h3>Aucune chanson ajoutée</h3>
          <p>Commencez par ajouter des chansons à ce round pour pouvoir lancer le blind test.</p>
        </div>

        <div *ngIf="songs.length > 0" class="songs-list">
          <div
            *ngFor="let song of songs; trackBy: trackSong"
            class="song-item"
            [class.prepared]="song.mode === 'prepared'"
            [class.freestyle]="song.mode === 'freestyle'"
          >
            <div class="song-index">{{ song.idx }}</div>

            <div class="song-info">
              <div class="song-title">
                {{ song.title || 'Titre à deviner' }}
                <span *ngIf="song.mode === 'freestyle'" class="mode-badge">Freestyle</span>
              </div>
              <div class="song-artist">{{ song.artist || 'Artiste à deviner' }}</div>
            </div>

            <div class="song-meta">
              <span class="duration">
                {{ song.duration || currentRound?.default_duration_s }}s
              </span>
              <span class="status" [class]="'status-' + song.status">
                {{ getStatusLabel(song.status) }}
              </span>
            </div>

            <div class="song-actions">
              <button (click)="editSong(song)" class="action-btn edit" title="Modifier">✏️</button>
              <button (click)="deleteSong(song)" class="action-btn delete" title="Supprimer">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .songs-manager {
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

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .event-name {
        color: #3b82f6;
        font-weight: 600;
      }

      .separator {
        color: #64748b;
      }

      .round-name {
        color: #374151;
        font-weight: 600;
      }

      .round-info {
        color: #64748b;
        font-size: 0.875rem;
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      /* Add Methods */
      .add-methods {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .method-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .method-card h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 0.5rem 0;
      }

      .method-card p {
        color: #64748b;
        font-size: 0.875rem;
        margin: 0 0 1rem 0;
      }

      .csv-import {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }

      .help-text {
        color: #64748b;
        font-size: 0.75rem;
      }

      /* Form */
      .add-form {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .song-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-group label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
      }

      .form-input {
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 0.875rem;
        transition: all 0.2s ease;
      }

      .form-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
      }

      /* Buttons */
      .btn {
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.875rem;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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

      /* Songs Section */
      .songs-section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .songs-section h2 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #374151;
        margin: 0 0 1.5rem 0;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 3rem 1rem;
      }

      .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.3;
      }

      .empty-state h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 0.5rem 0;
      }

      .empty-state p {
        color: #64748b;
        margin: 0;
      }

      /* Songs List */
      .songs-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .song-item {
        display: grid;
        grid-template-columns: 40px 1fr auto auto;
        gap: 1rem;
        align-items: center;
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        transition: all 0.2s ease;
      }

      .song-item:hover {
        border-color: #d1d5db;
        background: #f9fafb;
      }

      .song-item.prepared {
        border-left: 4px solid #10b981;
      }

      .song-item.freestyle {
        border-left: 4px solid #f59e0b;
      }

      .song-index {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: #f1f5f9;
        border-radius: 50%;
        font-weight: 600;
        color: #475569;
        font-size: 0.875rem;
      }

      .song-info {
        flex: 1;
      }

      .song-title {
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .mode-badge {
        padding: 0.125rem 0.5rem;
        background: #fbbf24;
        color: #92400e;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .song-artist {
        color: #64748b;
        font-size: 0.875rem;
      }

      .song-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;
      }

      .duration {
        font-size: 0.75rem;
        color: #64748b;
        font-family: monospace;
      }

      .status {
        padding: 0.125rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .status-pending {
        background: #f3f4f6;
        color: #374151;
      }

      .status-open {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .status-closed {
        background: #fef3c7;
        color: #92400e;
      }

      .status-scored {
        background: #d1fae5;
        color: #065f46;
      }

      .song-actions {
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

      /* Responsive */
      @media (max-width: 768px) {
        .songs-manager {
          padding: 1rem;
        }

        .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }

        .header-actions {
          width: 100%;
          justify-content: flex-start;
        }

        .add-methods {
          grid-template-columns: 1fr;
        }

        .form-row {
          grid-template-columns: 1fr;
        }

        .song-item {
          grid-template-columns: 1fr;
          gap: 0.75rem;
          text-align: left;
        }

        .song-meta {
          align-items: flex-start;
          flex-direction: row;
          justify-content: space-between;
        }
      }
    `,
  ],
})
export class SongsManagerComponent implements OnInit {
  eventId: string;
  roundId: string;
  currentEvent: Event | null = null;
  currentRound: Round | null = null;
  songs: Song[] = [];

  showAddForm = false;
  songForm: FormGroup;
  isSubmitting = false;
  isUploading = false;
  selectedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private http: HttpClient,
  ) {
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
    this.roundId = this.route.snapshot.paramMap.get('roundId') || '';

    this.songForm = this.createForm();
  }

  ngOnInit() {
    this.loadEventInfo();
    this.loadRoundInfo();
    this.loadSongs();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      mode: ['prepared', Validators.required],
      idx: [this.getNextIndex(), [Validators.required, Validators.min(1)]],
      title: [''],
      artist: [''],
      duration: [''],
      aliases: [''],
    });
  }

  loadEventInfo() {
    this.http.get<Event>(`http://localhost:3000/api/events/id/${this.eventId}`).subscribe({
      next: (event) => {
        this.currentEvent = event;
      },
      error: (error) => {
        console.error("Erreur lors du chargement de l'événement:", error);
      },
    });
  }

  loadRoundInfo() {
    this.http.get<Round>(`http://localhost:3000/api/rounds/${this.roundId}`).subscribe({
      next: (round) => {
        this.currentRound = round;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du round:', error);
      },
    });
  }

  loadSongs() {
    this.http
      .get<{ songs: Song[] }>(`http://localhost:3000/api/rounds/${this.roundId}/songs`)
      .subscribe({
        next: (response) => {
          this.songs = response.songs;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des chansons:', error);
          this.songs = [];
        },
      });
  }

  getNextIndex(): number {
    return this.songs.length + 1;
  }

  addSong() {
    if (this.songForm.valid) {
      this.isSubmitting = true;

      const formData = this.songForm.value;
      const aliases = formData.aliases
        ? formData.aliases
            .split(';')
            .map((s: string) => s.trim())
            .filter((s: string) => s)
        : [];

      const songData = {
        mode: formData.mode,
        idx: formData.idx,
        title: formData.mode === 'prepared' ? formData.title : null,
        artist: formData.mode === 'prepared' ? formData.artist : null,
        duration: formData.duration || null,
        aliases: aliases,
      };

      this.http.post(`http://localhost:3000/api/rounds/${this.roundId}/songs`, songData).subscribe({
        next: (response) => {
          console.log('✅ Chanson ajoutée:', response);
          this.isSubmitting = false;
          this.showAddForm = false;
          this.songForm.reset();
          this.songForm.patchValue({ mode: 'prepared', idx: this.getNextIndex() });
          this.loadSongs(); // Refresh list
          alert('Chanson ajoutée avec succès !');
        },
        error: (error) => {
          console.error("❌ Erreur lors de l'ajout:", error);
          this.isSubmitting = false;
          alert("Erreur lors de l'ajout de la chanson.");
        },
      });
    }
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadCSV() {
    if (!this.selectedFile) return;

    this.isUploading = true;
    const formData = new FormData();
    formData.append('csvFile', this.selectedFile);

    this.http
      .post(`http://localhost:3000/api/rounds/${this.roundId}/import-csv`, formData)
      .subscribe({
        next: (response: any) => {
          console.log('✅ Import CSV réussi:', response);
          this.isUploading = false;
          this.selectedFile = null;
          this.loadSongs(); // Refresh list
          alert(`${response.imported} chansons importées avec succès !`);
        },
        error: (error) => {
          console.error("❌ Erreur lors de l'import:", error);
          this.isUploading = false;
          alert("Erreur lors de l'import CSV.");
        },
      });
  }

  editSong(song: Song) {
    // TODO: Implement edit functionality
    console.log('Edit song:', song);
    alert('Fonction de modification à implémenter');
  }

  deleteSong(song: Song) {
    if (
      confirm(`Êtes-vous sûr de vouloir supprimer la chanson "${song.title || 'Titre inconnu'}" ?`)
    ) {
      // TODO: Implement delete functionality
      console.log('Delete song:', song);
      alert('Fonction de suppression à implémenter');
    }
  }

  getStatusLabel(status: string): string {
    const labels = {
      pending: 'En attente',
      open: 'En cours',
      closed: 'Fermé',
      scored: 'Noté',
    };
    return labels[status as keyof typeof labels] || status;
  }

  trackSong(index: number, song: Song): string {
    return song.id;
  }
}
