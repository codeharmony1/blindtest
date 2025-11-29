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

      .round-status-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2rem;
        position: relative;
        background: linear-gradient(135deg, #a65845 0%, #c87250 45%, #ddb685 100%);
        color: #fff9f0;
        border-radius: 28px;
        padding: 2.5rem 2.8rem;
        box-shadow: 0 22px 48px rgba(166, 88, 69, 0.35);
        backdrop-filter: blur(6px);
        border: none;
        overflow: hidden;
      }

      .round-status-card::before {
        display: none;
      }

      .round-status-card::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.28), transparent 60%);
        opacity: 0.7;
        pointer-events: none;
      }

      .round-status-card .status-left,
      .round-status-card .status-meta {
        position: relative;
        z-index: 1;
      }

      .round-status-card .status-left {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }

      .round-status-card .status-icon {
        font-size: 2.6rem;
        padding: 1rem;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.22);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.25);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .round-status-card .status-label {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 1.8px;
        font-size: 0.9rem;
        opacity: 0.92;
      }

      .round-status-card .status-title {
        margin: 0.4rem 0 0;
        font-size: 1.7rem;
        font-weight: 600;
      }

      .round-status-card .status-meta {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.6rem;
        font-size: 1.1rem;
        font-weight: 600;
        flex-wrap: wrap;
      }

      .round-status-card .status-team {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.65rem 1.6rem;
        border-radius: 999px;
        letter-spacing: 0.9px;
        background: rgba(255, 255, 255, 0.22);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.32);
        text-transform: uppercase;
      }

      .round-status-card .status-player {
        font-size: 1.1rem;
        color: rgba(255, 249, 240, 0.9);
      }

      .timer-card {
        background: linear-gradient(135deg, var(--autumn-gold), var(--autumn-copper));
        color: var(--autumn-warm-white);
        border-radius: 24px;
        box-shadow: 0 20px 36px rgba(74, 52, 40, 0.18);
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

      .waiting-card {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 24px;
        border: 2px solid #e8dcc8;
        box-shadow: 0 18px 36px rgba(74, 52, 40, 0.08);
        backdrop-filter: blur(8px);
      }

      .waiting-card::before,
      .answer-card::before,
      .answer-reveal-card::before {
        display: none;
      }

      .answer-reveal-card {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        background: linear-gradient(135deg, #8b7355 0%, #a68968 100%);
        color: #fff9f0;
        border-radius: 24px;
        border: 2px solid rgba(212, 165, 116, 0.4);
        box-shadow: 0 20px 40px rgba(139, 115, 85, 0.3);
        animation: slideInReveal 0.6s ease-out;
      }

      .reveal-icon {
        font-size: 2.5rem;
        background: rgba(255, 249, 240, 0.25);
        padding: 1rem;
        border-radius: 50%;
        box-shadow: 0 8px 16px rgba(74, 52, 40, 0.2);
      }

      .reveal-content {
        flex: 1;
      }

      .reveal-title {
        margin: 0 0 0.8rem;
        font-size: 1rem;
        font-weight: 600;
        opacity: 0.9;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }

      .reveal-song {
        margin: 0 0 0.4rem;
        font-size: 1.6rem;
        font-weight: 700;
        letter-spacing: 0.3px;
        line-height: 1.3;
      }

      .reveal-artist {
        margin: 0;
        font-size: 1.2rem;
        opacity: 0.95;
        font-style: italic;
      }

      @keyframes slideInReveal {
        from {
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .waiting-icon {
        font-size: 2.2rem;
        color: #d4a574;
        background: rgba(247, 239, 225, 0.85);
        padding: 0.85rem;
        border-radius: 16px;
        box-shadow: 0 12px 24px rgba(212, 165, 116, 0.25);
      }

      .waiting-texts {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .waiting-title {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
        color: #4a3828;
      }

      .waiting-subtitle {
        margin: 0;
        color: #8b6f47;
        font-size: 0.95rem;
      }

      .answer-card {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 24px;
        border: 2px solid #e8dcc8;
        box-shadow: 0 20px 40px rgba(74, 52, 40, 0.1);
        backdrop-filter: blur(10px);
      }

      .answer-header {
        display: flex;
        align-items: center;
        gap: 1.2rem;
      }

      .answer-icon {
        font-size: 2.1rem;
        background: linear-gradient(135deg, #d4a574 0%, #b87333 100%);
        padding: 0.85rem;
        border-radius: 50%;
        box-shadow: 0 12px 24px rgba(212, 165, 116, 0.3);
        color: #fffaf2;
      }

      .answer-subtitle {
        margin: 0.35rem 0 0;
        color: #8b6f47;
        font-size: 0.95rem;
      }

      .answer-form {
        display: flex;
        flex-direction: column;
        gap: 1.4rem;
      }

      .autumn-label {
        font-weight: 600;
        color: #8b6f47;
        font-size: 1rem;
      }

      .answer-input {
        font-size: 1.05rem;
        padding: 1.1rem 1.4rem;
        background: #faf8f4;
        border: 2px solid #e8dcc8;
        border-radius: 18px;
        color: #4a3828;
      }

      .answer-input::placeholder {
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

      .info-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: #fff9f0;
        border-radius: 20px;
        border: 2px solid rgba(212, 165, 116, 0.35);
        color: #8b6f47;
        box-shadow: 0 14px 30px rgba(74, 52, 40, 0.08);
      }

      .info-card::before {
        display: none;
      }

      .info-icon {
        font-size: 1.6rem;
        color: #d9794d;
      }

      .submitted-card {
        display: flex;
        align-items: center;
        gap: 1.2rem;
        background: linear-gradient(135deg, #8b7355 0%, #a68968 100%);
        color: #fff9f0;
        border-radius: 20px;
        border: 2px solid rgba(212, 165, 116, 0.4);
        box-shadow: 0 18px 36px rgba(139, 115, 85, 0.25);
        animation: slideInConfirm 0.5s ease-out;
      }

      .submitted-card::before {
        display: none;
      }

      .submitted-icon {
        font-size: 2rem;
        background: rgba(255, 249, 240, 0.25);
        padding: 0.8rem;
        border-radius: 50%;
        box-shadow: 0 8px 16px rgba(74, 52, 40, 0.2);
      }

      .submitted-content {
        flex: 1;
      }

      .submitted-title {
        margin: 0 0 0.4rem;
        font-size: 1rem;
        font-weight: 600;
        opacity: 0.9;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }

      .submitted-answer {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        letter-spacing: 0.3px;
        line-height: 1.4;
      }

      @keyframes slideInConfirm {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .navigation-card {
        text-align: center;
        background: transparent;
        border: none;
        box-shadow: none;
        padding: 0;
      }

      .navigation-card::before {
        display: none;
      }

      .autumn-footer-dots {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.6rem;
        margin-top: 2rem;
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
        .round-status-card {
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          gap: 1.5rem;
        }

        .round-status-card .status-meta {
          justify-content: flex-start;
        }

        .waiting-card {
          flex-direction: column;
          align-items: flex-start;
        }

        .waiting-icon {
          font-size: 2.1rem;
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
        }

        .autumn-footer-dots {
          margin-top: 1.5rem;
        }
      }

      @media (max-width: 480px) {
        .round-status-card {
          padding: 2rem 1.8rem;
        }

        .round-status-card .status-icon {
          font-size: 2.2rem;
          padding: 0.8rem;
        }

        .round-status-card .status-title {
          font-size: 1.35rem;
        }

        .round-status-card .status-player {
          font-size: 1.05rem;
        }

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
          font-size: 0.95rem;
          padding: 0.95rem 1.1rem;
        }

        .autumn-label {
          font-size: 0.95rem;
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

      @keyframes autumnPulse {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.05);
          opacity: 0.7;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      /* Styles pour le podium final */
      .final-podium-overlay {
        position: fixed;
        inset: 0;
        background: rgba(74, 52, 40, 0.95);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        animation: fadeIn 0.5s ease-out;
        overflow-y: auto;
      }

      .podium-container {
        max-width: 900px;
        width: 100%;
        background: rgba(255, 255, 255, 0.98);
        border-radius: 32px;
        padding: 3rem;
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
        animation: slideInPodium 0.8s ease-out;
      }

      .podium-header {
        text-align: center;
        margin-bottom: 2.5rem;
      }

      .podium-trophy {
        font-size: 4rem;
        margin-bottom: 1rem;
        animation: autumnPulse 2s infinite;
      }

      .podium-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: #4a3828;
        margin: 0 0 0.5rem;
      }

      .podium-subtitle {
        font-size: 1.2rem;
        color: #8b6f47;
        font-style: italic;
      }

      .podium-top3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
        margin: 2.5rem 0;
      }

      .podium-position {
        text-align: center;
        padding: 2rem 1.5rem;
        border-radius: 24px;
        position: relative;
        transition: transform 0.3s ease;
      }

      .podium-position:hover {
        transform: translateY(-8px);
      }

      .podium-position.first {
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(255, 234, 196, 0.25));
        border: 3px solid #ffd700;
        order: 2;
      }

      .podium-position.second {
        background: linear-gradient(135deg, rgba(192, 192, 192, 0.25), rgba(232, 230, 227, 0.25));
        border: 3px solid #c0c0c0;
        order: 1;
      }

      .podium-position.third {
        background: linear-gradient(135deg, rgba(205, 127, 50, 0.25), rgba(236, 209, 182, 0.25));
        border: 3px solid #cd7f32;
        order: 3;
      }

      .podium-medal {
        font-size: 3.5rem;
        margin-bottom: 0.8rem;
      }

      .podium-team-name {
        font-size: 1.4rem;
        font-weight: 700;
        color: #4a3828;
        margin: 0.5rem 0;
      }

      .podium-points {
        font-size: 2rem;
        font-weight: 700;
        color: #d9794d;
      }

      .podium-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin: 2rem 0;
        padding: 1.5rem;
        background: rgba(247, 239, 225, 0.5);
        border-radius: 18px;
      }

      .podium-stat {
        text-align: center;
      }

      .podium-stat-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #d9794d;
      }

      .podium-stat-label {
        font-size: 0.85rem;
        color: #8b6f47;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .podium-others {
        margin-top: 2rem;
      }

      .podium-others-title {
        font-size: 1.3rem;
        font-weight: 600;
        color: #4a3828;
        margin-bottom: 1rem;
        text-align: center;
      }

      .podium-other-team {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        margin-bottom: 0.5rem;
        background: rgba(247, 239, 225, 0.4);
        border-radius: 16px;
        border: 1px solid #e8dcc8;
      }

      .podium-other-rank {
        font-size: 1.2rem;
        font-weight: 700;
        color: #8b6f47;
        width: 40px;
      }

      .podium-other-name {
        flex: 1;
        font-size: 1.1rem;
        font-weight: 600;
        color: #4a3828;
      }

      .podium-other-points {
        font-size: 1.3rem;
        font-weight: 700;
        color: #d9794d;
      }

      .podium-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
        justify-content: center;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes slideInPodium {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @media (max-width: 768px) {
        .podium-container {
          padding: 2rem;
        }

        .podium-title {
          font-size: 2rem;
        }

        .podium-top3 {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .podium-position.first,
        .podium-position.second,
        .podium-position.third {
          order: initial;
        }

        .podium-medal {
          font-size: 2.5rem;
        }

        .podium-team-name {
          font-size: 1.2rem;
        }

        .podium-points {
          font-size: 1.6rem;
        }
      }
    `,
  ],
})
export class RoundComponent implements OnDestroy {
  session: any;
  answer = '';
  sending = false;
  submittedAnswer: string = ''; // Dernière réponse soumise
  showSubmittedConfirmation = false; // Flag pour afficher la confirmation

  eventCode!: string;
  songId: string | null = null;
  endsAt: number = 0;
  remaining: number = 0;
  private timer?: any;
  private autoSubmitted = false; // Flag pour éviter la double soumission

  // Affichage de la réponse correcte de la chanson précédente
  previousSongAnswer: { title: string | null; artist: string | null } | null = null;
  showPreviousAnswer = false;

  // Podium final
  showFinalPodium = false;
  finalLeaderboard: Array<{ teamId: string; name: string; totalPoints: number; rank: number }> = [];
  eventStats: { totalRounds: number; totalSongs: number; totalTeams: number; totalPlayers: number; duration: number } | null = null;

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
      this.autoSubmitted = false; // Réinitialiser pour la nouvelle manche
      this.submittedAnswer = ''; // Réinitialiser la réponse soumise
      this.showSubmittedConfirmation = false; // Masquer la confirmation
      this.showPreviousAnswer = false; // Masquer la réponse précédente
      this.startCountdown();
    });
    this.socket.on<any>('round_ended', (d) => {
      this.stopCountdown();
      // Afficher la réponse correcte de la chanson qui vient de se terminer
      if (d.title || d.artist) {
        this.previousSongAnswer = {
          title: d.title || null,
          artist: d.artist || null
        };
        this.showPreviousAnswer = true;
      }
    });

    // Écouter l'événement de fin de l'événement pour afficher le podium final
    this.socket.on<any>('event_completed', (d) => {
      console.log('[Round] Event completed, showing final podium:', d);
      this.finalLeaderboard = d.finalLeaderboard || [];
      this.eventStats = {
        totalRounds: d.totalRounds || 0,
        totalSongs: d.totalSongs || 0,
        totalTeams: d.totalTeams || 0,
        totalPlayers: d.totalPlayers || 0,
        duration: d.duration || 0
      };
      this.showFinalPodium = true;
      this.showPreviousAnswer = false; // Masquer la réponse précédente
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
    if (this.remaining === 0) {
      this.stopCountdown();
      // Soumission automatique si le joueur a écrit quelque chose mais n'a pas encore envoyé
      if (this.answer.trim() && !this.autoSubmitted && !this.sending) {
        this.autoSubmitted = true;
        this.send();
      }
    }
  }

  send() {
    if (!this.session || !this.songId || !this.answer.trim()) return;
    this.sending = true;
    const answerToSubmit = this.answer.trim();
    this.api.submitAnswer(this.songId, answerToSubmit, this.session.teamToken).subscribe({
      next: (_) => {
        this.sending = false;
        this.submittedAnswer = answerToSubmit; // Stocker la réponse soumise
        this.showSubmittedConfirmation = true; // Afficher la confirmation
        this.answer = ''; // Vider le champ après envoi réussi
      },
      error: (_) => (this.sending = false),
    });
  }

  goLeaderboard() {
    this.router.navigate(['../leaderboard'], { relativeTo: this.route });
  }
  back() {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }

  getMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  }

  getRankClass(rank: number): string {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'rank-other';
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}min ${secs}s`;
  }

  ngOnDestroy() {
    this.stopCountdown();
    this.socket.disconnect();
  }
}
