import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { DJAuthService } from '../../core/services/dj-auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="home">
      <div class="bg-ornaments" aria-hidden="true"></div>

      <header class="hero">
        <h1 class="title">
          <span class="logo">🎵</span>
          <span class="grad-text">Blind Test</span>
          <span class="thin">Musical</span>
        </h1>
        <p class="subtitle">Choisissez votre rôle pour commencer</p>
      </header>

      <section class="grid">
        <article class="card is-clickable" (click)="goToPlayerJoin()">
          <div class="card-head">
            <div class="icon">🎮</div>
            <h3>Joueur</h3>
          </div>
          <p class="desc">Rejoignez un événement avec son code d'accès</p>
          <div class="actions" (click)="$event.stopPropagation()">
            <div class="input-group">
              <span class="prefix">#</span>
              <input
                type="text"
                [(ngModel)]="eventCode"
                placeholder="Code de l'événement"
                (keyup.enter)="goToPlayerJoin()"
              />
            </div>
            <button class="btn btn-primary" [disabled]="!eventCode" (click)="goToPlayerJoin()">
              Rejoindre
            </button>
          </div>
        </article>

        <article class="card is-clickable" (click)="goToDJ()">
          <div class="card-head">
            <div class="icon">🎧</div>
            <h3>DJ / Animateur</h3>
          </div>
          <p class="desc">Lancez les rounds et pilotez la soirée</p>
          <div class="actions" (click)="$event.stopPropagation()">
            <div class="input-group">
              <span class="prefix">#</span>
              <input
                type="text"
                [(ngModel)]="djEventCode"
                placeholder="Code événement"
                (keyup.enter)="djPinInput.focus()"
                maxlength="16"
              />
            </div>
            <div class="input-group">
              <span class="prefix">🔒</span>
              <input
                #djPinInput
                type="password"
                inputmode="numeric"
                [(ngModel)]="djPinCode"
                placeholder="PIN (6 chiffres)"
                (keyup.enter)="goToDJ()"
                maxlength="6"
              />
            </div>
            <button class="btn btn-primary" [disabled]="!djEventCode || !djPinCode" (click)="goToDJ()">
              Accéder
            </button>
          </div>
        </article>

        <article class="card is-clickable" (click)="goToAdmin()">
          <div class="card-head">
            <div class="icon">⚙️</div>
            <h3>Administrateur</h3>
          </div>
          <p class="desc">Créez et organisez vos événements</p>
          <div class="actions" (click)="$event.stopPropagation()">
            <button class="btn btn-outline" (click)="goToLogin()">Se connecter</button>
            <button class="btn btn-primary" (click)="goToRegister()">Créer un compte</button>
          </div>
        </article>

        <article class="card is-clickable" (click)="goToDisplayLogin()">
          <div class="card-head">
            <div class="icon">📺</div>
            <h3>Affichage</h3>
          </div>
          <p class="desc">Projetez le timer et le leaderboard</p>
          <div class="actions" (click)="$event.stopPropagation()">
            <div class="input-group">
              <span class="prefix">#</span>
              <input
                type="text"
                [(ngModel)]="displayEventCode"
                placeholder="Code de l'événement"
                (keyup.enter)="goToDisplay()"
              />
            </div>
            <button class="btn btn-primary" [disabled]="!displayEventCode" (click)="goToDisplay()">
              Afficher
            </button>
          </div>
        </article>
      </section>

      <footer class="tips">
        <button class="btn-pricing" (click)="goToPricing()">
          💳 Voir les tarifs
        </button>
        <div class="tip">
          <span class="dot"></span>
          Joueurs: récupérez le code auprès de l'organisateur
        </div>
        <div class="tip">
          <span class="dot"></span>
          DJ: connectez-vous pour lancer la partie
        </div>
        <div class="tip">
          <span class="dot"></span>
          Admin: créez vos playlists et rounds à l'avance
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .home {
        min-height: 100vh;
        padding: clamp(20px, 4vw, 40px);
        background:
          radial-gradient(1200px 600px at 10% -10%, #0ea5e933, transparent),
          radial-gradient(800px 500px at 90% 10%, #a78bfa33, transparent), #0b1020;
        color: #e5e7eb;
        position: relative;
        overflow: hidden;
      }

      .bg-ornaments::before,
      .bg-ornaments::after {
        content: '';
        position: absolute;
        inset: -20% -10% auto -10%;
        height: 60vh;
        background: conic-gradient(from 140deg, #22d3ee55, #a78bfa55, #f472b655, #22d3ee55);
        filter: blur(60px);
        opacity: 0.45;
        transform: translateZ(0);
        pointer-events: none;
      }
      .bg-ornaments::after {
        inset: auto -10% -20% -10%;
        height: 50vh;
        background: conic-gradient(from 320deg, #22d3ee44, #f472b644, #a78bfa44, #22d3ee44);
      }

      .hero {
        text-align: center;
        margin: 20px auto 32px;
        max-width: 980px;
      }
      .title {
        font-size: clamp(2.2rem, 5vw, 4rem);
        font-weight: 800;
        line-height: 1.05;
        letter-spacing: -0.02em;
        margin: 0 0 10px;
      }
      .logo {
        filter: drop-shadow(0 6px 24px rgba(167, 139, 250, 0.35));
        margin-right: 0.25em;
      }
      .grad-text {
        background: linear-gradient(90deg, #22d3ee, #60a5fa, #a78bfa, #f472b6);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .thin {
        font-weight: 300;
        color: #cbd5e1;
      }
      .subtitle {
        color: #94a3b8;
        margin: 0 auto;
        max-width: 720px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: clamp(16px, 3vw, 24px);
        max-width: 1100px;
        margin: 28px auto 32px;
      }

      .card {
        position: relative;
        border-radius: 18px;
        padding: 20px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
        transition:
          transform 0.25s ease,
          box-shadow 0.25s ease,
          border-color 0.25s ease;
      }
      .card::before {
        content: '';
        position: absolute;
        inset: -1px;
        border-radius: 20px;
        padding: 1px;
        background: linear-gradient(135deg, #22d3ee55, #a78bfa55);
        -webkit-mask:
          linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.25s ease;
      }
      .card.is-clickable {
        cursor: pointer;
      }
      .card:hover {
        transform: translateY(-6px);
        box-shadow: 0 16px 46px rgba(0, 0, 0, 0.32);
      }
      .card:hover::before {
        opacity: 1;
      }

      .card-head {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 6px;
      }
      .icon {
        font-size: 1.7rem;
        filter: drop-shadow(0 4px 14px rgba(34, 211, 238, 0.35));
      }
      h3 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
        letter-spacing: 0.2px;
      }
      .desc {
        margin: 6px 0 14px;
        color: #a8b3cf;
      }

      .actions {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
      }
      .actions .btn {
        flex: 1 1 auto;
        min-width: 110px;
      }
      .input-group {
        position: relative;
        flex: 1 1 180px;
        min-width: 180px;
      }
      .input-group .prefix {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #93c5fd;
        font-weight: 700;
        opacity: 0.9;
      }
      input {
        width: 100%;
        padding: 12px 12px 12px 32px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.16);
        color: #e5e7eb;
        outline: none;
        transition:
          border-color 0.2s ease,
          box-shadow 0.2s ease;
      }
      input::placeholder {
        color: #94a3b8;
      }
      input:focus {
        border-color: #60a5fa;
        box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.18);
      }

      .btn {
        padding: 10px 18px;
        border-radius: 999px;
        font-weight: 700;
        font-size: 0.9rem;
        letter-spacing: 0.2px;
        border: 1px solid transparent;
        background: transparent;
        color: #e5e7eb;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition:
          transform 0.15s ease,
          box-shadow 0.2s ease,
          background 0.2s ease,
          border-color 0.2s ease;
      }
      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .btn-primary {
        background: linear-gradient(135deg, #22d3ee, #6366f1, #a855f7);
        box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
      }
      .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 30px rgba(99, 102, 241, 0.45);
      }
      .btn-outline {
        border-color: rgba(148, 163, 184, 0.35);
      }
      .btn-outline:hover {
        border-color: #93c5fd;
        background: rgba(148, 163, 184, 0.06);
      }

      .btn-pricing {
        position: fixed;
        top: 1.5rem;
        right: 1.5rem;
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        z-index: 100;
      }

      .btn-pricing:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
      }

      .tips {
        max-width: 980px;
        margin: 6px auto 4px;
        display: grid;
        gap: 8px;
        color: #a8b3cf;
      }
      .tip {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #60a5fa;
        box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.18);
      }

      @media (max-width: 768px) {
        .actions {
          flex-direction: column;
          align-items: stretch;
        }
        .input-group {
          flex: 1 1 auto;
        }
        .btn {
          width: 100%;
        }
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  eventCode = '';
  displayEventCode = '';
  djEventCode = '';
  djPinCode = '';
  djLoginError = '';

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private djAuthService: DJAuthService,
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

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  goToDJ() {
    if (!this.djEventCode.trim() || !this.djPinCode.trim()) {
      return;
    }

    // Valider le format du PIN (6 chiffres)
    if (!/^\d{6}$/.test(this.djPinCode)) {
      alert('❌ Le PIN doit contenir exactement 6 chiffres');
      return;
    }

    this.djLoginError = '';

    this.djAuthService.login({
      eventCode: this.djEventCode.trim().toUpperCase(),
      pin: this.djPinCode.trim()
    }).subscribe({
      next: (response) => {
        // Redirection vers l'interface DJ
        this.router.navigate(['/dj', response.event.code]);
      },
      error: (error) => {
        // Gérer les erreurs
        if (error.status === 404) {
          alert('❌ Événement introuvable. Vérifiez le code.');
        } else if (error.status === 401) {
          alert('❌ Code PIN incorrect. Réessayez.');
        } else if (error.status === 403) {
          alert('⚠️ Le code PIN DJ n\'est pas configuré pour cet événement.');
        } else {
          alert('❌ Erreur de connexion. Vérifiez vos informations.');
        }
        console.error('[DJ Login] Error:', error);
      }
    });
  }

  goToAdmin() {
    this.router.navigate(['/admin']);
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }

  goToDisplayLogin() {
    // Afficher un prompt pour le code ou rediriger vers une page dédiée
    if (!this.displayEventCode.trim()) {
      const code = prompt("Code de l'événement pour l'affichage :");
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

  goToPricing() {
    this.router.navigate(['/pricing']);
  }
}
