import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../core/services/socket.service';
import { ApiService } from '../../core/services/api.service';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { PREDEFINED_THEMES } from '../../shared/themes/themes';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'bt-projector',
  standalone: true,
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './projector-autumn.component.html',
  styles: [
    `
      .projector-display {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 25%, #fdba74 50%, #fb923c 75%, #f97316 100%);
        font-family: var(--font-primary);
        color: #78350f;
        position: relative;
        overflow: hidden;
      }

      .projector-display::before {
        content: '';
        position: absolute;
        inset: 0;
        opacity: 0.1;
        background-image:
          radial-gradient(circle at 25% 25%, #78350f 2px, transparent 2px),
          radial-gradient(circle at 75% 75%, #78350f 1px, transparent 1px);
        background-size: 50px 50px;
        pointer-events: none;
      }

      /* Falling leaves animation */
      .falling-leaves {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 1;
      }

      .leaf-wrapper {
        position: absolute;
        top: -5%;
        animation: leafFall 8s linear infinite;
      }

      .leaf-icon {
        color: rgba(120, 53, 15, 0.4);
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      }

      @keyframes leafFall {
        0% {
          transform: translateY(0) translateX(0) rotate(0deg);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateY(110vh) translateX(50px) rotate(360deg);
          opacity: 0;
        }
      }

      /* Hearts decoration */
      .hearts-decoration {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 1;
      }

      .heart-wrapper {
        position: absolute;
        animation: heartPulse 3s ease-in-out infinite;
      }

      .heart-icon {
        color: rgba(220, 38, 38, 0.3);
      }

      @keyframes heartPulse {
        0%, 100% {
          transform: scale(1);
          opacity: 0.2;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.4;
        }
      }

      .projector-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
        width: 100%;
        position: relative;
        z-index: 10;
      }

      .projector-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .header-icons {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 0.75rem;
      }

      .header-leaf {
        color: #78350f;
      }

      .header-heart {
        color: #dc2626;
      }

      .event-title {
        font-size: 4rem;
        font-weight: 600;
        margin: 0;
        color: #292524;
        font-family: serif;
        text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.5);
      }

      .event-tagline-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        margin-top: 0.75rem;
      }

      .tagline-divider {
        height: 4px;
        width: 6rem;
        border-radius: 9999px;
        background: rgba(120, 53, 15, 0.4);
      }

      .event-tagline {
        font-size: 1.6rem;
        color: #78350f;
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

      .waiting-message,
      .waiting-next-song {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
      }

      .waiting-next-song {
        padding: 3rem 2rem;
      }

      .waiting-icon {
        font-size: 8rem;
        animation: spin 3s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      .waiting-title {
        font-size: 3rem;
        font-weight: 700;
        color: #78350f;
        margin: 0;
        text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.5);
      }

      .waiting-text {
        font-size: 2rem;
        color: #78350f;
        font-style: italic;
        margin: 0;
      }

      .timer-display-large {
        margin-bottom: 3rem;
      }

      .timer-circle {
        width: 240px;
        height: 240px;
        border: 6px solid var(--autumn-gold);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 248, 244, 0.95));
        backdrop-filter: blur(10px);
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
        font-size: 4rem;
        font-weight: 700;
        color: var(--autumn-burgundy);
        line-height: 1;
      }

      .time-unit {
        font-size: 1.1rem;
        color: var(--autumn-brown);
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin-top: 0.5rem;
        opacity: 0.8;
      }

      .game-instruction {
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 1.5rem;
        color: var(--autumn-brown);
        margin-bottom: 2rem;
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(8px);
        padding: 1.5rem 2rem;
        border-radius: 1.5rem;
        border: 2px solid rgba(232, 220, 200, 0.5);
      }

      .instruction-icon {
        font-size: 2rem;
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
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .qr-code-section-top {
        display: flex;
        justify-content: center;
        margin-bottom: 2rem;
        padding-top: 1rem;
      }

      .qr-code-container {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(12px);
        border-radius: 1.5rem;
        padding: 2rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        border: 3px solid rgba(251, 191, 36, 0.3);
        text-align: center;
        max-width: 400px;
      }

      .qr-code-title {
        font-size: 2rem;
        font-weight: 700;
        color: #78350f;
        margin: 0 0 1.5rem 0;
        text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
      }

      .qr-code-wrapper {
        display: flex;
        justify-content: center;
        margin-bottom: 1.25rem;
        background: white;
        padding: 1rem;
        border-radius: 1rem;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }

      .qr-code-wrapper canvas {
        border-radius: 0.5rem;
      }

      .qr-code-instruction {
        font-size: 1.2rem;
        color: #78350f;
        margin: 0 0 0.75rem 0;
        font-style: italic;
      }

      .qr-code-code {
        font-size: 1.5rem;
        color: #78350f;
        margin: 0;
      }

      .qr-code-code strong {
        color: #dc2626;
        font-size: 1.8rem;
        font-weight: 700;
      }

      .round-scores-section {
        margin-bottom: 3rem;
        text-align: center;
      }

      .round-scores-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: #78350f;
        margin: 0 0 2rem 0;
        text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
      }

      .round-icon {
        font-size: 2.5rem;
      }

      .round-scores-table {
        max-width: 900px;
        margin: 0 auto;
      }

      .round-points-cell {
        text-align: center;
      }

      .round-points-display {
        font-size: 1.8rem;
        font-weight: 700;
        color: #16a34a;
        padding: 0.5rem 1.5rem;
        border-radius: 9999px;
        background: rgba(34, 197, 94, 0.15);
        border: 2px solid rgba(34, 197, 94, 0.3);
        display: inline-block;
      }

      .official-answer {
        text-align: center;
        margin-bottom: 3rem;
        padding: 2.5rem 3rem;
        background: rgba(255, 255, 255, 0.95);
        border: 3px solid #d4a574;
        border-radius: 1.5rem;
        color: #4a3828;
        box-shadow: 0 8px 24px rgba(120, 53, 15, 0.2);
        backdrop-filter: blur(10px);
        animation: slideInAnswer 0.5s ease-out;
      }

      @keyframes slideInAnswer {
        from {
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .official-title {
        font-size: 1.8rem;
        font-weight: 600;
        margin: 0 0 1.5rem 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        color: #78350f;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .official-icon {
        font-size: 2.5rem;
        filter: drop-shadow(0 2px 4px rgba(212, 165, 116, 0.3));
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
        font-size: 2rem;
        font-weight: 600;
        color: var(--autumn-burgundy);
        margin: 0 0 2rem 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .leaderboard-icon {
        font-size: 2.2rem;
      }

      .final-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--autumn-burgundy);
        animation: autumnPulse 2s infinite;
      }

      .event-stats {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-bottom: 2.5rem;
        flex-wrap: wrap;
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(8px);
        padding: 1rem 1.5rem;
        border-radius: 1rem;
        border: 2px solid rgba(232, 220, 200, 0.5);
        min-width: 120px;
      }

      .stat-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--autumn-burgundy);
        margin-bottom: 0.25rem;
      }

      .stat-label {
        font-size: 0.9rem;
        color: var(--autumn-brown);
        text-align: center;
        opacity: 0.8;
      }

      @keyframes autumnPulse {
        0%,
        100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.9;
          transform: scale(1.05);
        }
      }

      .podium-display {
        margin-bottom: 3rem;
      }

      .podium {
        display: flex;
        align-items: end;
        justify-content: center;
        gap: 1.5rem;
        margin-bottom: 3rem;
      }

      .podium-position {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        max-width: 280px;
      }

      .podium-position.gold {
        order: 2;
      }

      .podium-position.silver {
        order: 1;
      }

      .podium-position.bronze {
        order: 3;
      }

      .position-circle {
        position: relative;
        width: 128px;
        height: 128px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.25rem;
      }

      .podium-position.silver .position-circle {
        background: linear-gradient(135deg, #d4d4d4 0%, #e5e5e5 50%, #d4d4d4 100%);
        border: 4px solid #a3a3a3;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 -4px 8px rgba(0, 0, 0, 0.1);
      }

      .podium-position.silver .position-circle::before {
        content: '';
        position: absolute;
        inset: -16px;
        border-radius: 50%;
        background: rgba(251, 191, 36, 0.3);
        filter: blur(24px);
        z-index: -1;
      }

      .podium-position.bronze .position-circle {
        background: linear-gradient(135deg, #cd7f32 0%, #b87333 50%, #cd7f32 100%);
        border: 4px solid #a0522d;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 -4px 8px rgba(0, 0, 0, 0.1);
      }

      .podium-position.bronze .position-circle::before {
        content: '';
        position: absolute;
        inset: -16px;
        border-radius: 50%;
        background: rgba(251, 146, 60, 0.3);
        filter: blur(24px);
        z-index: -1;
      }

      .podium-position.silver .music-icon {
        color: #525252;
      }

      .podium-position.bronze .music-icon {
        color: #fff7ed;
      }

      .position-circle.gold-circle {
        width: 160px;
        height: 160px;
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%);
        border: 5px solid #d97706;
        box-shadow: 0 12px 48px rgba(251, 191, 36, 0.5), inset 0 -6px 12px rgba(217, 119, 6, 0.3);
      }

      .position-circle.gold-circle::before {
        content: '';
        position: absolute;
        inset: -20px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(251, 191, 36, 0.6) 0%, transparent 70%);
        filter: blur(32px);
        z-index: -1;
        animation: goldGlow 2.5s ease-in-out infinite;
      }

      @keyframes goldGlow {
        0%, 100% {
          transform: scale(1);
          opacity: 0.5;
        }
        50% {
          transform: scale(1.15);
          opacity: 0.7;
        }
      }

      .gold-circle .music-icon {
        color: #78350f;
      }

      .crown-icon {
        margin-bottom: 0.75rem;
        animation: crownFloat 3s ease-in-out infinite;
      }

      .crown-icon svg {
        color: #dc2626;
        filter: drop-shadow(0 4px 12px rgba(220, 38, 38, 0.5));
      }

      @keyframes crownFloat {
        0%, 100% {
          transform: translateY(0) rotate(0deg);
        }
        25% {
          transform: translateY(-8px) rotate(5deg);
        }
        75% {
          transform: translateY(-8px) rotate(-5deg);
        }
      }

      .position-badge {
        position: absolute;
        bottom: -12px;
        left: 50%;
        transform: translateX(-50%);
        padding: 0.25rem 1rem;
        border-radius: 9999px;
        font-size: 1.3rem;
        color: white;
        font-weight: 600;
      }

      .podium-position.silver .position-badge {
        background: #a3a3a3;
      }

      .podium-position.bronze .position-badge {
        background: #a0522d;
      }

      .position-badge.gold-badge {
        background: #d97706;
        font-size: 1.5rem;
        padding: 0.5rem 1.25rem;
        bottom: -16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .position-team {
        font-size: 2rem;
        font-weight: 600;
        margin: 0.5rem 0;
        color: #292524;
        text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
      }

      .podium-position.gold .position-team {
        font-size: 2.5rem;
        margin: 0.75rem 0;
      }

      .position-points-wrapper {
        padding: 0.75rem 1.75rem;
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.6);
        border: 3px solid #d4d4d4;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }

      .position-points-wrapper.gold-points-wrapper {
        background: rgba(255, 255, 255, 0.7);
        border: 3px solid #fbbf24;
        padding: 1rem 2.25rem;
        box-shadow: 0 6px 24px rgba(251, 191, 36, 0.3);
      }

      .podium-position.silver .position-points {
        color: #525252;
      }

      .podium-position.bronze .position-points {
        color: #9a3412;
      }

      .position-points {
        font-size: 2rem;
        font-weight: 600;
      }

      .podium-position.gold .position-points {
        font-size: 2.5rem;
        color: #78350f;
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

      .full-leaderboard .rank-1 {
        background: rgba(255, 215, 0, 0.15) !important;
      }
      .full-leaderboard .rank-2 {
        background: rgba(192, 192, 192, 0.15) !important;
      }
      .full-leaderboard .rank-3 {
        background: rgba(205, 127, 50, 0.15) !important;
      }

      .full-leaderboard table tbody tr {
        background: rgba(255, 255, 255, 0.7);
        border: 3px solid rgba(194, 65, 12, 0.3);
        backdrop-filter: blur(8px);
      }

      .full-leaderboard table tbody tr td:first-child {
        border-radius: 1rem 0 0 1rem;
      }

      .full-leaderboard table tbody tr td:last-child {
        border-radius: 0 1rem 1rem 0;
      }

      .rank-cell .rank-display {
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 50%;
        background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
        border: 2px solid #ea580c;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        color: white;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .points-cell .points-display {
        padding: 0.5rem 1.5rem;
        border-radius: 9999px;
        background: rgba(251, 146, 60, 0.3);
        border: 2px solid rgba(234, 88, 12, 0.4);
        color: #78350f;
        display: inline-block;
      }

      .bottom-decoration {
        position: absolute;
        bottom: 1.5rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        opacity: 0.4;
        z-index: 1;
      }

      .bottom-decoration svg:nth-child(odd) {
        color: #78350f;
      }

      .bottom-decoration svg:nth-child(even) {
        color: #dc2626;
      }

      .no-scores {
        text-align: center;
        padding: 3rem;
        color: #78350f;
      }

      .no-scores-icon {
        font-size: 6rem;
        margin-bottom: 1.5rem;
        opacity: 0.5;
      }

      .no-scores-text {
        font-size: 2rem;
        font-style: italic;
        color: #78350f;
        opacity: 0.8;
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
  eventName = 'Blind Test Musical';
  inRound = false;
  gameStarted = false; // Indique si au moins un round a été lancé
  officialTitle = '';
  officialArtist = '';
  rows: Array<{ teamId: string; name: string; totalPoints: number; rank: number }> = [];

  endsAt = 0;
  remaining = 0;
  timer?: any;

  // État de l'événement
  isEventCompleted = false;
  eventStats = {
    totalRounds: 0,
    totalSongs: 0,
    totalTeams: 0,
    totalPlayers: 0,
    duration: 0,
  };

  // Propriétés dynamiques du thème
  themeIcon = '🎵';
  themeTagline = 'Prêt à jouer ?';

  // Scores détaillés par chanson
  detailedScores: {
    teams: Array<{ id: string; name: string; totalPoints: number }>;
    songs: Array<{
      id: string;
      roundIdx: number;
      songIdx: number;
      title: string;
      artist: string;
      teamScores: { [teamId: string]: number };
    }>;
  } | null = null;

  // Mode d'affichage : 'summary' (classement simple) ou 'detailed' (scores par chanson)
  displayMode: 'summary' | 'detailed' = 'summary';

  // Détermine si l'affichage détaillé est possible (en fonction de l'espace)
  canShowDetailedScores = false;

  // Falling leaves animation data
  leaves: Array<{ left: number; delay: number }> = [];

  // Hearts decoration data
  hearts: Array<{ left: number; top: number; delay: number }> = [];

  // QR code URL for players to join
  qrCodeUrl = '';

  // Informations sur le round et les chansons
  currentRoundNumber = 0;
  currentRoundName = ''; // Nom du round en cours
  currentSongId = '';
  showWaitingForNextSong = false; // Afficher "En attente de la prochaine chanson"
  showRoundScores = false; // Afficher les scores du round
  currentRoundScores: Array<{ teamId: string; name: string; roundPoints: number; totalPoints: number; rank: number }> = [];
  isLastRound = false; // Indique si c'est le dernier round (pour afficher le podium)

  // Mode table
  tableMode = false;
  currentTableScores: Array<{
    tableId: string;
    tableName: string;
    roundPoints: number;
    totalPoints: number;
    rank: number;
    teamsCount: number;
  }> = [];

  constructor(
    private socket: SocketService,
    private api: ApiService,
    private route: ActivatedRoute,
    private theme: ThemeService,
  ) {
    this.eventCode = this.route.snapshot.params['eventCode'];

    // Initialize falling leaves animation (25 leaves)
    for (let i = 0; i < 25; i++) {
      this.leaves.push({
        left: Math.random() * 100,
        delay: Math.random() * 10,
      });
    }

    // Initialize hearts decoration (8 hearts)
    for (let i = 0; i < 8; i++) {
      this.hearts.push({
        left: 10 + i * 12,
        top: 5 + (i % 3) * 30,
        delay: Math.random() * 2,
      });
    }

    // Set QR code URL for players to join
    const protocol = window.location.protocol;
    const host = window.location.host;
    this.qrCodeUrl = `${protocol}//${host}/join/${this.eventCode}`;

    // Charger les infos de l'événement
    this.api
      .getEventPublic(this.eventCode)
      .subscribe((event: { code: string; name: string; settings: any }) => {
        if (event?.name) this.eventName = event.name;
        // Vérifier si le mode table est activé
        this.tableMode = event?.settings?.tableMode || false;
      });

    // Appliquer le thème mariage automne (temporaire, en attendant l'API /events/:code/theme)
    const autumnTheme = PREDEFINED_THEMES.find((t) => t.id === 'wedding-autumn');
    if (autumnTheme) {
      this.theme.applyTheme(autumnTheme);
      this.updateThemeElements(autumnTheme);
    }
    this.socket.connect();
    this.socket.joinEvent(this.eventCode, 'DISPLAY');

    this.socket.on<any>('round_started', (d) => {
      // Une chanson commence : afficher le chrono
      this.inRound = true;
      this.gameStarted = true; // Marquer que le jeu a commencé
      this.showWaitingForNextSong = false;
      this.showRoundScores = false;
      this.officialTitle = '';
      this.officialArtist = '';
      this.currentSongId = d.songId ?? '';
      this.currentRoundNumber = d.roundNumber ?? 0;
      this.endsAt = new Date(d.endsAt).getTime();
      this.startCountdown();

      // Charger le nom du round si on a le roundId
      if (d.roundId) {
        this.loadRoundName(d.roundId);
      }
    });

    this.socket.on<any>('round_ended', (d) => {
      // Une chanson se termine
      this.inRound = false;
      this.stopCountdown();
      this.currentSongId = d.songId ?? '';

      // Par défaut, afficher "En attente de la prochaine chanson"
      // Le DJ enverra soit un nouveau round_started, soit round_scores_ready, soit event_completed
      this.showWaitingForNextSong = true;
      this.showRoundScores = false;

      // Charger le nom du round si on a le roundId
      if (d.roundId) {
        this.loadRoundName(d.roundId);
      }
    });

    // Nouvel événement : quand le DJ montre les scores du round
    this.socket.on<any>('round_scores_ready', (d) => {
      console.log('[PROJECTOR] === ROUND SCORES READY ===');
      console.log('[PROJECTOR] Données reçues:', d);
      this.inRound = false; // Sortir du mode "en cours" pour afficher la pause-phase
      this.stopCountdown(); // Arrêter le chrono si jamais il tourne encore
      this.showWaitingForNextSong = false;
      this.showRoundScores = true;
      this.currentRoundNumber = d.roundNumber ?? 0;
      this.isLastRound = d.isLastRound ?? false; // Récupérer le flag isLastRound
      if (d.roundScores) {
        this.currentRoundScores = d.roundScores;
      }
      console.log('[PROJECTOR] État après mise à jour:');
      console.log('[PROJECTOR] - showRoundScores:', this.showRoundScores);
      console.log('[PROJECTOR] - isLastRound:', this.isLastRound);
      console.log('[PROJECTOR] - currentRoundScores.length:', this.currentRoundScores.length);
      console.log('[PROJECTOR] - Affichage podium?', this.isLastRound && this.currentRoundScores.length >= 3);
    });
    // Nouvel événement : scores des tables pour un round
    this.socket.on<any>('table_scores_ready', (d) => {
      console.log('[PROJECTOR] === TABLE SCORES READY ===');
      console.log('[PROJECTOR] Données reçues:', d);
      this.inRound = false;
      this.stopCountdown();
      this.showWaitingForNextSong = false;
      this.showRoundScores = true;
      this.currentRoundNumber = d.roundNumber ?? 0;
      this.isLastRound = d.isLastRound ?? false;
      if (d.tableScores) {
        this.currentTableScores = d.tableScores;
      }
      console.log('[PROJECTOR] - showRoundScores:', this.showRoundScores);
      console.log('[PROJECTOR] - currentTableScores.length:', this.currentTableScores.length);
    });

    this.socket.on<any>('leaderboard_update', (d) => {
      if (d?.eventCode === this.eventCode) {
        this.rows = d.teams;
        // Recharger les scores détaillés lors d'une mise à jour du leaderboard
        if (this.displayMode === 'detailed' || this.canShowDetailedScores) {
          this.loadDetailedScores();
        }
      }
    });

    // Mise à jour du leaderboard des tables
    this.socket.on<any>('table_leaderboard_update', (d) => {
      if (d?.eventCode === this.eventCode && this.tableMode) {
        // Pour le mode table, on pourrait charger le leaderboard des tables
        console.log('[PROJECTOR] Table leaderboard update:', d.tables);
      }
    });
    this.socket.on<any>('official_answer', (d) => {
      this.officialTitle = d.title ?? '';
      this.officialArtist = d.artist ?? '';
    });
    this.socket.on<any>('event_completed', (d) => {
      if (d?.eventCode === this.eventCode) {
        this.isEventCompleted = true;
        this.eventStats = {
          totalRounds: d.totalRounds ?? 0,
          totalSongs: d.totalSongs ?? 0,
          totalTeams: d.totalTeams ?? 0,
          totalPlayers: d.totalPlayers ?? 0,
          duration: d.duration ?? 0,
        };
        this.rows = d.finalLeaderboard ?? this.rows;
      }
    });

    // Premier chargement du classement si pause
    this.api.getLeaderboard(this.eventCode).subscribe((list) => (this.rows = list));

    // Charger les scores détaillés
    this.loadDetailedScores();
  }

  loadDetailedScores() {
    this.api.getDetailedScores(this.eventCode).subscribe({
      next: (data) => {
        this.detailedScores = data;
        this.evaluateDetailedScoresDisplay();
      },
      error: (err) => {
        console.error('Failed to load detailed scores:', err);
        this.displayMode = 'summary';
      },
    });
  }

  evaluateDetailedScoresDisplay() {
    if (!this.detailedScores) {
      this.canShowDetailedScores = false;
      this.displayMode = 'summary';
      return;
    }

    const teamCount = this.detailedScores.teams.length;
    const songCount = this.detailedScores.songs.length;

    // Critères pour afficher les scores détaillés :
    // - Maximum 6 équipes ET maximum 15 chansons (pour tenir sur un écran Full HD)
    // - Ou maximum 4 équipes ET maximum 20 chansons
    // - Ou maximum 8 équipes ET maximum 10 chansons
    const canDisplay =
      (teamCount <= 6 && songCount <= 15) ||
      (teamCount <= 4 && songCount <= 20) ||
      (teamCount <= 8 && songCount <= 10);

    this.canShowDetailedScores = canDisplay;

    // Par défaut, afficher en mode détaillé si possible et s'il y a des données
    if (canDisplay && songCount > 0 && teamCount > 0) {
      this.displayMode = 'detailed';
    } else {
      this.displayMode = 'summary';
    }
  }

  toggleDisplayMode() {
    if (!this.canShowDetailedScores) return;
    this.displayMode = this.displayMode === 'summary' ? 'detailed' : 'summary';
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
    const previousRemaining = this.remaining;
    this.remaining = Math.max(0, this.endsAt - Date.now());

    // Si le timer vient juste d'atteindre 0, fermer automatiquement la chanson
    if (previousRemaining > 0 && this.remaining === 0) {
      console.log('[PROJECTOR] Timer expiré, fermeture automatique de la chanson:', this.currentSongId);
      this.stopCountdown();

      // Fermer la chanson automatiquement via l'API
      if (this.currentSongId) {
        this.api.closeSong(this.currentSongId).subscribe({
          next: (response) => {
            console.log('[PROJECTOR] Chanson fermée et notée automatiquement:', response);
          },
          error: (err) => {
            console.error('[PROJECTOR] Erreur lors de la fermeture automatique:', err);
          }
        });
      }
    }
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

  hasAnyScore(): boolean {
    return this.rows.some((row) => row.totalPoints > 0);
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else if (minutes > 0) {
      return `${minutes}min ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  updateThemeElements(theme: any) {
    if (!theme?.id) return;

    // Icônes et taglines selon le thème
    const themeMap: Record<string, { icon: string; tagline: string }> = {
      'wedding-autumn': { icon: '🍂', tagline: "Une soirée musicale d'automne" },
      'wedding-spring': { icon: '🌸', tagline: 'Une soirée musicale printanière' },
      'seasonal-winter': { icon: '❄️', tagline: "Une soirée musicale d'hiver" },
      'seasonal-summer': { icon: '☀️', tagline: "Une soirée musicale d'été" },
      'birthday-fun': { icon: '🎉', tagline: 'Joyeux anniversaire en musique !' },
      'birthday-elegant': { icon: '🎂', tagline: 'Célébrons avec la musique' },
      'corporate-modern': { icon: '🎵', tagline: 'Team building musical' },
      'corporate-luxury': { icon: '✨', tagline: 'Une expérience musicale exclusive' },
      'party-neon': { icon: '🎆', tagline: 'Soirée néon électrique !' },
      'party-retro': { icon: '🕺', tagline: 'Retour vers le passé musical' },
      'modern-gradient': { icon: '🎨', tagline: 'Expérience musicale moderne' },
      'cyberpunk-glow': { icon: '🔮', tagline: 'Dans le futur de la musique' },
      'nature-zen': { icon: '🍃', tagline: 'Harmonie musicale naturelle' },
      'sunset-dreams': { icon: '🌅', tagline: 'Au fil des mélodies' },
      'ocean-depths': { icon: '🌊', tagline: 'Plongez dans la musique' },
      'cosmic-nebula': { icon: '🌌', tagline: 'Voyage musical cosmique' },
    };

    const themeData = themeMap[theme.id] || { icon: '🎵', tagline: 'Prêt à jouer ?' };
    this.themeIcon = themeData.icon;
    this.themeTagline = themeData.tagline;
  }

  loadRoundName(roundId: string) {
    // Charger les rounds pour obtenir le nom
    this.api.getRounds(this.eventCode).subscribe({
      next: (rounds) => {
        const round = rounds.find(r => r.id === roundId);
        if (round) {
          this.currentRoundName = round.name || `Round ${roundId}`;
          console.log('[PROJECTOR] Nom du round chargé:', this.currentRoundName);
        }
      },
      error: (err) => {
        console.error('[PROJECTOR] Erreur chargement nom du round:', err);
        this.currentRoundName = 'Round en cours';
      }
    });
  }

  ngOnDestroy() {
    this.stopCountdown();
    this.socket.disconnect();
  }
}
