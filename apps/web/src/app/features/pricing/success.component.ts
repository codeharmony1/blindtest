import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="success-container">
      <div class="success-card" *ngIf="!loading">
        <div class="success-icon">✅</div>
        <h1 class="success-title">Paiement réussi !</h1>
        <p class="success-message">
          Votre paiement a été effectué avec succès.<br/>
          Vous pouvez maintenant profiter de toutes les fonctionnalités.
        </p>

        <!-- Détails du paiement -->
        <div class="payment-details" *ngIf="checkoutSession">
          <h3>📋 Détails de votre commande</h3>
          <div class="detail-row">
            <span class="label">Plan :</span>
            <span class="value">{{ getPlanName() }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Montant :</span>
            <span class="value">{{ checkoutSession.amountTotal }}€</span>
          </div>
          <div class="detail-row">
            <span class="label">Email :</span>
            <span class="value">{{ checkoutSession.customerEmail }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Statut :</span>
            <span class="value status-paid">✓ Payé</span>
          </div>
        </div>

        <div class="info-box">
          <h3>🎉 Prochaines étapes :</h3>
          <ol>
            <li>Accédez à votre tableau de bord</li>
            <li>Créez votre premier événement</li>
            <li>Profitez de toutes les fonctionnalités</li>
          </ol>
        </div>

        <div class="action-buttons">
          <button (click)="goToDashboard()" class="btn btn-primary">
            Accéder au tableau de bord
          </button>
          <a routerLink="/admin/billing" class="btn btn-secondary">
            Voir mon abonnement
          </a>
          <a routerLink="/pricing" class="btn btn-outline">
            Retour aux tarifs
          </a>
        </div>
      </div>

      <!-- Loading state -->
      <div class="success-card" *ngIf="loading">
        <div class="loading-spinner">⏳</div>
        <h2>Vérification du paiement...</h2>
        <p>Veuillez patienter quelques instants.</p>
      </div>

      <!-- Error state -->
      <div class="success-card error" *ngIf="error">
        <div class="error-icon">⚠️</div>
        <h2>Erreur de vérification</h2>
        <p>{{ error }}</p>
        <div class="action-buttons">
          <a routerLink="/admin/billing" class="btn btn-primary">
            Voir mon abonnement
          </a>
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
      padding: 20px;
      background: radial-gradient(1200px 600px at 10% -10%, #0ea5e933, transparent),
                  radial-gradient(800px 500px at 90% 10%, #a78bfa33, transparent),
                  #0b1020;
    }

    .success-card {
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
      text-align: center;
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

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #e5e7eb;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .payment-details {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }

    .payment-details h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #e5e7eb;
      margin: 0 0 16px;
      text-align: center;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-row .label {
      color: #94a3b8;
      font-size: 0.9rem;
    }

    .detail-row .value {
      color: #e5e7eb;
      font-weight: 600;
    }

    .status-paid {
      color: #34d399 !important;
    }

    .loading-spinner {
      font-size: 4rem;
      margin-bottom: 24px;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .error-icon {
      font-size: 5rem;
      margin-bottom: 24px;
      filter: drop-shadow(0 4px 16px rgba(248, 113, 113, 0.4));
    }

    .success-card.error {
      border-color: rgba(248, 113, 113, 0.3);
    }

    .success-card.error h2 {
      color: #f87171;
    }
  `]
})
export class PaymentSuccessComponent implements OnInit {
  sessionId = '';
  checkoutSession: any = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.sessionId = params['session_id'] || '';
      if (this.sessionId) {
        this.loadCheckoutSession();
      } else {
        this.loading = false;
        this.error = 'Aucune session de paiement trouvée. Veuillez contacter le support si vous avez effectué un paiement.';
      }
    });
  }

  loadCheckoutSession(): void {
    this.apiService.getCheckoutSession(this.sessionId).subscribe({
      next: (session) => {
        this.checkoutSession = session;
        this.loading = false;
        console.log('Checkout session loaded:', session);
      },
      error: (err) => {
        console.error('Error loading checkout session:', err);
        this.loading = false;
        this.error = 'Impossible de vérifier le paiement. Vos fonctionnalités ont été activées, mais les détails ne peuvent pas être affichés pour le moment.';
      }
    });
  }

  getPlanName(): string {
    if (!this.checkoutSession?.metadata?.plan) {
      return 'Inconnu';
    }

    const planNames: any = {
      'PER_EVENT': 'Paiement par Événement (19€)',
      'MONTHLY': 'Plan Mensuel (49€/mois)',
      '2days': 'Session 2 jours',
      '1week': 'Session 1 semaine',
      '1month': 'Session 1 mois'
    };

    return planNames[this.checkoutSession.metadata.plan] || this.checkoutSession.metadata.plan;
  }

  goToDashboard(): void {
    this.router.navigate(['/admin']);
  }
}
