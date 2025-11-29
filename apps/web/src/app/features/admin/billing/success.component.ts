import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'bt-billing-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="success-container">
      <div class="success-card">
        <div class="success-icon">✅</div>
        <h1>Paiement réussi !</h1>
        <p class="success-message">
          Votre abonnement a été activé avec succès.<br />
          Vous pouvez maintenant profiter de toutes les fonctionnalités.
        </p>

        <div class="next-steps">
          <h3>Prochaines étapes :</h3>
          <ul>
            <li>✨ Créez votre premier événement</li>
            <li>🎵 Ajoutez vos chansons favorites</li>
            <li>👥 Invitez vos participants</li>
          </ul>
        </div>

        <div class="actions">
          <button class="btn btn-primary btn-large" routerLink="/admin/events">
            🎉 Créer mon premier événement
          </button>
          <button class="btn btn-secondary" routerLink="/admin">
            Aller au dashboard
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .success-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .success-card {
      width: 100%;
      max-width: 600px;
      background: white;
      border-radius: 20px;
      padding: 3rem;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .success-icon {
      font-size: 5rem;
      margin-bottom: 1rem;
      animation: scaleIn 0.5s ease-out;
    }

    @keyframes scaleIn {
      from {
        transform: scale(0);
      }
      to {
        transform: scale(1);
      }
    }

    h1 {
      margin: 0 0 1rem;
      color: #2d3748;
      font-size: 2.5rem;
    }

    .success-message {
      color: #4a5568;
      font-size: 1.125rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .next-steps {
      background: #f7fafc;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      text-align: left;
    }

    .next-steps h3 {
      margin: 0 0 1rem;
      color: #2d3748;
    }

    .next-steps ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .next-steps li {
      padding: 0.5rem 0;
      color: #4a5568;
      font-size: 1rem;
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }

    .btn-secondary:hover {
      background: #cbd5e0;
    }

    .btn-large {
      padding: 1.25rem 2rem;
      font-size: 1.125rem;
    }

    @media (max-width: 640px) {
      .success-card {
        padding: 2rem 1.5rem;
      }

      h1 {
        font-size: 2rem;
      }
    }
  `]
})
export class BillingSuccessComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    // Animation de confettis ou autre effet visuel (optionnel)
  }
}
