import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SessionService } from '../../core/services/session.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'bt-team-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-select-autumn.component.html',
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
        font-size: 1.2rem;
        margin-top: 1rem;
        color: rgba(255, 249, 240, 0.9);
        font-style: italic;
        opacity: 0.95;
      }

      .teams-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
      }

      .team-card {
        cursor: pointer;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid #e8dcc8;
        box-shadow: 0 18px 36px rgba(74, 52, 40, 0.12);
        transition:
          transform 0.3s ease,
          box-shadow 0.3s ease,
          border-color 0.3s ease;
        overflow: hidden;
        position: relative;
      }

      .team-card::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(212, 165, 116, 0.18), rgba(184, 115, 51, 0.08));
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }

      .team-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 22px 44px rgba(74, 52, 40, 0.18);
        border-color: #d4a574;
      }

      .team-card:hover::after {
        opacity: 1;
      }

      .team-card-content {
        display: flex;
        align-items: center;
        gap: 1.2rem;
        padding: 1.6rem 1.8rem;
        position: relative;
        z-index: 1;
      }

      .team-icon {
        width: 3.2rem;
        height: 3.2rem;
        border-radius: 16px;
        background: rgba(247, 239, 225, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
        color: #d9794d;
        box-shadow: 0 8px 18px rgba(212, 165, 116, 0.35);
      }

      .team-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .team-label {
        font-size: 0.75rem;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #c9a87f;
      }

      .team-name {
        font-size: 1.25rem;
        font-weight: 600;
        color: #4a3828;
      }

      .team-action {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.3rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: #c87250;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }

      .team-arrow {
        font-size: 1.1rem;
        color: #d9794d;
      }

      .team-creation-form {
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

      @media (max-width: 768px) {
        .teams-grid {
          grid-template-columns: 1fr;
          gap: 1.2rem;
        }

        .team-card-content {
          flex-direction: column;
          align-items: flex-start;
        }

        .team-action {
          flex-direction: row;
          align-items: center;
          gap: 0.5rem;
        }

        .team-arrow {
          display: inline-block;
        }
      }

      @media (max-width: 480px) {
        .team-card-content {
          align-items: center;
          text-align: center;
        }

        .team-action {
          align-items: center;
        }
      }
    `,
  ],
})
export class TeamSelectComponent {
  eventCode!: string;
  nickname!: string;
  teams: Array<{ id: string; name: string }> = [];
  newTeam = '';
  tableMode = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private session: SessionService,
    private theme: ThemeService,
  ) {
    this.eventCode = this.route.snapshot.parent!.params['eventCode'];
    this.nickname = this.route.snapshot.queryParams['nickname'] ?? '';

    // Vérifier si une session existe déjà pour cet événement
    const existingSession = this.session.load();
    if (existingSession && existingSession.eventCode === this.eventCode) {
      // Rediriger directement vers la page de jeu
      this.router.navigate(['../round'], { relativeTo: this.route });
      return;
    }

    // Charger les informations de l'événement pour vérifier le mode table
    this.api.getEventPublic(this.eventCode).subscribe((event) => {
      this.tableMode = event.settings?.tableMode || false;
    });

    this.refresh();
    this.theme.loadEventTheme(this.eventCode).subscribe();
  }

  refresh() {
    this.api.getTeams(this.eventCode).subscribe((list) => (this.teams = list));
  }

  createTeam() {
    this.api.createTeam(this.eventCode, this.newTeam.trim()).subscribe({
      next: (team) => {
        this.newTeam = '';
        // Auto-sélectionner l'équipe créée et rejoindre l'événement
        this.selectTeam(team.id);
      },
    });
  }

  trackByTeamId(index: number, team: any): string {
    return team.id;
  }

  selectTeam(teamId: string) {
    this.api.joinEvent(this.eventCode, teamId, this.nickname).subscribe({
      next: ({ teamToken, player }) => {
        this.session.save({
          eventCode: this.eventCode,
          teamId: player.teamId,
          playerId: player.id,
          nickname: player.nickname,
          teamToken,
          isCaptain: player.isCaptain,
        });

        // Si le mode table est activé, rediriger vers la sélection de table
        if (this.tableMode) {
          this.router.navigate(['../table'], { relativeTo: this.route });
        } else {
          this.router.navigate(['../round'], { relativeTo: this.route });
        }
      },
      error: (err) => {
        if (err.error?.code === 'PLAYER_NICK_TAKEN') {
          alert('Ce pseudo est déjà pris dans cet événement. Veuillez retourner en arrière et choisir un autre pseudo.');
        } else {
          alert('Erreur lors de la connexion. Veuillez réessayer.');
        }
      }
    });
  }
}
