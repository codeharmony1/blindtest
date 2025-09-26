import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../core/services/session.service';
import { ApiService } from '../../core/services/api.service';
import { SocketService } from '../../core/services/socket.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'bt-round',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './round-autumn.component.html',
  styleUrls: ['../../shared/styles/autumn-wedding.scss'],
  styles: [
    `
      .player-info {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-top: 1rem;
        justify-content: center;
      }

      .team-badge {
        background: var(--autumn-burgundy);
        color: var(--autumn-cream);
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.9rem;
      }

      .player-name {
        color: var(--autumn-cream);
        font-size: 1.2rem;
        font-weight: 500;
      }

      /* Mobile optimizations for game interface */
      @media (max-width: 768px) {
        .player-info {
          flex-direction: column;
          gap: 0.8rem;
          margin-top: 0.8rem;
        }

        .team-badge {
          font-size: 0.8rem;
          padding: 0.4rem 0.8rem;
        }

        .player-name {
          font-size: 1rem;
        }

        .timer-card {
          margin-bottom: 1rem;
        }

        .timer-display {
          gap: 1rem;
          margin-bottom: 0.8rem;
        }

        .timer-icon {
          font-size: 2.5rem;
        }

        .timer-value {
          font-size: 2rem;
        }

        .timer-label {
          font-size: 0.9rem;
          margin-bottom: 0.3rem;
        }

        .answer-form {
          gap: 1.2rem;
        }

        .answer-input {
          font-size: 1rem;
          padding: 1rem 1.2rem;
        }

        .autumn-label {
          font-size: 1rem;
          text-align: center;
        }
      }

      @media (max-width: 480px) {
        .timer-display {
          flex-direction: column;
          text-align: center;
          gap: 0.8rem;
        }

        .timer-icon {
          font-size: 2rem;
        }

        .timer-value {
          font-size: 1.8rem;
        }

        .timer-label {
          font-size: 0.8rem;
        }

        .answer-input {
          font-size: 0.9rem;
          padding: 0.9rem 1rem;
        }

        .autumn-label {
          font-size: 0.9rem;
        }

        .player-info {
          gap: 0.6rem;
        }

        .team-badge {
          font-size: 0.75rem;
          padding: 0.3rem 0.6rem;
        }
      }

      @media (max-height: 600px) {
        .timer-display {
          margin-bottom: 0.5rem;
        }

        .timer-icon {
          font-size: 2rem;
        }

        .timer-value {
          font-size: 1.6rem;
        }

        .answer-form {
          gap: 1rem;
        }

        .answer-input {
          padding: 0.8rem 1rem;
        }
      }

      .timer-card {
        background: linear-gradient(135deg, var(--autumn-gold), var(--autumn-copper));
        color: var(--autumn-warm-white);
      }

      .timer-display {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-bottom: 1rem;
      }

      .timer-icon {
        font-size: 3rem;
      }

      .timer-content {
        flex: 1;
      }

      .timer-label {
        font-size: 1rem;
        opacity: 0.9;
        margin-bottom: 0.5rem;
      }

      .timer-value {
        font-size: 2.5rem;
        font-weight: 700;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
      }

      .timer-urgent {
        color: #ff4757 !important;
        animation: autumnPulse 1s infinite;
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: var(--autumn-warm-white);
        transition: width 0.1s ease;
        border-radius: 4px;
      }

      .progress-urgent {
        background: #ff4757;
        animation: autumnPulse 0.5s infinite;
      }

      .answer-form {
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

      .answer-input {
        font-size: 1.1rem;
        padding: 1.2rem 1.5rem;
      }

      .btn-icon {
        margin-right: 0.5rem;
      }

      .navigation-card {
        text-align: center;
      }
    `,
  ],
})
export class RoundComponent implements OnDestroy {
  session: any;
  answer = '';
  sending = false;

  eventCode!: string;
  songId: string | null = null;
  endsAt: number = 0;
  remaining: number = 0;
  private timer?: any;

  constructor(
    private sessionSvc: SessionService,
    private api: ApiService,
    private socket: SocketService,
    private router: Router,
    private route: ActivatedRoute,
    private theme: ThemeService,
  ) {
    this.session = this.sessionSvc.load();
    this.eventCode = this.route.snapshot.parent!.params['eventCode'];
    // Appliquer le thème de l'événement
    this.theme.loadEventTheme(this.eventCode).subscribe();
    if (!this.session) return;
    this.socket.connect();
    this.socket.joinEvent(this.eventCode, 'PLAYER', this.session.teamId);

    this.socket.on<any>('round_started', (d) => {
      this.songId = String(d.songId);
      this.endsAt = new Date(d.endsAt).getTime();
      this.startCountdown();
    });
    this.socket.on<any>('round_ended', (_d) => {
      this.stopCountdown();
    });
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

  send() {
    if (!this.session || !this.songId) return;
    this.sending = true;
    this.api.submitAnswer(this.songId, this.answer, this.session.teamToken).subscribe({
      next: (_) => (this.sending = false),
      error: (_) => (this.sending = false),
    });
  }

  goLeaderboard() {
    this.router.navigate(['../leaderboard'], { relativeTo: this.route });
  }
  back() {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }
  ngOnDestroy() {
    this.stopCountdown();
    this.socket.disconnect();
  }
}
