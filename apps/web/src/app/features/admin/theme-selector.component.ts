import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { ThemeConfig } from '../../shared/themes/themes';

interface ThemePreview {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: {
    primary: string;
    secondary: string;
    background: string;
    gradient?: string;
  };
}

interface ThemeResponse {
  themes: ThemePreview[];
  categories: string[];
}

interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="theme-selector-container">
      <div class="header">
        <h2>🎨 Sélection du Thème</h2>
        <p class="subtitle">Choisissez l'ambiance parfaite pour votre événement</p>
      </div>

      <!-- Filtres par catégorie -->
      <div class="category-filters">
        <button
          class="filter-btn"
          [class.active]="selectedCategory === 'all'"
          (click)="filterByCategory('all')"
        >
          Tous
        </button>
        <button
          *ngFor="let category of categories"
          class="filter-btn"
          [class.active]="selectedCategory === category"
          (click)="filterByCategory(category)"
        >
          {{ getCategoryLabel(category) }}
        </button>
      </div>

      <!-- Pagination Info -->
      <div class="pagination-info" *ngIf="!loading && filteredThemes.length > 0">
        <span>{{ getPaginationInfo() }}</span>
        <div class="items-per-page">
          <label>Thèmes par page:</label>
          <select [(ngModel)]="pagination.itemsPerPage" (change)="updatePagination()">
            <option value="6">6</option>
            <option value="9">9</option>
            <option value="12">12</option>
            <option value="18">18</option>
          </select>
        </div>
      </div>

      <!-- Grille des thèmes -->
      <div class="themes-grid" *ngIf="!loading">
        <div
          *ngFor="let theme of paginatedThemes"
          class="theme-card"
          [class.selected]="currentThemeId === theme.id"
          (click)="selectTheme(theme.id)"
        >
          <!-- Aperçu visuel -->
          <div
            class="theme-preview"
            [style.background]="theme.preview.gradient || theme.preview.primary"
          >
            <div class="preview-elements">
              <div class="preview-header" [style.background-color]="theme.preview.primary">
                <div class="preview-title" [style.color]="theme.preview.background">Blind Test</div>
              </div>
              <div class="preview-content" [style.background-color]="theme.preview.background">
                <div class="preview-button" [style.background-color]="theme.preview.secondary">
                  Jouer
                </div>
                <div class="preview-text" [style.color]="theme.preview.primary">Score: 1250</div>
              </div>
            </div>
          </div>

          <!-- Informations du thème -->
          <div class="theme-info">
            <h3 class="theme-name">{{ theme.name }}</h3>
            <p class="theme-description">{{ theme.description }}</p>
            <span class="theme-category">{{ getCategoryLabel(theme.category) }}</span>
          </div>

          <!-- Indicateur de sélection -->
          <div class="selection-indicator" *ngIf="currentThemeId === theme.id">
            <span class="check-icon">✓</span>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div class="pagination-controls" *ngIf="!loading && pagination.totalPages > 1">
        <button
          class="pagination-btn"
          [disabled]="pagination.currentPage === 1"
          (click)="goToPage(1)"
        >
          ≪
        </button>
        <button
          class="pagination-btn"
          [disabled]="pagination.currentPage === 1"
          (click)="goToPage(pagination.currentPage - 1)"
        >
          ‹
        </button>

        <span class="page-numbers">
          <button
            *ngFor="let page of getPageNumbers()"
            class="pagination-btn page-number"
            [class.active]="page === pagination.currentPage"
            [disabled]="page === '...'"
            (click)="page !== '...' && goToPage(+page)"
          >
            {{ page }}
          </button>
        </span>

        <button
          class="pagination-btn"
          [disabled]="pagination.currentPage === pagination.totalPages"
          (click)="goToPage(pagination.currentPage + 1)"
        >
          ›
        </button>
        <button
          class="pagination-btn"
          [disabled]="pagination.currentPage === pagination.totalPages"
          (click)="goToPage(pagination.totalPages)"
        >
          ≫
        </button>
      </div>

      <!-- Loading state -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Chargement des thèmes...</p>
      </div>

      <!-- Aperçu du thème sélectionné -->
      <div class="theme-preview-section" *ngIf="selectedThemeId && selectedTheme">
        <div class="preview-header">
          <h3>🎯 Aperçu : {{ selectedTheme.name }}</h3>
          <p class="preview-description">{{ selectedTheme.description }}</p>
        </div>

        <div class="theme-demo player-preview" [style]="getThemeStyles(selectedTheme)">
          <!-- Aperçu écran joueur -->
          <div class="player-preview-container">
            <header class="player-header">
              <h1>
                <span class="player-icon">🎵</span>
                Round Musical en Cours
              </h1>
              <div class="player-info">
                <div class="team-badge">Équipe #3</div>
                <div class="player-name">Alex Martin</div>
              </div>
            </header>

            <!-- Timer et statut -->
            <div class="player-card timer-card">
              <div class="timer-display">
                <div class="timer-icon">⏱️</div>
                <div class="timer-content">
                  <div class="timer-label">Temps restant</div>
                  <div class="timer-value">12.5s</div>
                </div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: 42%;"></div>
              </div>
            </div>

            <!-- Formulaire de réponse -->
            <div class="player-card answer-card">
              <h3>
                <span class="player-section-icon">✍️</span>
                Votre Réponse
              </h3>
              <div class="answer-form">
                <label class="player-label">Titre et/ou Artiste de la chanson</label>
                <input
                  value="Bohemian Rhapsody - Queen"
                  class="player-input answer-input"
                  readonly
                />
                <button class="player-button primary">
                  <span class="btn-icon">📝</span>
                  Envoyer la Réponse
                </button>
              </div>
              <div class="player-message">
                <span>💡</span>
                <strong>Astuce :</strong> La dernière réponse avant la fin du temps imparti sera
                prise en compte !
              </div>
            </div>

            <!-- Navigation -->
            <div class="player-card navigation-card">
              <button class="player-button success">
                <span class="btn-icon">🏆</span>
                Voir le Classement
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions" *ngIf="!loading">
        <button
          class="btn-primary"
          (click)="applyTheme()"
          [disabled]="!selectedThemeId || applying"
        >
          {{ applying ? 'Application...' : 'Appliquer le Thème' }}
        </button>
      </div>

      <!-- Messages -->
      <div class="message success" *ngIf="successMessage">{{ successMessage }}</div>
      <div class="message error" *ngIf="errorMessage">{{ errorMessage }}</div>
    </div>
  `,
  styles: [
    `
      .theme-selector-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }

      .header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .header h2 {
        color: #2d3748;
        margin-bottom: 0.5rem;
        font-size: 2rem;
      }

      .subtitle {
        color: #718096;
        font-size: 1.1rem;
      }

      .category-filters {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
      }

      .filter-btn {
        padding: 0.5rem 1rem;
        border: 2px solid #e2e8f0;
        background: white;
        border-radius: 2rem;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
      }

      .filter-btn:hover {
        border-color: #4299e1;
      }

      .filter-btn.active {
        background: #4299e1;
        color: white;
        border-color: #4299e1;
      }

      .themes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .theme-card {
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        background: white;
      }

      .theme-card:hover {
        border-color: #4299e1;
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }

      .theme-card.selected {
        border-color: #48bb78;
        box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.2);
      }

      .theme-preview {
        height: 150px;
        position: relative;
        overflow: hidden;
      }

      .preview-elements {
        position: absolute;
        inset: 0;
        padding: 1rem;
      }

      .preview-header {
        border-radius: 6px;
        padding: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .preview-title {
        font-weight: bold;
        font-size: 0.9rem;
      }

      .preview-content {
        border-radius: 6px;
        padding: 0.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .preview-button {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 500;
        color: white;
      }

      .preview-text {
        font-size: 0.8rem;
        font-weight: 500;
      }

      .theme-info {
        padding: 1rem;
      }

      .theme-name {
        font-size: 1.1rem;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 0.5rem;
      }

      .theme-description {
        font-size: 0.9rem;
        color: #718096;
        margin-bottom: 0.5rem;
        line-height: 1.4;
      }

      .theme-category {
        display: inline-block;
        background: #edf2f7;
        color: #4a5568;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
      }

      .selection-indicator {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: #48bb78;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }

      .loading-state {
        text-align: center;
        padding: 3rem;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e2e8f0;
        border-top: 3px solid #4299e1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .actions {
        display: flex;
        justify-content: center;
        gap: 1rem;
      }

      .btn-primary,
      .btn-secondary {
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        border: none;
      }

      .btn-primary {
        background: #4299e1;
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        background: #3182ce;
      }

      .btn-secondary {
        background: #edf2f7;
        color: #4a5568;
      }

      .btn-secondary:hover:not(:disabled) {
        background: #e2e8f0;
      }

      .btn-primary:disabled,
      .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .theme-demo {
        min-height: 500px;
        border-radius: 12px;
        padding: 1.5rem;
        overflow-y: auto;
        max-height: 70vh;
      }

      .player-preview-container {
        max-width: 600px;
        margin: 0 auto;
      }

      .player-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .player-header h1 {
        margin: 0 0 1rem 0;
        font-size: 1.8rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .player-icon {
        font-size: 2rem;
      }

      .player-info {
        display: flex;
        gap: 1rem;
        align-items: center;
        justify-content: center;
        margin-top: 1rem;
      }

      .team-badge {
        background: var(--color-primary);
        color: var(--color-surface);
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.9rem;
      }

      .player-name {
        color: var(--color-text);
        font-size: 1.2rem;
        font-weight: 500;
      }

      .player-card {
        background: var(--color-surface);
        border: 2px solid var(--color-border);
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .timer-card {
        text-align: center;
      }

      .timer-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .timer-icon {
        font-size: 2.5rem;
      }

      .timer-content {
        text-align: left;
      }

      .timer-label {
        color: var(--color-text-secondary);
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
      }

      .timer-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--color-primary);
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background: var(--color-border);
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--color-secondary), var(--color-accent));
        transition: width 0.3s ease;
      }

      .answer-card h3 {
        margin: 0 0 1.5rem 0;
        color: var(--color-text);
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .player-section-icon {
        font-size: 1.3rem;
      }

      .answer-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .player-label {
        color: var(--color-text);
        font-weight: 500;
        margin-bottom: 0.5rem;
      }

      .player-input {
        padding: 1rem;
        border: 2px solid var(--color-border);
        border-radius: 8px;
        background: var(--color-background);
        color: var(--color-text);
        font-size: 1rem;
        font-family: var(--font-primary);
      }

      .player-input:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(var(--color-primary), 0.1);
      }

      .player-button {
        padding: 1rem 2rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-family: var(--font-primary);
      }

      .player-button.primary {
        background: var(--color-primary);
        color: var(--color-surface);
      }

      .player-button.success {
        background: var(--color-secondary);
        color: var(--color-surface);
      }

      .player-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .player-message {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        background: rgba(var(--color-accent), 0.1);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 1rem;
        margin-top: 1rem;
        color: var(--color-text);
        font-size: 0.9rem;
      }

      .navigation-card {
        text-align: center;
      }

      .theme-preview-section {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 2px solid #e2e8f0;
      }

      .preview-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .preview-header h3 {
        color: #2d3748;
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
      }

      .preview-description {
        color: #718096;
        font-size: 1rem;
        margin: 0;
      }

      .message {
        padding: 1rem;
        border-radius: 8px;
        margin-top: 1rem;
        text-align: center;
      }

      .message.success {
        background: #f0fff4;
        color: #22543d;
        border: 1px solid #c6f6d5;
      }

      .message.error {
        background: #fed7d7;
        color: #c53030;
        border: 1px solid #feb2b2;
      }

      .pagination-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: #f7fafc;
        border-radius: 8px;
        font-size: 0.9rem;
        color: #4a5568;
      }

      .items-per-page {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .items-per-page select {
        padding: 0.25rem 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        background: white;
      }

      .pagination-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        margin-top: 2rem;
        flex-wrap: wrap;
      }

      .pagination-btn {
        padding: 0.5rem 0.75rem;
        border: 1px solid #e2e8f0;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
        min-width: 40px;
      }

      .pagination-btn:hover:not(:disabled) {
        background: #edf2f7;
        border-color: #cbd5e0;
      }

      .pagination-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .pagination-btn.active {
        background: #4299e1;
        color: white;
        border-color: #4299e1;
      }

      .page-numbers {
        display: flex;
        gap: 0.25rem;
      }

      .page-number {
        min-width: 40px;
      }

      @media (max-width: 768px) {
        .theme-selector-container {
          padding: 1rem;
        }

        .themes-grid {
          grid-template-columns: 1fr;
        }

        .demo-content {
          grid-template-columns: 1fr;
        }

        .modal-content {
          margin: 1rem;
          max-width: calc(100vw - 2rem);
        }
      }
    `,
  ],
})
export class ThemeSelectorComponent implements OnInit {
  themes: ThemePreview[] = [];
  categories: string[] = [];
  filteredThemes: ThemePreview[] = [];
  paginatedThemes: ThemePreview[] = [];
  selectedCategory = 'all';
  selectedThemeId: string | null = null;
  currentThemeId: string | null = null;
  selectedTheme: ThemeConfig | null = null;
  loading = true;
  applying = false;
  successMessage = '';
  errorMessage = '';

  pagination: PaginationConfig = {
    currentPage: 1,
    itemsPerPage: 9,
    totalItems: 0,
    totalPages: 0,
  };

  private eventCode: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private themeService: ThemeService,
  ) {}

  ngOnInit() {
    this.eventCode = this.route.snapshot.params['code'] || 'DEMO';
    this.loadThemes();
    this.loadCurrentTheme();
  }

  loadThemes() {
    try {
      const allThemes = this.themeService.getAllThemes();
      this.themes = allThemes.map((theme) => ({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        category: theme.category,
        preview: {
          primary: theme.colors.primary,
          secondary: theme.colors.secondary,
          background: theme.colors.background,
          gradient: theme.colors.gradient,
        },
      }));

      this.categories = this.themeService.getCategories().filter((cat) => cat !== 'custom');
      this.filteredThemes = this.themes;
      this.updatePagination();
      this.loading = false;
    } catch (error) {
      this.errorMessage = 'Erreur lors du chargement des thèmes';
      this.loading = false;
    }
  }

  loadCurrentTheme() {
    this.http.get<any>(`/api/events/${this.eventCode}/theme`).subscribe({
      next: (response) => {
        this.currentThemeId = response.theme?.id || null;
      },
      error: (error) => {
        console.warn('Could not load current theme:', error);
      },
    });
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    if (category === 'all') {
      this.filteredThemes = this.themes;
    } else {
      this.filteredThemes = this.themes.filter((theme) => theme.category === category);
    }
    this.pagination.currentPage = 1;
    this.updatePagination();
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      wedding: 'Mariage',
      corporate: 'Entreprise',
      birthday: 'Anniversaire',
      party: 'Soirée',
      seasonal: 'Saisonnier',
      custom: 'Personnalisé',
    };
    return labels[category] || category;
  }

  selectTheme(themeId: string) {
    this.selectedThemeId = themeId;
    // Charger automatiquement l'aperçu du thème sélectionné
    this.loadThemePreview(themeId);
  }

  private loadThemePreview(themeId: string) {
    try {
      const theme = this.themeService.getThemeById(themeId);
      if (theme) {
        this.selectedTheme = theme;
      } else {
        this.selectedTheme = null;
        this.errorMessage = 'Thème introuvable';
      }
    } catch (error) {
      this.selectedTheme = null;
      this.errorMessage = "Erreur lors du chargement de l'aperçu";
    }
  }

  updatePagination() {
    this.pagination.totalItems = this.filteredThemes.length;
    this.pagination.totalPages = Math.ceil(
      this.pagination.totalItems / this.pagination.itemsPerPage,
    );

    if (this.pagination.currentPage > this.pagination.totalPages) {
      this.pagination.currentPage = Math.max(1, this.pagination.totalPages);
    }

    const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
    const endIndex = startIndex + this.pagination.itemsPerPage;
    this.paginatedThemes = this.filteredThemes.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.currentPage = page;
      this.updatePagination();
    }
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const totalPages = this.pagination.totalPages;
    const currentPage = this.pagination.currentPage;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 4) {
        pages.push('...');
      }

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 4) {
        end = 5;
      }
      if (currentPage >= totalPages - 3) {
        start = totalPages - 4;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 3) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  }

  getPaginationInfo(): string {
    const start = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage + 1;
    const end = Math.min(start + this.pagination.itemsPerPage - 1, this.pagination.totalItems);
    return `Affichage de ${start} à ${end} sur ${this.pagination.totalItems} thèmes`;
  }

  getThemeStyles(theme: ThemeConfig): any {
    return {
      background: theme.colors.gradient || theme.colors.background,
      color: theme.colors.text,
      'font-family': theme.fonts.primary,
      '--color-primary': theme.colors.primary,
      '--color-secondary': theme.colors.secondary,
      '--color-accent': theme.colors.accent,
      '--color-background': theme.colors.background,
      '--color-surface': theme.colors.surface,
      '--color-text': theme.colors.text,
      '--color-text-secondary': theme.colors.textSecondary,
      '--color-border': theme.colors.border,
      '--font-primary': theme.fonts.primary,
      '--font-heading': theme.fonts.heading,
    };
  }

  applyTheme() {
    if (!this.selectedThemeId) return;

    this.applying = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = { themeId: this.selectedThemeId };

    this.http.put(`/api/events/${this.eventCode}/theme`, payload).subscribe({
      next: (response) => {
        this.currentThemeId = this.selectedThemeId;
        this.successMessage = 'Thème appliqué avec succès !';
        this.applying = false;

        // Auto-hide success message
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.errorMessage = "Erreur lors de l'application du thème";
        this.applying = false;
      },
    });
  }
}
