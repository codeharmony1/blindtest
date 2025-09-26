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
      .teams-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
      }

      .team-card {
        background: linear-gradient(135deg, var(--autumn-cream), var(--autumn-soft-yellow));
        border: 2px solid var(--autumn-gold);
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      /* Mobile optimizations for team selection */
      @media (max-width: 768px) {
        .teams-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-top: 1rem;
        }

        .team-card {
          padding: 1.2rem;
          display: flex;
          align-items: center;
          text-align: left;
          gap: 1rem;
        }

        .team-icon {
          font-size: 2rem;
          flex: none;
        }

        .team-name {
          font-size: 1.1rem;
          flex: 1;
        }

        .team-action {
          font-size: 0.8rem;
          text-align: right;
          flex: none;
        }

        .team-creation-form {
          gap: 1.2rem;
        }
      }

      @media (max-width: 480px) {
        .team-card {
          padding: 1rem;
          flex-direction: column;
          text-align: center;
          gap: 0.8rem;
        }

        .team-icon {
          font-size: 2.5rem;
        }

        .team-name {
          font-size: 1rem;
        }

        .team-action {
          font-size: 0.75rem;
          text-align: center;
        }

        .team-creation-form {
          gap: 1rem;
        }
      }

      .team-card:hover {
        transform: translateY(-4px);
        border-color: var(--autumn-copper);
        box-shadow: 0 8px 24px var(--autumn-shadow);
      }

      .team-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent);
        transition: left 0.5s ease;
      }

      .team-card:hover::before {
        left: 100%;
      }

      .team-icon {
        font-size: 2.5rem;
        margin-bottom: 0.8rem;
      }

      .team-name {
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--autumn-burgundy);
        margin-bottom: 0.8rem;
      }

      .team-action {
        color: var(--autumn-brown);
        font-size: 0.9rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .team-creation-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .autumn-label {
        font-weight: 600;
        color: var(--autumn-burgundy);
        margin-bottom: 0.5rem;
        font-size: 1.1rem;
      }

      .btn-icon {
        margin-right: 0.5rem;
      }

      .event-subtitle {
        font-size: 1.3rem;
        margin-top: 1rem;
        color: var(--autumn-cream);
        font-style: italic;
        opacity: 0.9;
      }
    `,
  ],
})
export class TeamSelectComponent {
  eventCode!: string;
  nickname!: string;
  teams: Array<{ id: string; name: string }> = [];
  newTeam = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private session: SessionService,
    private theme: ThemeService,
  ) {
    this.eventCode = this.route.snapshot.parent!.params['eventCode'];
    this.nickname = this.route.snapshot.queryParams['nickname'] ?? '';
    this.refresh();
    this.theme.loadEventTheme(this.eventCode).subscribe();
  }

  refresh() {
    this.api.getTeams(this.eventCode).subscribe((list) => (this.teams = list));
  }

  createTeam() {
    this.api.createTeam(this.eventCode, this.newTeam.trim()).subscribe({
      next: (_) => {
        this.newTeam = '';
        this.refresh();
      },
    });
  }

  trackByTeamId(index: number, team: any): string {
    return team.id;
  }

  selectTeam(teamId: string) {
    this.api.joinEvent(this.eventCode, teamId, this.nickname).subscribe(({ teamToken, player }) => {
      this.session.save({
        eventCode: this.eventCode,
        teamId: player.teamId,
        playerId: player.id,
        nickname: player.nickname,
        teamToken,
        isCaptain: player.isCaptain,
      });
      this.router.navigate(['../round'], { relativeTo: this.route });
    });
  }
}
