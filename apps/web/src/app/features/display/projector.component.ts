import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../core/services/socket.service';
import { ApiService } from '../../core/services/api.service';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'bt-projector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projector-autumn.component.html',
  styleUrls: ['../../shared/styles/autumn-wedding.scss'],
  styles: [
    `
      .projector-display {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      .projector-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
        width: 100%;
      }

      .projector-header {
        text-align: center;
        margin-bottom: 3rem;
      }

      .event-title {
        font-size: 4rem;
        margin: 0;
        background: linear-gradient(45deg, var(--autumn-gold), var(--autumn-copper));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 2px 2px 4px var(--autumn-shadow);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .event-icon {
        font-size: 4.5rem;
        filter: drop-shadow(2px 2px 4px var(--autumn-shadow));
      }

      .event-code-display {
        background: var(--autumn-burgundy);
        color: var(--autumn-cream);
        padding: 1rem 2rem;
        border-radius: 30px;
        font-size: 2.5rem;
        box-shadow: 0 8px 24px var(--autumn-shadow);
      }

      .event-tagline {
        font-size: 1.8rem;
        color: var(--autumn-brown);
        margin-top: 1rem;
        font-style: italic;
      }

      .game-phase {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .timer-display-large {
        margin-bottom: 3rem;
      }

      .timer-circle {
        width: 300px;
        height: 300px;
        border: 8px solid var(--autumn-gold);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow:
          0 0 0 4px var(--autumn-copper),
          0 8px 32px var(--autumn-shadow);
        background: linear-gradient(135deg, var(--autumn-cream), var(--autumn-soft-yellow));
        position: relative;
        overflow: hidden;
      }

      .timer-circle::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: conic-gradient(var(--autumn-gold), var(--autumn-copper), var(--autumn-gold));
        border-radius: 50%;
        animation: autumnSpin 10s linear infinite;
        opacity: 0.1;
      }

      .timer-inner {
        z-index: 1;
      }

      .time-value {
        font-size: 5rem;
        font-weight: 900;
        color: var(--autumn-burgundy);
        text-shadow: 2px 2px 4px var(--autumn-shadow);
        line-height: 1;
      }

      .time-unit {
        font-size: 1.5rem;
        color: var(--autumn-brown);
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-top: 0.5rem;
      }

      .game-instruction {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        font-size: 2.5rem;
        color: var(--autumn-brown);
        margin-bottom: 3rem;
      }

      .instruction-icon {
        font-size: 3rem;
        animation: autumnPulse 2s infinite;
      }

      .musical-animation {
        display: flex;
        gap: 2rem;
        font-size: 3rem;
      }

      .note {
        animation: autumnFloat 3s ease-in-out infinite;
        opacity: 0.7;
      }

      .note-1 {
        animation-delay: 0s;
      }
      .note-2 {
        animation-delay: 0.5s;
      }
      .note-3 {
        animation-delay: 1s;
      }
      .note-4 {
        animation-delay: 1.5s;
      }

      .pause-phase {
        flex: 1;
      }

      .official-answer {
        text-align: center;
        margin-bottom: 4rem;
        padding: 2rem;
        background: linear-gradient(135deg, var(--autumn-gold), var(--autumn-copper));
        border-radius: 20px;
        color: var(--autumn-warm-white);
        box-shadow: 0 8px 32px var(--autumn-shadow);
      }

      .official-title {
        font-size: 2.5rem;
        margin: 0 0 1.5rem 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
      }

      .official-icon {
        font-size: 3rem;
      }

      .answer-display {
        font-size: 2rem;
      }

      .song-title {
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      .song-artist {
        font-style: italic;
        opacity: 0.9;
      }

      .leaderboard-title {
        text-align: center;
        font-size: 3rem;
        color: var(--autumn-burgundy);
        margin: 0 0 3rem 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
      }

      .leaderboard-icon {
        font-size: 3.5rem;
      }

      .podium-display {
        margin-bottom: 3rem;
      }

      .podium {
        display: flex;
        align-items: end;
        justify-content: center;
        gap: 2rem;
        margin-bottom: 3rem;
      }

      .podium-position {
        text-align: center;
        padding: 2rem 1.5rem;
        border-radius: 15px;
        box-shadow: 0 8px 24px var(--autumn-shadow);
        min-width: 200px;
      }

      .podium-position.gold {
        background: linear-gradient(135deg, #ffd700, #ffed4e);
        height: 250px;
        order: 2;
      }

      .podium-position.silver {
        background: linear-gradient(135deg, #c0c0c0, #e5e5e5);
        height: 200px;
        order: 1;
      }

      .podium-position.bronze {
        background: linear-gradient(135deg, #cd7f32, #daa520);
        height: 150px;
        order: 3;
      }

      .position-medal {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      .position-rank {
        font-size: 1.5rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 1rem;
        color: #333;
      }

      .position-team {
        font-size: 1.3rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #333;
      }

      .position-points {
        font-size: 1.1rem;
        color: #666;
      }

      .projector-table {
        font-size: 1.3rem;

        th {
          font-size: 1.5rem;
          padding: 1.5rem;
        }

        td {
          padding: 1.2rem 1.5rem;
        }
      }

      .rank-display {
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--autumn-burgundy);
        text-align: center;
      }

      .team-display {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--autumn-brown);
      }

      .points-display {
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--autumn-burgundy);
        text-align: center;
      }

      .medal-display {
        font-size: 2.5rem;
        text-align: center;
      }

      .rank-1 {
        background: rgba(255, 215, 0, 0.1) !important;
      }
      .rank-2 {
        background: rgba(192, 192, 192, 0.1) !important;
      }
      .rank-3 {
        background: rgba(205, 127, 50, 0.1) !important;
      }

      .no-scores {
        text-align: center;
        padding: 4rem;
        color: var(--autumn-brown);
      }

      .no-scores-icon {
        font-size: 8rem;
        margin-bottom: 2rem;
        opacity: 0.5;
      }

      .no-scores-text {
        font-size: 2.5rem;
        font-style: italic;
      }

      @keyframes autumnSpin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes autumnFloat {
        0%,
        100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-20px);
        }
      }

      /* Responsive pour projecteur */
      @media (max-width: 1200px) {
        .projector-container {
          padding: 1.5rem;
        }

        .event-title {
          font-size: 3rem;
          gap: 0.8rem;
        }

        .event-code-display {
          font-size: 2rem;
          padding: 0.8rem 1.5rem;
        }

        .timer-circle {
          width: 250px;
          height: 250px;
        }

        .time-value {
          font-size: 4rem;
        }

        .podium {
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .podium-position {
          width: 100%;
          max-width: 400px;
          height: auto !important;
          order: unset !important;
        }

        .projector-table {
          font-size: 1.1rem;
        }
      }

      @media (max-width: 768px) {
        .projector-container {
          padding: 1rem;
        }

        .event-title {
          font-size: 2.5rem;
          flex-direction: column;
          text-align: center;
        }

        .event-icon {
          font-size: 3rem;
        }

        .event-code-display {
          font-size: 1.5rem;
          padding: 0.6rem 1.2rem;
        }

        .event-tagline {
          font-size: 1.4rem;
        }

        .timer-circle {
          width: 200px;
          height: 200px;
        }

        .time-value {
          font-size: 3rem;
        }

        .time-unit {
          font-size: 1.2rem;
        }

        .game-instruction {
          font-size: 2rem;
          flex-direction: column;
          gap: 1rem;
        }

        .instruction-icon {
          font-size: 2.5rem;
        }

        .musical-animation {
          gap: 1.5rem;
          font-size: 2.5rem;
        }

        .official-answer {
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .official-title {
          font-size: 2rem;
          flex-direction: column;
          gap: 0.8rem;
        }

        .answer-display {
          font-size: 1.5rem;
        }

        .leaderboard-title {
          font-size: 2.5rem;
          flex-direction: column;
          gap: 0.8rem;
        }

        .podium-position {
          max-width: 300px;
          padding: 1.5rem 1rem;
        }

        .position-medal {
          font-size: 3rem;
        }

        .position-rank {
          font-size: 1.2rem;
        }

        .position-team {
          font-size: 1.1rem;
        }

        .projector-table {
          font-size: 1rem;

          th {
            font-size: 1.2rem;
            padding: 1rem;
          }

          td {
            padding: 1rem;
          }
        }

        .rank-display {
          font-size: 1.5rem;
        }

        .team-display {
          font-size: 1.2rem;
        }

        .points-display {
          font-size: 1.5rem;
        }

        .medal-display {
          font-size: 2rem;
        }
      }

      @media (max-width: 480px) {
        .projector-container {
          padding: 0.8rem;
        }

        .event-title {
          font-size: 2rem;
        }

        .event-icon {
          font-size: 2.5rem;
        }

        .event-code-display {
          font-size: 1.2rem;
          padding: 0.5rem 1rem;
        }

        .event-tagline {
          font-size: 1.1rem;
        }

        .timer-circle {
          width: 150px;
          height: 150px;
        }

        .time-value {
          font-size: 2.5rem;
        }

        .time-unit {
          font-size: 1rem;
        }

        .game-instruction {
          font-size: 1.5rem;
        }

        .instruction-icon {
          font-size: 2rem;
        }

        .musical-animation {
          font-size: 2rem;
          gap: 1rem;
        }

        .official-answer {
          padding: 1rem;
        }

        .official-title {
          font-size: 1.5rem;
        }

        .answer-display {
          font-size: 1.2rem;
        }

        .leaderboard-title {
          font-size: 2rem;
        }

        .podium-position {
          padding: 1rem;
        }

        .position-medal {
          font-size: 2.5rem;
        }

        .projector-table {
          font-size: 0.9rem;

          th,
          td {
            padding: 0.8rem 0.5rem;
          }
        }

        .no-scores-icon {
          font-size: 6rem;
        }

        .no-scores-text {
          font-size: 2rem;
        }
      }

      @media (max-height: 600px) {
        .projector-header {
          margin-bottom: 1.5rem;
        }

        .event-title {
          font-size: 2rem;
        }

        .timer-circle {
          width: 120px;
          height: 120px;
        }

        .time-value {
          font-size: 2rem;
        }

        .game-instruction {
          font-size: 1.3rem;
          margin-bottom: 1.5rem;
        }

        .official-answer {
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .leaderboard-title {
          font-size: 1.8rem;
          margin-bottom: 1.5rem;
        }

        .podium {
          margin-bottom: 1.5rem;
        }
      }
    `,
  ],
})
export class ProjectorComponent implements OnDestroy {
  eventCode!: string;
  inRound = false;
  officialTitle = '';
  officialArtist = '';
  rows: Array<{ teamId: string; name: string; totalPoints: number; rank: number }> = [];

  endsAt = 0;
  remaining = 0;
  timer?: any;

  constructor(
    private socket: SocketService,
    private api: ApiService,
    private route: ActivatedRoute,
    private theme: ThemeService,
  ) {
    this.eventCode = this.route.snapshot.params['eventCode'];
    // Appliquer le thème de l'événement sur l'affichage projecteur
    this.theme.loadEventTheme(this.eventCode).subscribe();
    this.socket.connect();
    this.socket.joinEvent(this.eventCode, 'DISPLAY');

    this.socket.on<any>('round_started', (d) => {
      this.inRound = true;
      this.officialTitle = '';
      this.officialArtist = '';
      this.endsAt = new Date(d.endsAt).getTime();
      this.startCountdown();
    });
    this.socket.on<any>('round_ended', (_d) => {
      this.inRound = false;
      this.stopCountdown();
    });
    this.socket.on<any>('leaderboard_update', (d) => {
      if (d?.eventCode === this.eventCode) this.rows = d.teams;
    });
    this.socket.on<any>('official_answer', (d) => {
      this.officialTitle = d.title ?? '';
      this.officialArtist = d.artist ?? '';
    });

    // Premier chargement du classement si pause
    this.api.getLeaderboard(this.eventCode).subscribe((list) => (this.rows = list));
  }

  toggleAmbient() {
    const key = 'bt_enable_ambient';
    const current = localStorage.getItem(key);
    const enabled = current !== 'false';
    localStorage.setItem(key, enabled ? 'false' : 'true');
    const t = this.theme.getCurrentTheme();
    if (t) this.theme.applyTheme(t);
  }

  startCountdown() {
    this.stopCountdown();
    this.tick();
    this.timer = setInterval(() => this.tick(), 100);
  }
  stopCountdown() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
  tick() {
    this.remaining = Math.max(0, this.endsAt - Date.now());
    if (this.remaining === 0) this.stopCountdown();
  }

  trackByTeamId(index: number, item: any): string {
    return item.teamId;
  }

  getMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  }

  ngOnDestroy() {
    this.stopCountdown();
    this.socket.disconnect();
  }
}
