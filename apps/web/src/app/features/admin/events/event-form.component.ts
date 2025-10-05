import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ThemeConfig, ThemeService } from '../../../core/services/theme.service';
import { EventService } from '../../../core/services/event.service';

interface ThemePreview {
  primary: string;
  secondary: string;
  background: string;
  gradient: string;
  accent?: string;
}

interface ApiTheme {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: ThemePreview;
  colors?: ThemePreview;
}

@Component({
  selector: 'bt-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  template: `
    <div class="event-form">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">
          <ng-container *ngIf="isEdit; else newTitle">Modifier l'événement</ng-container>
        </h1>
        <ng-template #newTitle> Nouvel événement </ng-template>
        <p class="page-description">
          <ng-container *ngIf="isEdit; else newDesc"
            >Modifiez les paramètres de votre événement</ng-container
          >
        </p>
        <ng-template #newDesc> Créez un nouveau blind test musical </ng-template>
      </div>

      <!-- Form -->
      <div class="form-container">
        <form [formGroup]="eventForm" (ngSubmit)="onSubmit()">
          <!-- Basic Information -->
          <div class="form-section">
            <h2 class="section-title">Informations générales</h2>

            <div class="form-grid">
              <div class="form-group">
                <label for="name" class="form-label">
                  Nom de l'événement <span class="required">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  formControlName="name"
                  class="form-input"
                  placeholder="Ex: Soirée Blind Test 2024"
                />
                <div
                  *ngIf="
                    eventForm.get('name')?.errors?.['required'] && eventForm.get('name')?.touched
                  "
                  class="form-error"
                >
                  Le nom est obligatoire
                </div>
              </div>

              <div class="form-group">
                <label for="code" class="form-label">
                  Code d'accès <span class="required">*</span>
                </label>
                <div class="code-input-group">
                  <input
                    id="code"
                    type="text"
                    formControlName="code"
                    class="form-input code-input"
                    placeholder="PARTY2024"
                    [class.readonly]="isEdit"
                  />
                  <button
                    type="button"
                    (click)="generateCode()"
                    class="generate-btn"
                    [disabled]="isEdit"
                  >
                    🎲 Générer
                  </button>
                </div>
                <small class="form-help">
                  <ng-container *ngIf="isEdit; else codeHelp"
                    >Le code ne peut pas être modifié après création</ng-container
                  >
                </small>
                <ng-template #codeHelp>
                  Code unique que les joueurs utiliseront pour rejoindre
                </ng-template>
                <div
                  *ngIf="
                    eventForm.get('code')?.errors?.['required'] && eventForm.get('code')?.touched
                  "
                  class="form-error"
                >
                  Le code est obligatoire
                </div>
              </div>
            </div>
          </div>

          <!-- Theme Selection -->
          <div class="form-section">
            <h2 class="section-title">🎨 Thème visuel</h2>

            <div class="theme-selection">
              <p class="section-description">
                Choisissez le thème qui correspond au type de votre événement. Cela personnalisera
                l'interface pour tous les participants.
              </p>

              <div class="theme-grid">
                <!-- Message si aucun thème -->
                <div *ngIf="availableThemes.length === 0" class="no-themes-message">
                  <p>⏳ Chargement des thèmes...</p>
                  <p>
                    <small>{{ availableThemes.length }} thèmes disponibles</small>
                  </p>
                </div>

                <!-- Liste des thèmes -->
                <div
                  *ngFor="let theme of pagedThemes; trackBy: trackTheme"
                  class="theme-option"
                  [class.selected]="eventForm.get('themeId')?.value === theme.id"
                  (click)="selectTheme(theme.id)"
                  [attr.data-theme-id]="theme.id"
                >
                  <div
                    class="theme-preview"
                    [style.background]="
                      theme.preview.gradient ||
                      theme.colors?.gradient ||
                      theme.preview.primary ||
                      theme.colors?.primary
                    "
                  >
                    <div class="theme-overlay">
                      <span class="theme-icon">{{ getThemeIcon(theme.category) }}</span>
                    </div>
                  </div>

                  <div class="theme-info">
                    <h4 class="theme-name">{{ theme.name }}</h4>
                    <p class="theme-description">{{ theme.description }}</p>
                    <span class="theme-category">{{ getCategoryLabel(theme.category) }}</span>
                  </div>

                  <div class="theme-colors">
                    <div
                      class="color-dot"
                      [style.background-color]="theme.preview.primary || theme.colors?.primary"
                    ></div>
                    <div
                      class="color-dot"
                      [style.background-color]="theme.preview.secondary || theme.colors?.secondary"
                    ></div>
                    <div
                      class="color-dot"
                      [style.background-color]="theme.colors?.accent || theme.preview.primary"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Pagination -->
              <div class="pagination" *ngIf="totalPages > 1">
                <button
                  type="button"
                  class="page-btn"
                  [disabled]="currentPage === 1"
                  (click)="prevPage()"
                >
                  ◀
                </button>
                <button
                  type="button"
                  class="page-btn"
                  *ngFor="let p of pageNumbers"
                  [class.active]="p === currentPage"
                  (click)="goToPage(p)"
                >
                  {{ p }}
                </button>
                <button
                  type="button"
                  class="page-btn"
                  [disabled]="currentPage === totalPages"
                  (click)="nextPage()"
                >
                  ▶
                </button>
              </div>
            </div>
          </div>

          <!-- Settings -->
          <div class="form-section">
            <h2 class="section-title">Paramètres par défaut</h2>

            <div class="form-grid">
              <div class="form-group">
                <label for="defaultSongDuration" class="form-label">
                  Durée par défaut des chansons (secondes)
                </label>
                <input
                  id="defaultSongDuration"
                  type="number"
                  formControlName="defaultSongDuration"
                  class="form-input"
                  min="5"
                  max="60"
                />
              </div>

              <div class="form-group">
                <label for="defaultSongsPerRound" class="form-label">
                  Nombre de chansons par round
                </label>
                <input
                  id="defaultSongsPerRound"
                  type="number"
                  formControlName="defaultSongsPerRound"
                  class="form-input"
                  min="1"
                  max="50"
                />
              </div>
            </div>

            <!-- Advanced Settings -->
            <div class="advanced-settings">
              <h3 class="subsection-title">Paramètres avancés</h3>

              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    formControlName="leaderboardLiveGlobal"
                    class="checkbox-input"
                  />
                  <span class="checkbox-custom"></span>
                  <div class="checkbox-content">
                    <span class="checkbox-title">Classement en temps réel</span>
                    <span class="checkbox-description"
                      >Afficher le classement global en direct</span
                    >
                  </div>
                </label>

                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    formControlName="leaderboardOnProjectorDuringTimer"
                    class="checkbox-input"
                  />
                  <span class="checkbox-custom"></span>
                  <div class="checkbox-content">
                    <span class="checkbox-title">Classement sur projecteur</span>
                    <span class="checkbox-description"
                      >Afficher le classement pendant le timer sur l'écran principal</span
                    >
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" (click)="onCancel()" class="btn btn-secondary">Annuler</button>
            <button
              type="submit"
              [disabled]="eventForm.invalid || isSubmitting"
              class="btn btn-primary"
            >
              <span *ngIf="isSubmitting">⏳</span>
              <span *ngIf="!isSubmitting && isEdit">💾 Sauvegarder</span>
              <span *ngIf="!isSubmitting && !isEdit">✨ Créer l'événement</span>
            </button>
          </div>
        </form>

        <aside class="preview-aside">
          <!-- Preview -->
          <div class="preview-section">
            <h3 class="preview-title">Aperçu</h3>
            <div class="preview-card" [ngStyle]="getPreviewThemeVars()">
              <div class="preview-theme-banner" [style.background]="getGradientBackground()"></div>
              <div class="preview-header">
                <div class="preview-info">
                  <h4 class="preview-name">{{ eventNamePreview }}</h4>
                  <p class="preview-code">Code: {{ eventCodePreview }}</p>
                </div>
                <div
                  class="preview-status"
                  [style.background]="getBadgeBg()"
                  [style.color]="getBadgeFg()"
                >
                  Brouillon
                </div>
              </div>
              <div class="preview-settings">
                <div class="preview-setting">
                  <span class="setting-icon">⏱️</span>
                  <span>{{ songsDurationPreview }}s par chanson</span>
                </div>
                <div class="preview-setting">
                  <span class="setting-icon">🎵</span>
                  <span>{{ songsPerRoundPreview }} chansons/round</span>
                </div>
                <div class="preview-setting">
                  <span class="setting-icon">🎨</span>
                  <span>{{ getSelectedThemeName() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Player Preview -->
          <div class="preview-section">
            <h3 class="preview-title">Aperçu Joueur</h3>
            <div class="preview-card">
              <div class="player-device" [ngStyle]="getPlayerPreviewVars()">
                <div class="player-header">
                  <div class="player-title">{{ eventNamePreview }}</div>
                  <div class="player-code">#{{ eventCodePreview }}</div>
                </div>
                <div class="player-content">
                  <div class="player-timer">
                    <div class="timer-circle">
                      <div class="timer-value">{{ songsDurationPreview }}s</div>
                    </div>
                  </div>
                  <div class="player-answer">
                    <input type="text" placeholder="Votre réponse…" disabled />
                  </div>
                  <div class="player-buzzer">
                    <button type="button" disabled>BUZZ!</button>
                  </div>
                  <div class="player-progress">
                    <div class="bar"></div>
                  </div>
                </div>
                <div class="player-footer">
                  <div class="chip">🎵 {{ songsPerRoundPreview }} chansons/round</div>
                  <div class="chip">🎨 {{ getSelectedThemeName() }}</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [
    `
      .event-form {
        max-width: 1000px;
        margin: 0 auto;
      }

      /* Page Header */
      .page-header {
        margin-bottom: 2rem;
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

      /* Form Container */
      .form-container {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 2rem;
      }

      .preview-aside {
        grid-column: 2;
        position: sticky;
        top: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-self: start;
        height: fit-content;
      }

      /* Form Sections */
      .form-section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 2rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .section-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #374151;
        margin: 0 0 1.5rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .subsection-title {
        font-size: 1rem;
        font-weight: 600;
        color: #475569;
        margin: 1.5rem 0 1rem 0;
      }

      /* Form Grid */
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .form-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      .required {
        color: #ef4444;
      }

      .form-input {
        padding: 0.75rem 1rem;
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

      .form-input.readonly {
        background-color: #f9fafb;
        cursor: not-allowed;
      }

      .form-help {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 0.25rem;
      }

      .form-error {
        font-size: 0.75rem;
        color: #ef4444;
        margin-top: 0.25rem;
      }

      /* Code Input Group */
      .code-input-group {
        display: flex;
        gap: 0.5rem;
      }

      .code-input {
        flex: 1;
        font-family: 'JetBrains Mono', monospace;
        text-transform: uppercase;
      }

      .generate-btn {
        padding: 0.75rem 1rem;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        color: #475569;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .generate-btn:hover:not(:disabled) {
        background: #e2e8f0;
        border-color: #94a3b8;
      }

      .generate-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Checkbox Group */
      .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        cursor: pointer;
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        transition: all 0.2s ease;
      }

      .checkbox-label:hover {
        border-color: #d1d5db;
        background: #f9fafb;
      }

      .checkbox-input {
        display: none;
      }

      .checkbox-custom {
        width: 20px;
        height: 20px;
        border: 2px solid #d1d5db;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
        margin-top: 0.125rem;
      }

      .checkbox-input:checked + .checkbox-custom {
        background: #3b82f6;
        border-color: #3b82f6;
      }

      .checkbox-input:checked + .checkbox-custom::after {
        content: '✓';
        color: white;
        font-size: 0.75rem;
        font-weight: bold;
      }

      .checkbox-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .checkbox-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
      }

      .checkbox-description {
        font-size: 0.75rem;
        color: #64748b;
      }

      /* Form Actions */
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding-top: 2rem;
        border-top: 1px solid #e5e7eb;
      }

      .btn {
        padding: 0.75rem 2rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
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

      /* Preview Section */
      .preview-section {
        position: relative;
      }

      .player-preview {
        position: static;
        margin-top: 1rem;
      }

      .preview-title {
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 1rem;
      }

      .preview-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .preview-theme-banner {
        height: 52px;
        border-radius: 10px;
        margin: -0.5rem -0.5rem 1rem -0.5rem;
        box-shadow: inset 0 -10px 24px rgba(0, 0, 0, 0.12);
      }

      .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
      }

      .preview-name {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 0.25rem 0;
      }

      .preview-code {
        font-size: 0.875rem;
        color: #64748b;
        font-family: 'JetBrains Mono', monospace;
        margin: 0;
      }

      .preview-status {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      /* Player Preview */
      .player-device {
        border-radius: 16px;
        border: 1px solid var(--p-border, #e5e7eb);
        overflow: hidden;
        background: var(--p-bg, #0b1020);
        color: var(--p-text, #e5e7eb);
        font-family: var(--p-font, 'Inter', system-ui, sans-serif);
      }
      .player-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background: var(--p-gradient, linear-gradient(135deg, #22d3ee, #6366f1));
        color: #fff;
      }
      .player-title {
        font-weight: 800;
        letter-spacing: 0.2px;
      }
      .player-code {
        font-family: 'JetBrains Mono', monospace;
        opacity: 0.9;
      }
      .player-content {
        padding: 14px;
        display: grid;
        gap: 12px;
      }
      .player-timer {
        display: flex;
        justify-content: center;
      }
      .timer-circle {
        width: 86px;
        height: 86px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at 30% 30%, var(--p-secondary, #60a5fa), transparent 70%),
          radial-gradient(circle at 70% 70%, var(--p-primary, #22d3ee), transparent 70%),
          rgba(255, 255, 255, 0.06);
        border: 2px solid var(--p-border, #1f2937);
        box-shadow:
          inset 0 12px 32px rgba(0, 0, 0, 0.25),
          0 2px 8px rgba(0, 0, 0, 0.2);
      }
      .timer-value {
        font-weight: 900;
        font-size: 1.1rem;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
      }
      .player-answer input {
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid var(--p-border, #2b3443);
        background: rgba(255, 255, 255, 0.06);
        color: var(--p-text, #e5e7eb);
      }
      .player-answer input::placeholder {
        color: var(--p-text-secondary, #94a3b8);
      }
      .player-buzzer {
        display: flex;
        justify-content: center;
      }
      .player-buzzer button {
        padding: 10px 20px;
        border-radius: 999px;
        border: 1px solid transparent;
        background: linear-gradient(135deg, var(--p-primary, #22d3ee), var(--p-secondary, #6366f1));
        color: #fff;
        font-weight: 800;
        letter-spacing: 0.5px;
        box-shadow: 0 8px 20px rgba(99, 102, 241, 0.35);
      }
      .player-progress {
        height: 8px;
        background: rgba(255, 255, 255, 0.06);
        border-radius: 999px;
        overflow: hidden;
      }
      .player-progress .bar {
        height: 100%;
        width: 65%;
        background: var(--p-gradient, linear-gradient(90deg, #22d3ee, #a855f7));
      }
      .player-footer {
        display: flex;
        gap: 8px;
        padding: 10px 14px;
        border-top: 1px solid var(--p-border, #1f2937);
      }
      .chip {
        padding: 4px 8px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid var(--p-border, #1f2937);
        font-size: 0.8rem;
      }

      .preview-settings {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .preview-setting {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #64748b;
      }

      .setting-icon {
        font-size: 1rem;
      }

      /* Theme Selection */
      .section-description {
        color: #64748b;
        font-size: 0.875rem;
        margin-bottom: 1.5rem;
        line-height: 1.5;
      }

      .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
      }

      .theme-option {
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s ease;
        background: white;
      }

      .theme-option:hover {
        border-color: #d1d5db;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }

      .theme-option.selected {
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6;
      }

      .theme-preview {
        height: 60px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .theme-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .theme-icon {
        font-size: 1.5rem;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
      }

      .theme-info {
        padding: 1rem;
        padding-bottom: 0.75rem;
      }

      .theme-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 0.25rem 0;
      }

      .theme-description {
        font-size: 0.75rem;
        color: #64748b;
        margin: 0 0 0.5rem 0;
        line-height: 1.4;
      }

      .theme-category {
        display: inline-block;
        padding: 0.125rem 0.5rem;
        background: #f1f5f9;
        color: #475569;
        border-radius: 12px;
        font-size: 0.625rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .theme-colors {
        display: flex;
        gap: 0.25rem;
        padding: 0 1rem 1rem 1rem;
      }

      .color-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .no-themes-message {
        grid-column: 1 / -1;
        text-align: center;
        padding: 2rem;
        color: #64748b;
        border: 2px dashed #e5e7eb;
        border-radius: 12px;
      }

      .no-themes-message p {
        margin: 0.5rem 0;
      }

      /* Pagination */
      .pagination {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        margin-top: 0.75rem;
        justify-content: center;
      }
      .page-btn {
        min-width: 34px;
        height: 34px;
        padding: 0 0.5rem;
        border-radius: 8px;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #475569;
        font-weight: 600;
        cursor: pointer;
      }
      .page-btn:hover:not(:disabled) {
        background: #e2e8f0;
      }
      .page-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .page-btn.active {
        background: #3b82f6;
        color: white;
        border-color: #2563eb;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .form-container {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .form-grid {
          grid-template-columns: 1fr;
        }

        .preview-aside {
          grid-column: 1 / -1;
          position: static;
        }

        .form-actions {
          flex-direction: column-reverse;
        }

        .btn {
          width: 100%;
          justify-content: center;
        }

        .theme-grid {
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }

        .theme-option {
          margin-bottom: 0.5rem;
        }
      }
    `,
  ],
})
export class EventFormComponent implements OnInit {
  eventForm: FormGroup;
  isEdit = false;
  isSubmitting = false;
  eventId: string | null = null;
  availableThemes: ApiTheme[] = [];
  // Pagination
  currentPage = 1;
  readonly pageSize = 10;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private eventService: EventService,
    private themeService: ThemeService,
  ) {
    this.eventForm = this.createForm();
  }

  ngOnInit() {
    console.log('🚀 Initialisation du composant EventForm');
    this.eventId = this.route.snapshot.params['id'];
    this.isEdit = !!this.eventId;

    this.loadThemes();

    if (this.isEdit) {
      this.loadEvent();
    } else {
      this.generateCode();
    }

    // Debug du formulaire
    console.log('📝 Formulaire initial:', this.eventForm.value);
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{3,8}$/)]],
      themeId: ['wedding-autumn', [Validators.required]],
      defaultSongDuration: [15, [Validators.min(5), Validators.max(60)]],
      defaultSongsPerRound: [10, [Validators.min(1), Validators.max(50)]],
      leaderboardLiveGlobal: [true],
      leaderboardOnProjectorDuringTimer: [false],
    });
  }

  generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.eventForm.patchValue({ code });
  }

  loadEvent() {
    if (!this.eventId) return;
    // Charger l'événement par ID et ses settings
    this.eventService.getEventById(this.eventId).subscribe({
      next: (ev) => {
        // Charger les settings détaillés (pour récupérer themeId, etc.)
        // On utilise l'API settings par code pour récupérer les valeurs actuelles
        this.http
          .get<{
            eventCode: string;
            settings: any;
          }>(`/api/events/${ev.code}/settings`)
          .subscribe({
            next: (resp) => {
              const s = resp.settings || {};
              this.eventForm.patchValue({
                name: ev.name,
                code: ev.code,
                themeId: s.themeId || 'wedding-autumn',
                defaultSongDuration: s.defaultSongDuration ?? 15,
                defaultSongsPerRound: s.defaultSongsPerRound ?? 10,
                leaderboardLiveGlobal: s.leaderboardLiveGlobal ?? true,
                leaderboardOnProjectorDuringTimer: s.leaderboardOnProjectorDuringTimer ?? false,
              });
            },
            error: () => {
              // Fallback si l'appel settings échoue
              this.eventForm.patchValue({ name: ev.name, code: ev.code });
            },
          });
      },
      error: (err) => {
        console.error('❌ Chargement événement échoué:', err);
      },
    });
  }

  onSubmit() {
    if (this.eventForm.valid) {
      this.isSubmitting = true;

      const formData = this.eventForm.value;

      if (this.isEdit) {
        // Mise à jour
        const updatePayload = {
          name: formData.name,
          settings: {
            themeId: formData.themeId,
            defaultSongDuration: formData.defaultSongDuration,
            defaultSongsPerRound: formData.defaultSongsPerRound,
            leaderboardLiveGlobal: formData.leaderboardLiveGlobal,
            leaderboardOnProjectorDuringTimer: formData.leaderboardOnProjectorDuringTimer,
          },
        };

        this.eventService.updateEvent(this.eventId!, updatePayload).subscribe({
          next: () => {
            this.isSubmitting = false;
            alert('Événement mis à jour!');
            this.router.navigate(['/admin/events']);
          },
          error: (error) => {
            console.error('❌ Erreur de mise à jour:', error);
            this.isSubmitting = false;
            alert("Erreur lors de la mise à jour de l'événement.");
          },
        });
      } else {
        // Create new event
        const eventRequest = {
          name: formData.name,
          code: formData.code,
          settings: {
            themeId: formData.themeId,
            defaultSongDuration: formData.defaultSongDuration,
            defaultSongsPerRound: formData.defaultSongsPerRound,
            leaderboardLiveGlobal: formData.leaderboardLiveGlobal,
            leaderboardOnProjectorDuringTimer: formData.leaderboardOnProjectorDuringTimer,
          },
        };

        this.eventService.createEvent(eventRequest).subscribe({
          next: (response) => {
            console.log('✅ Événement créé:', response);
            this.isSubmitting = false;
            alert(`Événement "${response.name}" créé avec succès !`);
            this.router.navigate(['/admin/events']);
          },
          error: (error) => {
            console.error('❌ Erreur lors de la création:', error);
            this.isSubmitting = false;
            alert("Erreur lors de la création de l'événement. Vérifiez la console.");
          },
        });
      }
    }
  }

  onCancel() {
    this.router.navigate(['/admin/events']);
  }

  loadThemes() {
    console.log('🎨 Chargement des thèmes...');
    try {
      const allThemes = this.themeService.getAllThemes();
      this.availableThemes = allThemes.map((theme) => ({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        category: theme.category,
        preview: {
          primary: theme.colors.primary,
          secondary: theme.colors.secondary,
          background: theme.colors.background,
          gradient:
            theme.colors.gradient ||
            `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
        },
      }));
      console.log('✅ Thèmes chargés depuis le service local:', this.availableThemes.length);
    } catch (error) {
      console.error('Erreur lors du chargement des thèmes:', error);
      this.availableThemes = [];
    }
  }

  selectTheme(themeId: string) {
    console.log('🎨 Sélection du thème:', themeId);
    this.eventForm.patchValue({ themeId });
    console.log('📝 Formulaire après sélection:', this.eventForm.value);
  }

  getThemeIcon(category: string): string {
    const icons: { [key: string]: string } = {
      wedding: '💒',
      corporate: '🏢',
      birthday: '🎂',
      party: '🎉',
      seasonal: '🌸',
      custom: '🎨',
    };
    return icons[category] || '🎨';
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      wedding: 'Mariage',
      corporate: 'Entreprise',
      birthday: 'Anniversaire',
      party: 'Soirée',
      seasonal: 'Saisonnier',
      custom: 'Personnalisé',
    };
    return labels[category] || 'Autre';
  }

  getSelectedThemeName(): string {
    const selectedThemeId = this.eventForm.get('themeId')?.value;
    const selectedTheme = this.availableThemes.find((theme) => theme.id === selectedThemeId);
    return selectedTheme?.name || 'Thème par défaut';
  }

  trackTheme(index: number, theme: ApiTheme): string {
    return theme.id;
  }

  // --- Pagination helpers ---
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.availableThemes.length / this.pageSize));
  }

  get pagedThemes(): ApiTheme[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.availableThemes.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage += 1;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage -= 1;
  }

  // --- Template getters for safe dynamic previews ---
  get eventNamePreview(): string {
    const v = this.eventForm.get('name')?.value;
    return typeof v === 'string' && v.trim().length > 0 ? v : "Nom de l'événement";
  }

  get eventCodePreview(): string {
    const v = this.eventForm.get('code')?.value;
    return typeof v === 'string' && v.trim().length > 0 ? v.toUpperCase() : 'CODE';
  }

  get songsDurationPreview(): number {
    const v = this.eventForm.get('defaultSongDuration')?.value;
    return typeof v === 'number' && v > 0 ? v : 15;
  }

  get songsPerRoundPreview(): number {
    const v = this.eventForm.get('defaultSongsPerRound')?.value;
    return typeof v === 'number' && v > 0 ? v : 10;
  }

  // --- Live preview helpers ---
  private getSelectedThemeDef() {
    const selectedThemeId = this.eventForm.get('themeId')?.value;
    return this.availableThemes.find((t) => t.id === selectedThemeId);
  }

  getPreviewThemeVars() {
    const t = this.getSelectedThemeDef();
    if (!t) return {};
    const primary = t.preview.primary || t.colors?.primary || '#3b82f6';
    const secondary = t.preview.secondary || t.colors?.secondary || '#8b5cf6';
    const surface = '#ffffff';
    const border = '#e2e8f0';
    const text = '#0f172a';
    return {
      background: surface,
      borderColor: border,
      color: text,
      '--preview-primary': primary,
      '--preview-secondary': secondary,
    } as any;
  }

  getGradientBackground(): string {
    const t = this.getSelectedThemeDef();
    if (!t) return 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
    return (
      t.preview.gradient ||
      t.colors?.gradient ||
      `linear-gradient(135deg, ${t.preview.primary || t.colors?.primary}, ${t.preview.secondary || t.colors?.secondary})`
    );
  }

  getBadgeBg(): string {
    const t = this.getSelectedThemeDef();
    if (!t) return 'rgba(59,130,246,.12)';
    const p = t.preview.primary || t.colors?.primary || '#3b82f6';
    return this.hexToRgba(p, 0.15);
  }

  getBadgeFg(): string {
    const t = this.getSelectedThemeDef();
    if (!t) return '#1e40af';
    const p = t.preview.primary || t.colors?.primary || '#1e40af';
    return p;
  }

  private hexToRgba(hex: string, alpha = 1): string {
    try {
      const h = hex.replace('#', '');
      const bigint = parseInt(h, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch {
      return hex;
    }
  }

  getPlayerPreviewVars() {
    const t = this.getSelectedThemeDef();
    const primary = t?.preview.primary || t?.colors?.primary || '#22d3ee';
    const secondary = t?.preview.secondary || t?.colors?.secondary || '#6366f1';
    const bg = t?.preview.background || t?.colors?.background || '#0b1020';
    const text = '#e5e7eb';
    const textSecondary = '#94a3b8';
    const border = this.hexToRgba(primary, 0.25);
    const gradient =
      t?.preview.gradient ||
      t?.colors?.gradient ||
      `linear-gradient(135deg, ${primary}, ${secondary})`;
    return {
      '--p-primary': primary,
      '--p-secondary': secondary,
      '--p-bg': bg,
      '--p-text': text,
      '--p-text-secondary': textSecondary,
      '--p-border': border,
      '--p-gradient': gradient,
    } as any;
  }
}
