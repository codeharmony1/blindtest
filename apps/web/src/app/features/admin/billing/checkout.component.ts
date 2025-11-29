import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'bt-billing-checkout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="checkout-container">
      <div class="checkout-card">
        <div class="checkout-header">
          <h1>💳 Finaliser votre abonnement</h1>
          <p class="subtitle" *ngIf="planName">{{ planName }}</p>
        </div>

        <div class="checkout-body" *ngIf="!loading && !error">
          <div class="plan-summary">
            <h3>Récapitulatif</h3>
            <div class="summary-item">
              <span>Plan sélectionné:</span>
              <strong>{{ planName }}</strong>
            </div>
            <div class="summary-item">
              <span>Prix:</span>
              <strong>{{ planPrice }}</strong>
            </div>
            <div class="summary-item" *ngIf="plan === 'MONTHLY'">
              <span>Facturation:</span>
              <strong>Mensuelle</strong>
            </div>
          </div>

          <div class="checkout-actions">
            <button class="btn btn-primary btn-large" (click)="proceedToCheckout()" [disabled]="processing">
              <span *ngIf="!processing">🔒 Procéder au paiement sécurisé</span>
              <span *ngIf="processing">Redirection vers Stripe...</span>
            </button>
            <button class="btn btn-secondary" (click)="goBack()" [disabled]="processing">
              ← Retour
            </button>
          </div>

          <div class="security-note">
            <span class="lock-icon">🔒</span>
            <p>Paiement 100% sécurisé via Stripe. Nous ne stockons jamais vos informations bancaires.</p>
          </div>
        </div>

        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Chargement...</p>
        </div>

        <div class="error-state" *ngIf="error">
          <p>❌ {{ error }}</p>
          <button class="btn btn-primary" (click)="goBack()">Retour</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .checkout-card {
      width: 100%;
      max-width: 600px;
      background: white;
      border-radius: 20px;
      padding: 3rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .checkout-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .checkout-header h1 {
      margin: 0 0 0.5rem;
      color: #2d3748;
      font-size: 2rem;
    }

    .subtitle {
      margin: 0;
      color: #718096;
      font-size: 1.125rem;
    }

    .plan-summary {
      background: #f7fafc;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .plan-summary h3 {
      margin: 0 0 1rem;
      color: #2d3748;
      font-size: 1.25rem;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .summary-item:last-child {
      border-bottom: none;
    }

    .summary-item span {
      color: #4a5568;
    }

    .summary-item strong {
      color: #2d3748;
      font-size: 1.125rem;
    }

    .checkout-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #cbd5e0;
    }

    .btn-large {
      padding: 1.25rem 2rem;
      font-size: 1.125rem;
    }

    .security-note {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #e6fffa;
      border-radius: 8px;
      border: 1px solid #81e6d9;
    }

    .lock-icon {
      font-size: 1.5rem;
    }

    .security-note p {
      margin: 0;
      color: #234e52;
      font-size: 0.9rem;
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 2rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state {
      color: #c53030;
    }

    @media (max-width: 640px) {
      .checkout-card {
        padding: 2rem 1.5rem;
      }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  plan: string = '';
  planName: string = '';
  planPrice: string = '';
  loading = false;
  processing = false;
  error = '';
  isNewAccount = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.plan = params['plan'] || '';
      this.isNewAccount = params['newAccount'] === 'true';

      // Définir les infos du plan
      switch (this.plan) {
        case 'PER_EVENT':
          this.planName = 'Paiement par Événement';
          this.planPrice = '19€';
          break;
        case 'MONTHLY':
          this.planName = 'Plan Mensuel';
          this.planPrice = '49€/mois';
          break;
        default:
          this.error = 'Plan invalide';
      }
    });
  }

  proceedToCheckout(): void {
    this.processing = true;

    const successUrl = `${window.location.origin}/admin/billing/success`;
    const cancelUrl = `${window.location.origin}/admin/billing/checkout?plan=${this.plan}`;

    this.http.post<{ checkoutUrl: string }>('/api/payments/checkout/subscription', {
      plan: this.plan,
      successUrl,
      cancelUrl
    }).subscribe({
      next: (response) => {
        // Rediriger vers Stripe Checkout
        window.location.href = response.checkoutUrl;
      },
      error: (err) => {
        this.processing = false;
        console.error('Checkout error:', err);
        this.error = err.error?.message || 'Erreur lors de la création de la session de paiement';
      }
    });
  }

  goBack(): void {
    if (this.isNewAccount) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/admin/billing']);
    }
  }
}
