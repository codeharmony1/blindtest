import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SessionService } from '../../core/services/session.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'bt-join',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './join-autumn.component.html',
  styleUrls: ['../../shared/styles/autumn-wedding.scss'],
  styles: [
    `
      .autumn-theme {
        position: relative;
      }

      .autumn-container {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .autumn-decor {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
      }

      .autumn-decor .decor-circle {
        position: absolute;
        border-radius: 50%;
        filter: blur(0.5px);
        opacity: 0.18;
      }

      .decor-circle-1 {
        top: 2.5rem;
        left: 1.5rem;
        width: 6rem;
        height: 6rem;
        background: #d9794d;
      }

      .decor-circle-2 {
        top: 8rem;
        right: 2.5rem;
        width: 4.5rem;
        height: 4.5rem;
        background: #d4a574;
      }

      .decor-circle-3 {
        bottom: 6rem;
        left: 3rem;
        width: 5.5rem;
        height: 5.5rem;
        background: #c87250;
      }

      .decor-leaf {
        position: absolute;
        width: 2.5rem;
        height: 2.5rem;
        opacity: 0.4;
      }

      .decor-leaf-1 {
        top: 1.8rem;
        left: 0.75rem;
      }

      .decor-leaf-2 {
        bottom: 4.5rem;
        right: 1.5rem;
      }

      .autumn-card-plain::before {
        display: none;
      }

      .event-subtitle {
        font-size: 1.25rem;
        margin-top: 1rem;
        color: rgba(255, 249, 240, 0.9);
        font-style: italic;
        opacity: 0.95;
      }

      .autumn-footer-dots {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.6rem;
        margin: 2rem auto 0;
        opacity: 0.35;
      }

      .autumn-footer-dots span {
        display: inline-block;
        width: 0.55rem;
        height: 0.55rem;
        border-radius: 50%;
        background: #d4a574;
      }

      .autumn-footer-dots span:nth-child(2) {
        background: #d9794d;
      }

      .autumn-footer-dots span:nth-child(3) {
        background: #c87250;
      }

      .join-form {
        display: flex;
        flex-direction: column;
        gap: 1.6rem;
      }

      .autumn-label {
        font-weight: 600;
        color: #8b6f47;
        font-size: 1rem;
      }

      .autumn-input {
        font-size: 1.05rem;
        padding: 1.1rem 1.4rem;
        background: #faf8f4;
        border: 2px solid #e8dcc8;
        border-radius: 18px;
        color: #4a3828;
      }

      .autumn-input::placeholder {
        color: #c9a87f;
      }

      .btn-autumn {
        border-radius: 16px;
        padding: 1.1rem;
        font-size: 1.05rem;
        font-weight: 600;
        text-transform: none;
        letter-spacing: 0.4px;
        background: linear-gradient(135deg, #d4a574 0%, #b87333 100%);
        box-shadow: 0 16px 30px rgba(184, 92, 71, 0.25);
      }

      .btn-autumn:hover:not(:disabled) {
        box-shadow: 0 18px 34px rgba(184, 92, 71, 0.3);
      }

      .btn-autumn:disabled {
        background: linear-gradient(135deg, #d7d2ca, #bdb7af);
        color: #6f6a62;
        box-shadow: none;
      }

      .btn-icon {
        margin-right: 0.5rem;
      }

      .autumn-message {
        display: flex;
        align-items: center;
        gap: 0.8rem;
      }

      .autumn-message span:first-child {
        font-size: 1.4rem;
      }

      @media (max-width: 768px) {
        .join-form {
          gap: 1.2rem;
        }

        .autumn-label {
          font-size: 0.95rem;
        }

        .event-subtitle {
          font-size: 1.1rem;
        }
      }

      @media (max-width: 480px) {
        .join-form {
          gap: 1rem;
        }

        .autumn-label {
          font-size: 0.9rem;
        }

        .event-subtitle {
          font-size: 1rem;
        }
      }
    `,
  ],
})
export class JoinComponent {
  eventCode!: string;
  nickname = '';
  eventName = '';
  gameMode: 'TEAM' | 'SOLO' = 'TEAM';
  notFound = false;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private session: SessionService,
    private theme: ThemeService,
  ) {
    this.eventCode = this.route.snapshot.params['eventCode'];

    // Vérifier si une session existe déjà pour cet événement
    const existingSession = this.session.load();
    if (existingSession && existingSession.eventCode === this.eventCode) {
      // Rediriger directement vers la page de jeu
      this.router.navigate(['round'], { relativeTo: this.route });
      return;
    }

    this.api.getEventPublic(this.eventCode).subscribe({
      next: (d) => {
        this.eventName = d.name;
        this.gameMode = d.gameMode || 'TEAM';
        this.loading = false;
        // Charger et appliquer le thème de l'événement une fois confirmé
        this.theme.loadEventTheme(this.eventCode).subscribe();
      },
      error: (_) => {
        this.notFound = true;
        this.loading = false;
      },
    });
  }

  goTeam() {
    if (this.notFound) return;

    // En mode SOLO, aller directement à la page de rejoindre sans passer par la sélection d'équipe
    if (this.gameMode === 'SOLO') {
      this.joinDirectly();
    } else {
      // En mode TEAM, aller à la sélection d'équipe
      this.router.navigate(['team'], {
        relativeTo: this.route,
        queryParams: { nickname: this.nickname },
      });
    }
  }

  private joinDirectly() {
    // En mode SOLO, rejoindre directement sans teamId
    this.api.joinEvent(this.eventCode, null, this.nickname).subscribe({
      next: ({ teamToken, player }) => {
        // Sauvegarder la session
        this.session.save({
          eventCode: this.eventCode,
          teamId: player.teamId,
          playerId: player.id,
          nickname: player.nickname,
          teamToken,
          isCaptain: player.isCaptain,
        });
        this.router.navigate(['round'], { relativeTo: this.route });
      },
      error: (err) => {
        if (err.error?.code === 'PLAYER_NICK_TAKEN') {
          alert('Ce pseudo est déjà pris. Veuillez en choisir un autre.');
        } else {
          alert('Erreur lors de la connexion. Veuillez réessayer.');
        }
      }
    });
  }

  goHome() {
    this.router.navigateByUrl('/');
  }
}
