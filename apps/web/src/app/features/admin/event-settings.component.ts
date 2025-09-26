import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

interface EventSettings {
  defaultSongDuration?: number;
  defaultSongsPerRound?: number;
  leaderboardLiveGlobal?: boolean;
  leaderboardOnProjectorDuringTimer?: boolean;
  minTeamSize?: number;
  maxTeamSize?: number | null;
  titleSimilarityThreshold?: number;
  artistSimilarityThreshold?: number;
  dataPurgeDays?: number;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
    logoUrl?: string | null;
  };
  enableWebsockets?: boolean;
  enableHTTPFallback?: boolean;
  maxAnswerLength?: number;
  enableAliases?: boolean;
}

@Component({
  selector: 'bt-event-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h1>⚙️ Configuration de l'Événement</h1>
        <div class="event-info" *ngIf="eventName">
          <h2>{{ eventName }} ({{ eventCode }})</h2>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <p>⏳ Chargement des paramètres...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>❌ {{ error }}</p>
        <button class="btn btn-secondary" (click)="loadSettings()">🔄 Réessayer</button>
      </div>

      <form *ngIf="settings && !loading" (ngSubmit)="saveSettings()" class="settings-form">
        <!-- Paramètres de jeu -->
        <div class="settings-section">
          <div class="section-header">
            <h3>🎵 Paramètres de Jeu</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label for="defaultSongDuration">Durée par chanson (secondes) :</label>
              <input
                type="number"
                id="defaultSongDuration"
                [(ngModel)]="settings.defaultSongDuration"
                name="defaultSongDuration"
                min="5"
                max="120"
                class="form-control"
              />
              <small class="help-text">Entre 5 et 120 secondes</small>
            </div>
            <div class="form-group">
              <label for="defaultSongsPerRound">Chansons par round :</label>
              <input
                type="number"
                id="defaultSongsPerRound"
                [(ngModel)]="settings.defaultSongsPerRound"
                name="defaultSongsPerRound"
                min="1"
                max="100"
                class="form-control"
              />
              <small class="help-text">Entre 1 et 100 chansons</small>
            </div>
          </div>
        </div>

        <!-- Affichage -->
        <div class="settings-section">
          <div class="section-header">
            <h3>📺 Affichage</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [(ngModel)]="settings.leaderboardLiveGlobal"
                  name="leaderboardLiveGlobal"
                />
                Classement en temps réel (global)
              </label>
              <small class="help-text">Met à jour le classement en continu</small>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [(ngModel)]="settings.leaderboardOnProjectorDuringTimer"
                  name="leaderboardOnProjectorDuringTimer"
                />
                Classement sur projecteur pendant le timer
              </label>
              <small class="help-text">Affiche le classement sur le projecteur même pendant les questions</small>
            </div>
          </div>
        </div>

        <!-- Équipes -->
        <div class="settings-section">
          <div class="section-header">
            <h3>👥 Gestion des Équipes</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label for="minTeamSize">Taille minimum équipe :</label>
              <input
                type="number"
                id="minTeamSize"
                [(ngModel)]="settings.minTeamSize"
                name="minTeamSize"
                min="1"
                max="50"
                class="form-control"
              />
              <small class="help-text">Nombre minimum de joueurs par équipe</small>
            </div>
            <div class="form-group">
              <label for="maxTeamSize">Taille maximum équipe :</label>
              <input
                type="number"
                id="maxTeamSize"
                [(ngModel)]="settings.maxTeamSize"
                name="maxTeamSize"
                min="1"
                max="50"
                class="form-control"
                placeholder="Illimité"
              />
              <small class="help-text">Laissez vide pour aucune limite</small>
            </div>
          </div>
        </div>

        <!-- Algorithme de matching -->
        <div class="settings-section">
          <div class="section-header">
            <h3>🎯 Algorithme de Correspondance</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label for="titleSimilarityThreshold">Seuil similarité titre :</label>
              <input
                type="range"
                id="titleSimilarityThreshold"
                [(ngModel)]="settings.titleSimilarityThreshold"
                name="titleSimilarityThreshold"
                min="0.1"
                max="1"
                step="0.05"
                class="range-control"
              />
              <div class="range-value">{{ (settings.titleSimilarityThreshold! * 100) | number:'1.0-0' }}%</div>
              <small class="help-text">Plus faible = plus permissif</small>
            </div>
            <div class="form-group">
              <label for="artistSimilarityThreshold">Seuil similarité artiste :</label>
              <input
                type="range"
                id="artistSimilarityThreshold"
                [(ngModel)]="settings.artistSimilarityThreshold"
                name="artistSimilarityThreshold"
                min="0.1"
                max="1"
                step="0.05"
                class="range-control"
              />
              <div class="range-value">{{ (settings.artistSimilarityThreshold! * 100) | number:'1.0-0' }}%</div>
              <small class="help-text">Plus faible = plus permissif</small>
            </div>
          </div>
        </div>

        <!-- Thème -->
        <div class="settings-section">
          <div class="section-header">
            <h3>🎨 Thème et Apparence</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label for="primaryColor">Couleur primaire :</label>
              <div class="color-input-group">
                <input
                  type="color"
                  id="primaryColor"
                  [(ngModel)]="settings.theme!.primaryColor"
                  name="primaryColor"
                  class="color-control"
                />
                <input
                  type="text"
                  [(ngModel)]="settings.theme!.primaryColor"
                  name="primaryColorText"
                  class="form-control color-text"
                  placeholder="#8B4513"
                />
              </div>
            </div>
            <div class="form-group">
              <label for="secondaryColor">Couleur secondaire :</label>
              <div class="color-input-group">
                <input
                  type="color"
                  id="secondaryColor"
                  [(ngModel)]="settings.theme!.secondaryColor"
                  name="secondaryColor"
                  class="color-control"
                />
                <input
                  type="text"
                  [(ngModel)]="settings.theme!.secondaryColor"
                  name="secondaryColorText"
                  class="form-control color-text"
                  placeholder="#DAA520"
                />
              </div>
            </div>
            <div class="form-group">
              <label for="backgroundColor">Couleur de fond :</label>
              <div class="color-input-group">
                <input
                  type="color"
                  id="backgroundColor"
                  [(ngModel)]="settings.theme!.backgroundColor"
                  name="backgroundColor"
                  class="color-control"
                />
                <input
                  type="text"
                  [(ngModel)]="settings.theme!.backgroundColor"
                  name="backgroundColorText"
                  class="form-control color-text"
                  placeholder="#FDF5E6"
                />
              </div>
            </div>
            <div class="form-group full-width">
              <label for="logoUrl">URL du logo personnalisé :</label>
              <input
                type="url"
                id="logoUrl"
                [(ngModel)]="settings.theme!.logoUrl"
                name="logoUrl"
                class="form-control"
                placeholder="https://exemple.com/logo.png"
              />
              <small class="help-text">URL d'une image pour remplacer le logo par défaut</small>
            </div>
          </div>
        </div>

        <!-- Maintenance -->
        <div class="settings-section">
          <div class="section-header">
            <h3>🧹 Maintenance</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label for="dataPurgeDays">Purge automatique (jours) :</label>
              <input
                type="number"
                id="dataPurgeDays"
                [(ngModel)]="settings.dataPurgeDays"
                name="dataPurgeDays"
                min="1"
                max="365"
                class="form-control"
              />
              <small class="help-text">Nombre de jours avant suppression automatique des données</small>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="resetToDefaults()">
            🔄 Réinitialiser
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            {{ saving ? '⏳ Enregistrement...' : '💾 Enregistrer' }}
          </button>
        </div>
      </form>

      <div class="save-result" *ngIf="saveResult">
        <div class="alert alert-success" *ngIf="saveResult.success">
          ✅ {{ saveResult.message }}
        </div>
        <div class="alert alert-error" *ngIf="!saveResult.success">
          ❌ {{ saveResult.message }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .settings-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .settings-header h1 {
      font-size: 2.5rem;
      color: var(--autumn-burgundy);
      margin-bottom: 1rem;
    }

    .event-info h2 {
      font-size: 1.5rem;
      color: var(--autumn-brown);
      margin: 0;
    }

    .loading, .error {
      text-align: center;
      padding: 3rem;
      font-size: 1.2rem;
    }

    .error {
      color: #d32f2f;
    }

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .settings-section {
      background: white;
      border: 2px solid var(--autumn-gold);
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 4px 12px var(--autumn-shadow);
    }

    .section-header {
      background: linear-gradient(135deg, var(--autumn-gold), var(--autumn-copper));
      color: white;
      padding: 1.5rem;
    }

    .section-header h3 {
      margin: 0;
      font-size: 1.3rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      padding: 2rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-weight: 600;
      color: var(--autumn-brown);
      margin-bottom: 0.5rem;
    }

    .checkbox-label {
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
    }

    .form-control {
      padding: 0.75rem;
      border: 2px solid var(--autumn-soft-yellow);
      border-radius: 8px;
      font-size: 1rem;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--autumn-gold);
    }

    .range-control {
      width: 100%;
      margin-bottom: 0.5rem;
    }

    .range-value {
      text-align: center;
      font-weight: 600;
      color: var(--autumn-burgundy);
      font-size: 1.1rem;
    }

    .color-input-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .color-control {
      width: 60px;
      height: 45px;
      padding: 0;
      border: 2px solid var(--autumn-gold);
      border-radius: 8px;
      cursor: pointer;
    }

    .color-text {
      flex: 1;
      min-width: 100px;
    }

    .help-text {
      color: var(--autumn-brown);
      font-size: 0.9rem;
      font-style: italic;
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      padding: 2rem 0;
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

    .save-result {
      margin-top: 1.5rem;
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      font-weight: 600;
      text-align: center;
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

    @media (max-width: 768px) {
      .settings-container {
        padding: 1rem;
      }

      .settings-header h1 {
        font-size: 2rem;
      }

      .form-grid {
        grid-template-columns: 1fr;
        padding: 1.5rem;
      }

      .form-actions {
        flex-direction: column;
        align-items: center;
      }

      .color-input-group {
        flex-direction: column;
        align-items: stretch;
      }

      .color-control {
        width: 100%;
        height: 50px;
      }
    }
  `]
})
export class EventSettingsComponent implements OnInit {
  eventCode!: string;
  eventName = '';
  settings: EventSettings | null = null;
  loading = false;
  saving = false;
  error = '';
  saveResult: { success: boolean; message: string } | null = null;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.eventCode = this.route.snapshot.params['eventCode'];
    this.loadSettings();
  }

  loadSettings() {
    this.loading = true;
    this.error = '';

    this.api.getEventSettings(this.eventCode).subscribe({
      next: (data) => {
        this.settings = data.settings;
        this.eventName = data.eventName;
        this.loading = false;

        // Ensure theme object exists
        if (!this.settings?.theme) {
          this.settings!.theme = {};
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement des paramètres';
        this.loading = false;
        console.error('Settings load error:', err);
      }
    });
  }

  saveSettings() {
    if (!this.settings) return;

    this.saving = true;
    this.saveResult = null;

    this.api.updateEventSettings(this.eventCode, this.settings).subscribe({
      next: (result) => {
        this.saving = false;
        this.saveResult = {
          success: true,
          message: result.message || 'Paramètres enregistrés avec succès'
        };
        setTimeout(() => this.saveResult = null, 5000);
      },
      error: (err) => {
        this.saving = false;
        this.saveResult = {
          success: false,
          message: err.error?.message || 'Erreur lors de l\'enregistrement'
        };
        console.error('Settings save error:', err);
      }
    });
  }

  resetToDefaults() {
    if (confirm('Réinitialiser tous les paramètres aux valeurs par défaut ?')) {
      this.loadSettings();
    }
  }
}