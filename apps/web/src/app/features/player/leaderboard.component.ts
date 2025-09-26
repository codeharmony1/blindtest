import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { SocketService } from '../../core/services/socket.service';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'bt-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard-autumn.component.html',
  styleUrls: ['../../shared/styles/autumn-wedding.scss'],
  styles: [
    `
      .leaderboard-card {
        overflow: hidden;
      }

      .leaderboard-table-container {
        overflow-x: auto;
        margin-top: 1.5rem;
      }

      .leaderboard-table {
        .rank-column {
          width: 80px;
          text-align: center;
        }
        .team-column {
          min-width: 200px;
        }
        .points-column {
          width: 120px;
          text-align: center;
        }
        .medal-column {
          width: 80px;
          text-align: center;
        }
      }

      /* Mobile optimizations for leaderboard */
      @media (max-width: 768px) {
        .leaderboard-table-container {
          margin-top: 1rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .leaderboard-table {
          min-width: 100%;
          font-size: 0.9rem;

          th,
          td {
            padding: 0.8rem 0.5rem;
          }

          .rank-column {
            width: 60px;
          }
          .team-column {
            min-width: 120px;
          }
          .points-column {
            width: 80px;
          }
          .medal-column {
            width: 60px;
          }
        }

        .rank-badge {
          width: 30px;
          height: 30px;
          font-size: 0.9rem;
        }

        .team-info {
          gap: 0.6rem;
        }

        .team-icon {
          font-size: 1.2rem;
        }

        .team-name {
          font-size: 0.9rem;
        }

        .points-value {
          font-size: 1.2rem;
        }

        .points-label {
          font-size: 0.7rem;
        }

        .medal {
          font-size: 1.5rem;
        }

        .stats-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 1rem;
        }

        .stat-item {
          padding: 0.8rem;
        }

        .stat-icon {
          font-size: 1.5rem;
          margin-bottom: 0.3rem;
        }

        .stat-value {
          font-size: 1.5rem;
        }

        .stat-label {
          font-size: 0.8rem;
        }
      }

      @media (max-width: 480px) {
        .leaderboard-table {
          font-size: 0.8rem;

          th,
          td {
            padding: 0.6rem 0.3rem;
          }
        }

        .rank-badge {
          width: 25px;
          height: 25px;
          font-size: 0.8rem;
        }

        .team-name {
          font-size: 0.8rem;
        }

        .points-value {
          font-size: 1rem;
        }

        .medal {
          font-size: 1.2rem;
        }

        .stats-grid {
          grid-template-columns: 1fr;
          gap: 0.8rem;
        }

        .stat-item {
          padding: 0.6rem;
        }

        .stat-icon {
          font-size: 1.3rem;
        }

        .stat-value {
          font-size: 1.3rem;
        }

        .stat-label {
          font-size: 0.75rem;
        }
      }

      .team-row {
        &.gold-position {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05));
        }

        &.silver-position {
          background: linear-gradient(135deg, rgba(192, 192, 192, 0.1), rgba(192, 192, 192, 0.05));
        }

        &.bronze-position {
          background: linear-gradient(135deg, rgba(205, 127, 50, 0.1), rgba(205, 127, 50, 0.05));
        }
      }

      .rank-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        font-weight: 700;
        font-size: 1.1rem;

        &.rank-1 {
          background: linear-gradient(45deg, #ffd700, #ffed4e);
          color: #8b4513;
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
        }

        &.rank-2 {
          background: linear-gradient(45deg, #c0c0c0, #e5e5e5);
          color: #4a4a4a;
          box-shadow: 0 4px 12px rgba(192, 192, 192, 0.4);
        }

        &.rank-3 {
          background: linear-gradient(45deg, #cd7f32, #daa520);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(205, 127, 50, 0.4);
        }

        &.rank-other {
          background: var(--autumn-gold);
          color: var(--autumn-warm-white);
        }
      }

      .team-info {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .team-icon {
        font-size: 1.5rem;
      }

      .team-name {
        font-weight: 600;
        color: var(--autumn-burgundy);
      }

      .points-display {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .points-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--autumn-brown);
      }

      .points-label {
        font-size: 0.8rem;
        color: var(--autumn-copper);
        text-transform: uppercase;
      }

      .medal {
        font-size: 2rem;
        animation: autumnPulse 2s infinite;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
      }

      .stat-item {
        text-align: center;
        padding: 1rem;
        background: rgba(212, 175, 55, 0.1);
        border-radius: 10px;
        border: 1px solid rgba(212, 175, 55, 0.2);
      }

      .stat-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--autumn-burgundy);
        margin-bottom: 0.2rem;
      }

      .stat-label {
        font-size: 0.9rem;
        color: var(--autumn-brown);
        text-transform: uppercase;
        letter-spacing: 1px;
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
export class LeaderboardComponent implements OnDestroy {
  eventCode!: string;
  rows: Array<{ teamId: string; name: string; totalPoints: number; rank: number }> = [];

  constructor(
    private api: ApiService,
    private socket: SocketService,
    private route: ActivatedRoute,
    private theme: ThemeService,
  ) {
    this.eventCode = this.route.snapshot.parent!.params['eventCode'];
    // Appliquer le thème sélectionné pour l'événement
    this.theme.loadEventTheme(this.eventCode).subscribe();
    this.socket.connect();
    this.socket.joinEvent(this.eventCode, 'PLAYER');
    this.socket.on<any>('leaderboard_update', (d) => {
      if (d?.eventCode === this.eventCode) this.rows = d.teams;
    });
    this.refresh();
  }
  refresh() {
    this.api.getLeaderboard(this.eventCode).subscribe((list) => (this.rows = list));
  }

  trackByTeamId(index: number, item: any): string {
    return item.teamId;
  }

  getRankClass(rank: number): string {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'rank-other';
  }

  getTeamIcon(rank: number): string {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🎭';
  }

  getMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  }

  getTotalPoints(): number {
    return this.rows.reduce((sum, team) => sum + team.totalPoints, 0);
  }

  getAveragePoints(): number {
    if (this.rows.length === 0) return 0;
    return this.getTotalPoints() / this.rows.length;
  }

  ngOnDestroy() {
    this.socket.disconnect();
  }
}
