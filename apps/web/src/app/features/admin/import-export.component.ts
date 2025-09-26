import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'bt-import-export',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="import-export-container">
      <div class="section-header">
        <h1>📊 Import / Export</h1>
        <p>Gestion des playlists et export des scores</p>
      </div>

      <!-- Import CSV -->
      <div class="card">
        <div class="card-header">
          <h2>📤 Import Playlist CSV</h2>
        </div>
        <div class="card-body">
          <div class="round-selector">
            <label for="roundSelect">Round cible :</label>
            <select id="roundSelect" [(ngModel)]="selectedRoundId" class="form-control">
              <option value="">Sélectionner un round...</option>
              <option *ngFor="let round of rounds" [value]="round.id">
                {{ round.name || 'Round ' + round.id }}
              </option>
            </select>
          </div>

          <div class="file-upload">
            <label for="csvFile">Fichier CSV :</label>
            <input
              type="file"
              id="csvFile"
              accept=".csv"
              (change)="onFileSelected($event)"
              class="form-control"
            />
            <small class="help-text">
              Format attendu : title, artist, aliases (optionnel), duration (optionnel)
            </small>
          </div>

          <div class="import-options">
            <label>
              <input
                type="checkbox"
                [(ngModel)]="clearExisting"
              />
              Effacer les chansons existantes du round
            </label>
          </div>

          <div class="import-actions">
            <button
              class="btn btn-primary"
              [disabled]="!selectedFile || !selectedRoundId || importing"
              (click)="importCSV()"
            >
              {{ importing ? '⏳ Import en cours...' : '📤 Importer' }}
            </button>
          </div>

          <div class="import-result" *ngIf="importResult">
            <div class="alert alert-success" *ngIf="importResult.success">
              ✅ {{ importResult.message }}
              <br>{{ importResult.imported }} chanson(s) importée(s)
            </div>
            <div class="alert alert-error" *ngIf="!importResult.success">
              ❌ {{ importResult.message }}
            </div>
          </div>
        </div>
      </div>

      <!-- Export CSV -->
      <div class="card">
        <div class="card-header">
          <h2>📥 Export Scores CSV</h2>
        </div>
        <div class="card-body">
          <div class="export-options">
            <div class="export-option">
              <h3>📋 Export Simple</h3>
              <p>Classement des équipes avec scores totaux</p>
              <button
                class="btn btn-secondary"
                [disabled]="exporting.simple"
                (click)="exportScores('simple')"
              >
                {{ exporting.simple ? '⏳ Export...' : '📥 Télécharger' }}
              </button>
            </div>

            <div class="export-option">
              <h3>📋 Export Détaillé</h3>
              <p>Toutes les réponses avec détail par chanson</p>
              <button
                class="btn btn-secondary"
                [disabled]="exporting.detailed"
                (click)="exportScores('detailed')"
              >
                {{ exporting.detailed ? '⏳ Export...' : '📥 Télécharger' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Format d'exemple -->
      <div class="card">
        <div class="card-header">
          <h2>📝 Format CSV Import</h2>
        </div>
        <div class="card-body">
          <p>Exemple de format CSV pour l'import de playlist :</p>
          <div class="csv-example">
            <code>
title,artist,aliases,duration<br>
"Billie Jean","Michael Jackson","MJ",30<br>
"Shape of You","Ed Sheeran","",25<br>
"Smells Like Teen Spirit","Nirvana","",28<br>
            </code>
          </div>
          <div class="format-notes">
            <h4>Notes :</h4>
            <ul>
              <li><strong>title</strong> : Titre de la chanson (obligatoire)</li>
              <li><strong>artist</strong> : Artiste ou groupe (obligatoire)</li>
              <li><strong>aliases</strong> : Alias séparés par des virgules (optionnel)</li>
              <li><strong>duration</strong> : Durée en secondes (optionnel, défaut : paramètre du round)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .import-export-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .section-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .section-header h1 {
      font-size: 2.5rem;
      color: var(--autumn-burgundy);
      margin-bottom: 0.5rem;
    }

    .section-header p {
      color: var(--autumn-brown);
      font-size: 1.2rem;
    }

    .card {
      background: white;
      border: 2px solid var(--autumn-gold);
      border-radius: 15px;
      margin-bottom: 2rem;
      box-shadow: 0 4px 12px var(--autumn-shadow);
    }

    .card-header {
      background: linear-gradient(135deg, var(--autumn-gold), var(--autumn-copper));
      color: white;
      padding: 1.5rem;
      border-radius: 13px 13px 0 0;
    }

    .card-header h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .card-body {
      padding: 2rem;
    }

    .round-selector,
    .file-upload,
    .import-options {
      margin-bottom: 1.5rem;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid var(--autumn-soft-yellow);
      border-radius: 8px;
      font-size: 1rem;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--autumn-gold);
    }

    .help-text {
      color: var(--autumn-brown);
      font-style: italic;
      margin-top: 0.5rem;
      display: block;
    }

    .import-options label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--autumn-brown);
    }

    .import-actions {
      display: flex;
      justify-content: center;
    }

    .btn {
      padding: 0.8rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn:hover:not(:disabled) {
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

    .import-result {
      margin-top: 1.5rem;
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      font-weight: 600;
    }

    .alert-success {
      background: #e8f5e8;
      color: #2e7d32;
      border: 1px solid #4caf50;
    }

    .alert-error {
      background: #ffebee;
      color: #c62828;
      border: 1px solid #f44336;
    }

    .export-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .export-option {
      text-align: center;
      padding: 1.5rem;
      background: var(--autumn-cream);
      border-radius: 10px;
    }

    .export-option h3 {
      color: var(--autumn-burgundy);
      margin-bottom: 0.5rem;
    }

    .export-option p {
      color: var(--autumn-brown);
      margin-bottom: 1rem;
    }

    .csv-example {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 5px;
      font-family: 'Courier New', monospace;
      margin-bottom: 1rem;
    }

    .format-notes {
      background: var(--autumn-cream);
      padding: 1.5rem;
      border-radius: 10px;
    }

    .format-notes h4 {
      color: var(--autumn-burgundy);
      margin-bottom: 1rem;
    }

    .format-notes ul {
      color: var(--autumn-brown);
    }

    .format-notes li {
      margin-bottom: 0.5rem;
    }

    @media (max-width: 768px) {
      .import-export-container {
        padding: 1rem;
      }

      .section-header h1 {
        font-size: 2rem;
      }

      .card-body {
        padding: 1.5rem;
      }

      .export-options {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
  `]
})
export class ImportExportComponent implements OnInit {
  eventCode!: string;
  rounds: Array<{ id: string; name: string | null }> = [];
  selectedRoundId = '';
  selectedFile: File | null = null;
  clearExisting = false;
  importing = false;
  importResult: { success: boolean; message: string; imported?: number } | null = null;
  exporting = { simple: false, detailed: false };

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.eventCode = this.route.snapshot.params['eventCode'];
    this.loadRounds();
  }

  loadRounds() {
    this.api.getRounds(this.eventCode).subscribe({
      next: (rounds) => {
        this.rounds = rounds;
        if (rounds.length > 0 && !this.selectedRoundId) {
          this.selectedRoundId = rounds[0].id;
        }
      },
      error: (err) => {
        console.error('Erreur chargement rounds:', err);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      this.selectedFile = file;
      this.importResult = null;
    } else {
      this.selectedFile = null;
      alert('Veuillez sélectionner un fichier CSV valide');
    }
  }

  importCSV() {
    if (!this.selectedFile || !this.selectedRoundId) return;

    this.importing = true;
    this.importResult = null;

    const formData = new FormData();
    formData.append('csv', this.selectedFile);
    if (this.clearExisting) {
      formData.append('clearExisting', 'true');
    }

    this.api.importPlaylistCSV(this.selectedRoundId, formData).subscribe({
      next: (result) => {
        this.importing = false;
        this.importResult = {
          success: true,
          message: result.message,
          imported: result.imported
        };
        // Reset form
        this.selectedFile = null;
        const fileInput = document.getElementById('csvFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      },
      error: (err) => {
        this.importing = false;
        this.importResult = {
          success: false,
          message: err.error?.message || 'Erreur lors de l\'import'
        };
        console.error('Import error:', err);
      }
    });
  }

  exportScores(type: 'simple' | 'detailed') {
    this.exporting[type] = true;

    const endpoint = type === 'simple'
      ? this.api.exportScoresCSV(this.eventCode)
      : this.api.exportDetailedScoresCSV(this.eventCode);

    endpoint.subscribe({
      next: (blob: Blob) => {
        this.exporting[type] = false;

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = type === 'simple'
          ? `blindtest_scores_${this.eventCode}_${timestamp}.csv`
          : `blindtest_detailed_${this.eventCode}_${timestamp}.csv`;

        link.download = filename;
        link.click();

        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.exporting[type] = false;
        alert('Erreur lors de l\'export: ' + (err.error?.message || err.message));
        console.error('Export error:', err);
      }
    });
  }
}