import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="home-container">
      <div class="hero-section">
        <h1 class="main-title">🎵 Blind Test Musical</h1>
        <p class="subtitle">Bienvenue ! Choisissez votre rôle pour commencer</p>
      </div>

      <div class="role-cards">
        <div class="role-card player-card" (click)="goToPlayerJoin()">
          <div class="card-icon">🎮</div>
          <h3>Joueur</h3>
          <p>Rejoindre un événement avec un code</p>
          <div class="card-action">
            <input
              type="text"
              [(ngModel)]="eventCode"
              placeholder="Code de l'événement"
              class="event-code-input"
              (keyup.enter)="goToPlayerJoin()"
              (click)="$event.stopPropagation()"
            >
            <button
              class="join-btn"
              [disabled]="!eventCode"
              (click)="goToPlayerJoin(); $event.stopPropagation()"
            >
              Rejoindre
            </button>
          </div>
        </div>

        <div class="role-card dj-card" (click)="goToLogin('DJ')">
          <div class="card-icon">🎧</div>
          <h3>DJ / Animateur</h3>
          <p>Contrôler les manches et les musiques</p>
          <div class="card-action">
            <button class="role-btn">Se connecter</button>
          </div>
        </div>

        <div class="role-card admin-card" (click)="goToAdmin()">
          <div class="card-icon">⚙️</div>
          <h3>Administrateur</h3>
          <p>Gérer les événements et paramètres</p>
          <div class="card-action">
            <button class="role-btn">Administration</button>
          </div>
        </div>

        <div class="role-card display-card" (click)="goToDisplayLogin()">
          <div class="card-icon">📺</div>
          <h3>Affichage</h3>
          <p>Écran pour projeter le leaderboard</p>
          <div class="card-action">
            <input
              type="text"
              [(ngModel)]="displayEventCode"
              placeholder="Code de l'événement"
              class="event-code-input"
              (keyup.enter)="goToDisplay()"
              (click)="$event.stopPropagation()"
            >
            <button
              class="join-btn"
              [disabled]="!displayEventCode"
              (click)="goToDisplay(); $event.stopPropagation()"
            >
              Afficher
            </button>
          </div>
        </div>
      </div>

      <div class="info-section">
        <h4>ℹ️ Comment ça marche ?</h4>
        <ul>
          <li><strong>Joueurs :</strong> Entrez le code donné par l'organisateur pour rejoindre</li>
          <li><strong>DJ :</strong> Connexion avec identifiants pour contrôler l'événement</li>
          <li><strong>Admin :</strong> Créer et gérer les événements, équipes, musiques</li>
          <li><strong>Affichage :</strong> Projecteur pour suivre les scores en temps réel</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      min-height: 100vh;
      background: var(--gradient-primary, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .hero-section {
      text-align: center;
      color: white;
      margin-bottom: 3rem;
    }

    .main-title {
      font-size: 3.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .subtitle {
      font-size: 1.3rem;
      opacity: 0.9;
      margin-bottom: 0;
    }

    .role-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      width: 100%;
      margin-bottom: 3rem;
    }

    .role-card {
      background: white;
      border-radius: 20px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      border: 3px solid transparent;
    }

    .role-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    }

    .player-card:hover { border-color: var(--color-primary, #4CAF50); }
    .dj-card:hover { border-color: var(--color-secondary, #FF6B35); }
    .admin-card:hover { border-color: var(--color-accent, #6C5CE7); }
    .display-card:hover { border-color: var(--color-primary, #00B894); }

    .card-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .role-card h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #333;
    }

    .role-card p {
      color: #666;
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }

    .card-action {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .event-code-input {
      padding: 0.75rem;
      border: 2px solid #ddd;
      border-radius: 10px;
      font-size: 1rem;
      text-align: center;
      transition: border-color 0.3s ease;
    }

    .event-code-input:focus {
      outline: none;
      border-color: var(--color-primary, #667eea);
    }

    .role-btn, .join-btn {
      padding: 0.75rem 1.5rem;
      background: var(--gradient-primary, linear-gradient(45deg, #667eea, #764ba2));
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .role-btn:hover, .join-btn:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
    }

    .join-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .info-section {
      background: rgba(255,255,255,0.1);
      border-radius: 15px;
      padding: 2rem;
      color: white;
      max-width: 600px;
      width: 100%;
      backdrop-filter: blur(10px);
    }

    .info-section h4 {
      margin-bottom: 1rem;
      font-size: 1.3rem;
    }

    .info-section ul {
      list-style: none;
      padding: 0;
    }

    .info-section li {
      margin-bottom: 0.5rem;
      line-height: 1.4;
      opacity: 0.9;
    }

    @media (max-width: 768px) {
      .home-container {
        padding: 1rem;
      }

      .main-title {
        font-size: 2.5rem;
      }

      .role-cards {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .role-card {
        padding: 1.5rem;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  eventCode = '';
  displayEventCode = '';

  constructor(
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    // Charge le thème par défaut au démarrage
    this.themeService.resetToDefault();
  }

  goToPlayerJoin() {
    if (this.eventCode.trim()) {
      this.router.navigate(['/join', this.eventCode.trim().toUpperCase()]);
    }
  }

  goToLogin(role: string) {
    // Pour l'instant, rediriger vers l'admin - pourrait être étendu pour différents types de login
    this.router.navigate(['/admin']);
  }

  goToAdmin() {
    this.router.navigate(['/admin']);
  }

  goToDisplayLogin() {
    // Afficher un prompt pour le code ou rediriger vers une page dédiée
    if (!this.displayEventCode.trim()) {
      const code = prompt('Code de l\'événement pour l\'affichage :');
      if (code) {
        this.displayEventCode = code;
        this.goToDisplay();
      }
    }
  }

  goToDisplay() {
    if (this.displayEventCode.trim()) {
      this.router.navigate(['/display', this.displayEventCode.trim().toUpperCase()]);
    }
  }
}