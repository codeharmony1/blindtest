import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'bt-join',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './join-autumn.component.html',
  styleUrls: ['../../shared/styles/autumn-wedding.scss'],
  styles: [
    `
      .join-form {
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

      /* Mobile optimizations */
      @media (max-width: 768px) {
        .join-form {
          gap: 1.2rem;
        }

        .autumn-label {
          font-size: 1rem;
          text-align: center;
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private theme: ThemeService,
  ) {
    this.eventCode = this.route.snapshot.params['eventCode'];
    this.api.getEventPublic(this.eventCode).subscribe({
      next: (d) => (this.eventName = d.name),
      error: (_) => (this.eventName = '(inconnu)'),
    });

    // Charger et appliquer le thème de l'événement
    this.theme.loadEventTheme(this.eventCode).subscribe();
  }

  goTeam() {
    this.router.navigate(['team'], {
      relativeTo: this.route,
      queryParams: { nickname: this.nickname },
    });
  }
}
