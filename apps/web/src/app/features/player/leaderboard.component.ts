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

      .leaderboard-card {
        overflow: hidden;
        background: rgba(255, 255, 255, 0.97);
        border: 2px solid #e8dcc8;
        border-radius: 24px;
        box-shadow: 0 22px 48px rgba(74, 52, 40, 0.12);
        backdrop-filter: blur(8px);
      }

      .leaderboard-table-container {
        overflow-x: auto;
        margin-top: 1.5rem;
        border-radius: 18px;
        border: 1px solid rgba(232, 220, 200, 0.6);
        background: rgba(250, 248, 244, 0.9);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
      }

      .leaderboard-table {
        width: 100%;
        border-collapse: collapse;
      }

      .leaderboard-table thead {
        background: linear-gradient(135deg, rgba(212, 165, 116, 0.28), rgba(184, 115, 51, 0.18));
        color: #4a3828;
      }

      .leaderboard-table th {
        padding: 1rem 0.75rem;
        font-weight: 600;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        font-size: 0.85rem;
      }

      .leaderboard-table td {
        padding: 1.1rem 0.75rem;
        border-top: 1px solid rgba(232, 220, 200, 0.6);
        background: rgba(255, 255, 255, 0.75);
      }

      .leaderboard-table .rank-column {
        width: 80px;
        text-align: center;
      }

      .leaderboard-table .team-column {
        min-width: 200px;
      }

      .leaderboard-table .points-column {
        width: 120px;
        text-align: center;
      }

      .leaderboard-table .medal-column {
        width: 100px;
        text-align: center;
      }

      .team-row.gold-position td {
        background: linear-gradient(135deg, rgba(255, 234, 196, 0.45), rgba(255, 225, 170, 0.3));
      }

      .team-row.silver-position td {
        background: linear-gradient(135deg, rgba(232, 230, 227, 0.45), rgba(223, 221, 216, 0.3));
      }

      .team-row.bronze-position td {
        background: linear-gradient(135deg, rgba(236, 209, 182, 0.45), rgba(226, 191, 152, 0.3));
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
        background: rgba(212, 165, 116, 0.18);
        color: #c87250;
        box-shadow: 0 8px 16px rgba(212, 165, 116, 0.25);
      }

      .rank-badge.rank-1 {
        background: linear-gradient(135deg, #ffd700, #ffed4e);
        color: #7a4d00;
      }

      .rank-badge.rank-2 {
        background: linear-gradient(135deg, #c0c0c0, #e5e5e5);
        color: #4a4a4a;
      }

      .rank-badge.rank-3 {
        background: linear-gradient(135deg, #cd7f32, #daa520);
        color: #fff8e7;
      }

      .team-info {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .team-icon {
        width: 2.6rem;
        height: 2.6rem;
        border-radius: 14px;
        background: rgba(247, 239, 225, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.4rem;
        color: #d9794d;
        box-shadow: 0 6px 16px rgba(212, 165, 116, 0.35);
      }

      .team-name {
        font-weight: 600;
        color: #4a3828;
        font-size: 1.05rem;
      }

      .points-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.2rem;
      }

      .points-value {
        font-size: 1.6rem;
        font-weight: 700;
        color: #8b6f47;
      }

      .points-label {
        font-size: 0.75rem;
        color: #c87250;
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }

      .medal {
        font-size: 2rem;
        animation: autumnPulse 2s infinite;
      }

      .stats-card {
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid #e8dcc8;
        border-radius: 24px;
        box-shadow: 0 20px 44px rgba(74, 52, 40, 0.12);
        backdrop-filter: blur(8px);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
      }

      .stat-item {
        text-align: center;
        padding: 1.2rem;
        border-radius: 18px;
        background: rgba(247, 239, 225, 0.9);
        border: 1px solid rgba(212, 165, 116, 0.35);
        box-shadow: 0 12px 24px rgba(74, 52, 40, 0.08);
      }

      .stat-icon {
        font-size: 2rem;
        margin-bottom: 0.4rem;
        color: #d9794d;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #4a3828;
      }

      .stat-label {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #8b6f47;
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
        .leaderboard-table-container {
          margin-top: 1.2rem;
        }

        .leaderboard-table th,
        .leaderboard-table td {
          padding: 0.8rem 0.5rem;
        }

        .rank-badge {
          width: 34px;
          height: 34px;
          font-size: 0.95rem;
        }

        .team-info {
          gap: 0.8rem;
        }

        .team-name {
          font-size: 0.95rem;
        }

        .points-value {
          font-size: 1.35rem;
        }

        .medal {
          font-size: 1.6rem;
        }

        .stats-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 1.1rem;
        }

        .stat-item {
          padding: 1rem;
        }
      }

      @media (max-width: 480px) {
        .leaderboard-table {
          font-size: 0.85rem;
        }

        .leaderboard-table th,
        .leaderboard-table td {
          padding: 0.7rem 0.4rem;
        }

        .rank-badge {
          width: 28px;
          height: 28px;
          font-size: 0.85rem;
        }

        .team-info {
          gap: 0.6rem;
        }

        .team-name {
          font-size: 0.85rem;
        }

        .points-value {
          font-size: 1.1rem;
        }

        .stats-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .stat-item {
          padding: 0.8rem;
        }
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
