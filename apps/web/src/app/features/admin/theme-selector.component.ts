import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

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

interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    gradient?: string;
  };
  fonts: {
    primary: string;
    heading: string;
  };
  imagery?: {
    backgroundPattern?: string;
    iconStyle?: string;
    illustrations?: string[];
  };
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

      <!-- Grille des thèmes -->
      <div class="themes-grid" *ngIf="!loading">
        <div
          *ngFor="let theme of filteredThemes"
          class="theme-card"
          [class.selected]="currentThemeId === theme.id"
          (click)="selectTheme(theme.id)"
        >
          <!-- Aperçu visuel -->
          <div class="theme-preview" [style.background]="theme.preview.gradient || theme.preview.primary">
            <div class="preview-elements">
              <div class="preview-header" [style.background-color]="theme.preview.primary">
                <div class="preview-title" [style.color]="theme.preview.background">Blind Test</div>
              </div>
              <div class="preview-content" [style.background-color]="theme.preview.background">
                <div class="preview-button" [style.background-color]="theme.preview.secondary">Jouer</div>
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

      <!-- Loading state -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Chargement des thèmes...</p>
      </div>

      <!-- Actions -->
      <div class="actions" *ngIf="!loading">
        <button
          class="btn-secondary"
          (click)="previewTheme()"
          [disabled]="!selectedThemeId"
        >
          Aperçu
        </button>
        <button
          class="btn-primary"
          (click)="applyTheme()"
          [disabled]="!selectedThemeId || applying"
        >
          {{ applying ? 'Application...' : 'Appliquer le Thème' }}
        </button>
      </div>

      <!-- Aperçu détaillé -->
      <div class="theme-detail-modal" *ngIf="previewMode" (click)="closePreview()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Aperçu : {{ selectedTheme?.name }}</h3>
            <button class="close-btn" (click)="closePreview()">×</button>
          </div>
          <div class="modal-body" *ngIf="selectedTheme">
            <div class="theme-demo" [style]="getThemeStyles(selectedTheme)">
              <div class="demo-header">
                <h1>Blind Test Musical</h1>
                <nav>
                  <a href="#" class="nav-link">Accueil</a>
                  <a href="#" class="nav-link">Équipes</a>
                  <a href="#" class="nav-link">Scores</a>
                </nav>
              </div>
              <div class="demo-content">
                <div class="demo-card">
                  <h3>Round 1 - Pop Music</h3>
                  <p>20 chansons • 15 secondes chacune</p>
                  <button class="demo-button">Commencer</button>
                </div>
                <div class="demo-leaderboard">
                  <h4>Classement</h4>
                  <div class="demo-team">1. Team Alpha - 1250 pts</div>
                  <div class="demo-team">2. Team Beta - 980 pts</div>
                  <div class="demo-team">3. Team Gamma - 750 pts</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div class="message success" *ngIf="successMessage">{{ successMessage }}</div>
      <div class="message error" *ngIf="errorMessage">{{ errorMessage }}</div>
    </div>
  `,
  styles: [`
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
      color: #2D3748;
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
      border: 2px solid #E2E8F0;
      background: white;
      border-radius: 2rem;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 500;
    }

    .filter-btn:hover {
      border-color: #4299E1;
    }

    .filter-btn.active {
      background: #4299E1;
      color: white;
      border-color: #4299E1;
    }

    .themes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .theme-card {
      border: 2px solid #E2E8F0;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      background: white;
    }

    .theme-card:hover {
      border-color: #4299E1;
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }

    .theme-card.selected {
      border-color: #48BB78;
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
      color: #2D3748;
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
      background: #EDF2F7;
      color: #4A5568;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .selection-indicator {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: #48BB78;
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
      border: 3px solid #E2E8F0;
      border-top: 3px solid #4299E1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
    }

    .btn-primary {
      background: #4299E1;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #3182CE;
    }

    .btn-secondary {
      background: #EDF2F7;
      color: #4A5568;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #E2E8F0;
    }

    .btn-primary:disabled, .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .theme-detail-modal {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 90vw;
      max-height: 90vh;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #E2E8F0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #718096;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      max-height: 70vh;
    }

    .theme-demo {
      min-height: 400px;
      border-radius: 8px;
      padding: 1rem;
    }

    .demo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.2);
    }

    .demo-header h1 {
      margin: 0;
      font-size: 1.5rem;
    }

    .demo-header nav {
      display: flex;
      gap: 1rem;
    }

    .nav-link {
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background 0.3s ease;
    }

    .nav-link:hover {
      background: rgba(255,255,255,0.1);
    }

    .demo-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .demo-card {
      padding: 1.5rem;
      border-radius: 8px;
      background: rgba(255,255,255,0.1);
    }

    .demo-card h3 {
      margin: 0 0 0.5rem 0;
    }

    .demo-card p {
      margin: 0 0 1rem 0;
      opacity: 0.8;
    }

    .demo-button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .demo-leaderboard h4 {
      margin: 0 0 1rem 0;
    }

    .demo-team {
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
    }

    .message {
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      text-align: center;
    }

    .message.success {
      background: #F0FFF4;
      color: #22543D;
      border: 1px solid #C6F6D5;
    }

    .message.error {
      background: #FED7D7;
      color: #C53030;
      border: 1px solid #FEB2B2;
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
  `]
})
export class ThemeSelectorComponent implements OnInit {
  themes: ThemePreview[] = [];
  categories: string[] = [];
  filteredThemes: ThemePreview[] = [];
  selectedCategory = 'all';
  selectedThemeId: string | null = null;
  currentThemeId: string | null = null;
  selectedTheme: ThemeConfig | null = null;
  loading = true;
  applying = false;
  previewMode = false;
  successMessage = '';
  errorMessage = '';

  private eventCode: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.eventCode = this.route.snapshot.params['code'] || 'DEMO';
    this.loadThemes();
    this.loadCurrentTheme();
  }

  loadThemes() {
    this.http.get<ThemeResponse>('/api/themes').subscribe({
      next: (response) => {
        this.themes = response.themes;
        this.categories = response.categories.filter(cat => cat !== 'custom');
        this.filteredThemes = this.themes;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des thèmes';
        this.loading = false;
      }
    });
  }

  loadCurrentTheme() {
    this.http.get<any>(`/api/events/${this.eventCode}/theme`).subscribe({
      next: (response) => {
        this.currentThemeId = response.theme?.id || null;
      },
      error: (error) => {
        console.warn('Could not load current theme:', error);
      }
    });
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    if (category === 'all') {
      this.filteredThemes = this.themes;
    } else {
      this.filteredThemes = this.themes.filter(theme => theme.category === category);
    }
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'wedding': 'Mariage',
      'corporate': 'Entreprise',
      'birthday': 'Anniversaire',
      'party': 'Soirée',
      'seasonal': 'Saisonnier',
      'custom': 'Personnalisé'
    };
    return labels[category] || category;
  }

  selectTheme(themeId: string) {
    this.selectedThemeId = themeId;
  }

  previewTheme() {
    if (!this.selectedThemeId) return;

    this.http.get<ThemeConfig>(`/api/themes/${this.selectedThemeId}`).subscribe({
      next: (theme) => {
        this.selectedTheme = theme;
        this.previewMode = true;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement de l\'aperçu';
      }
    });
  }

  closePreview() {
    this.previewMode = false;
    this.selectedTheme = null;
  }

  getThemeStyles(theme: ThemeConfig): any {
    return {
      'background': theme.colors.gradient || theme.colors.background,
      'color': theme.colors.text,
      'font-family': theme.fonts.primary
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
        this.errorMessage = 'Erreur lors de l\'application du thème';
        this.applying = false;
      }
    });
  }
}