import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reset-password-sent',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="success-section">
          <div class="success-icon">📧</div>
          <h1 class="success-title">Email envoyé !</h1>
          <p class="success-message" *ngIf="email">
            Nous avons envoyé un lien de réinitialisation à <strong>{{ email }}</strong>
          </p>
          <p class="success-message" *ngIf="!email">
            Nous avons envoyé un lien de réinitialisation à votre adresse email.
          </p>

          <div class="info-box">
            <h3>📋 Prochaines étapes :</h3>
            <ol>
              <li>Consultez votre boîte de réception</li>
              <li>Cliquez sur le lien dans l'email</li>
              <li>Créez votre nouveau mot de passe</li>
            </ol>

            <div class="warning">
              <strong>⏱️ Attention :</strong> Le lien expire dans 1 heure
            </div>
          </div>

          <div class="help-section">
            <p class="help-text">Vous n'avez pas reçu l'email ?</p>
            <ul class="help-list">
              <li>Vérifiez votre dossier spam/courrier indésirable</li>
              <li>Vérifiez que l'adresse email est correcte</li>
              <li>Attendez quelques minutes (délai de livraison possible)</li>
            </ul>
          </div>

          <div class="action-buttons">
            <a routerLink="/auth/forgot-password" class="btn btn-outline btn-full">
              Renvoyer un email
            </a>
            <a routerLink="/auth/login" class="btn btn-primary btn-full">
              Retour à la connexion
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background:
        radial-gradient(1200px 600px at 10% -10%, #0ea5e933, transparent),
        radial-gradient(800px 500px at 90% 10%, #a78bfa33, transparent),
        #0b1020;
    }

    .auth-card {
      width: 100%;
      max-width: 480px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
    }

    .success-section {
      text-align: center;
    }

    .success-icon {
      font-size: 5rem;
      margin-bottom: 24px;
      animation: bounce 1s ease-in-out;
      filter: drop-shadow(0 4px 16px rgba(52, 211, 153, 0.4));
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .success-title {
      font-size: 2rem;
      font-weight: 700;
      color: #34d399;
      margin: 0 0 16px;
    }

    .success-message {
      color: #d1d5db;
      font-size: 1rem;
      line-height: 1.6;
      margin: 0 0 32px;
    }

    .success-message strong {
      color: #60a5fa;
      font-weight: 600;
    }

    .info-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      text-align: left;
    }

    .info-box h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #e5e7eb;
      margin: 0 0 16px;
    }

    .info-box ol {
      margin: 0;
      padding-left: 20px;
      color: #94a3b8;
    }

    .info-box ol li {
      margin: 8px 0;
      line-height: 1.5;
    }

    .warning {
      background: rgba(251, 191, 36, 0.1);
      border: 1px solid rgba(251, 191, 36, 0.3);
      border-radius: 8px;
      padding: 12px;
      margin-top: 16px;
      color: #fbbf24;
      font-size: 0.9rem;
    }

    .help-section {
      margin: 32px 0;
      text-align: left;
    }

    .help-text {
      color: #9ca3af;
      font-weight: 600;
      margin: 0 0 12px;
    }

    .help-list {
      list-style: none;
      padding: 0;
      margin: 0;
      color: #94a3b8;
      font-size: 0.9rem;
    }

    .help-list li {
      padding-left: 24px;
      margin: 8px 0;
      position: relative;
    }

    .help-list li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: #60a5fa;
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
      gap: 8px;
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

    .btn-full {
      width: 100%;
    }
  `]
})
export class ResetPasswordSentComponent implements OnInit {
  email = '';

  constructor(
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Récupérer l'email depuis les query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });
  }
}
