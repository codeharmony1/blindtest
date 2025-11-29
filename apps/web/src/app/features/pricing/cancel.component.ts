import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="cancel-container">
      <div class="cancel-card">
        <div class="cancel-icon">❌</div>
        <h1 class="cancel-title">Paiement annulé</h1>
        <p class="cancel-message">
          Votre paiement a été annulé.<br/>
          Aucun montant n'a été débité de votre compte.
        </p>

        <div class="info-box">
          <h3>💡 Que faire maintenant ?</h3>
          <ul>
            <li>Vous pouvez retourner à la page des tarifs pour choisir un autre plan</li>
            <li>Si vous avez rencontré un problème, n'hésitez pas à nous contacter</li>
            <li>Vous pouvez continuer à utiliser votre compte avec le plan gratuit DÉMO</li>
          </ul>
        </div>

        <div class="help-box">
          <h4>Besoin d'aide ?</h4>
          <p>
            Si vous avez des questions sur nos plans ou si vous avez rencontré un problème technique,
            contactez-nous à <strong>support@blindtest.com</strong>
          </p>
        </div>

        <div class="action-buttons">
          <a routerLink="/pricing" class="btn btn-primary">
            Voir les tarifs
          </a>
          <a routerLink="/admin" class="btn btn-outline">
            Tableau de bord
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cancel-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: radial-gradient(1200px 600px at 10% -10%, #0ea5e933, transparent),
                  radial-gradient(800px 500px at 90% 10%, #a78bfa33, transparent),
                  #0b1020;
    }

    .cancel-card {
      width: 100%;
      max-width: 500px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      text-align: center;
    }

    .cancel-icon {
      font-size: 5rem;
      margin-bottom: 24px;
      filter: drop-shadow(0 4px 16px rgba(248, 113, 113, 0.4));
    }

    .cancel-title {
      font-size: 2rem;
      font-weight: 700;
      color: #f87171;
      margin: 0 0 16px;
    }

    .cancel-message {
      color: #d1d5db;
      font-size: 1rem;
      line-height: 1.6;
      margin: 0 0 32px;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 32px;
    }

    .btn {
      padding: 14px 24px;
      border-radius: 12px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #22d3ee, #6366f1, #a855f7);
      color: white;
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 30px rgba(99, 102, 241, 0.45);
    }

    .btn-outline {
      background: transparent;
      color: #e5e7eb;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .info-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
      text-align: left;
    }

    .info-box h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #e5e7eb;
      margin: 0 0 12px;
    }

    .info-box ul {
      margin: 0;
      padding-left: 20px;
      color: #94a3b8;
      list-style-type: disc;
    }

    .info-box ul li {
      margin: 8px 0;
      line-height: 1.5;
    }

    .help-box {
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 12px;
      padding: 16px;
      margin: 16px 0 24px;
      text-align: center;
    }

    .help-box h4 {
      font-size: 0.95rem;
      font-weight: 600;
      color: #a5b4fc;
      margin: 0 0 8px;
    }

    .help-box p {
      margin: 0;
      color: #d1d5db;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .help-box strong {
      color: #818cf8;
    }
  `]
})
export class PaymentCancelComponent {}
