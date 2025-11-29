import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface SubscriptionStatus {
  subscription: {
    plan: string;
    status: string;
    expiresAt?: string;
    isActive: boolean;
  };
  limits: {
    maxEvents: number;
    maxPlayersPerEvent: number;
    maxUsers: number;
  };
  usage: any;
  hasActiveSession: boolean;
  canCreateEvent: boolean;
  hasStripeCustomer?: boolean; // Indique si un client Stripe existe
}

interface Payment {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
  paidAt: string;
}

@Component({
  selector: 'bt-billing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="billing-page">
      <header class="page-header">
        <h1>💳 Mon Abonnement & Facturation</h1>
        <p>Gérez votre abonnement et consultez votre historique de paiements</p>
      </header>

      <div class="billing-content" *ngIf="status && !loading">
        <!-- Current Plan Card -->
        <div class="plan-card">
          <div class="plan-header">
            <h2>📋 Plan Actuel</h2>
            <span class="plan-badge" [class]="'plan-' + status.subscription.plan.toLowerCase()">
              {{ getPlanName(status.subscription.plan) }}
            </span>
          </div>

          <div class="plan-info">
            <div class="info-item">
              <span class="label">Statut:</span>
              <span class="status" [class.active]="status.subscription.isActive">
                {{ status.subscription.isActive ? '✅ Actif' : '❌ Inactif' }}
              </span>
            </div>
            <div class="info-item" *ngIf="status.subscription.plan === 'DEMO'">
              <span class="label">Limites:</span>
              <span>⚠️ 5 chansons max par événement</span>
            </div>
          </div>

          <!-- Upgrade CTA for DEMO plan -->
          <div class="upgrade-cta" *ngIf="status.subscription.plan === 'DEMO'">
            <h3>🚀 Passez à un plan supérieur</h3>
            <p>Débloquez toutes les fonctionnalités : chansons illimitées, support prioritaire et plus encore !</p>
            <button class="btn btn-primary" routerLink="/pricing">
              Voir les plans disponibles
            </button>
          </div>

          <!-- Manage Subscription for paid plans -->
          <div class="subscription-actions" *ngIf="status.subscription.plan !== 'DEMO'">
            <button
              class="btn btn-outline"
              (click)="openCustomerPortal()"
              *ngIf="status.hasStripeCustomer"
            >
              🔧 Gérer mon abonnement
            </button>
            <p class="action-hint" *ngIf="status.hasStripeCustomer">
              Modifier, mettre à jour ou annuler votre abonnement via Stripe
            </p>
            <div class="info-message" *ngIf="!status.hasStripeCustomer">
              <p>💡 Effectuez votre premier paiement pour accéder au portail de gestion d'abonnement</p>
            </div>
          </div>
        </div>

        <!-- Usage Card -->
        <div class="usage-card">
          <h2>📊 Utilisation</h2>
          <div class="usage-grid">
            <div class="usage-item">
              <div class="usage-icon">🎪</div>
              <div class="usage-content">
                <span class="usage-value">{{ status.usage?.eventsCount || 0 }}</span>
                <span class="usage-label">Événements créés</span>
              </div>
            </div>
            <div class="usage-item">
              <div class="usage-icon">👥</div>
              <div class="usage-content">
                <span class="usage-value">{{ status.usage?.usersCount || 0 }}</span>
                <span class="usage-label">Utilisateurs</span>
              </div>
            </div>
            <div class="usage-item">
              <div class="usage-icon">🎵</div>
              <div class="usage-content">
                <span class="usage-value">{{ status.usage?.songsCount || 0 }}</span>
                <span class="usage-label">Chansons totales</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment History -->
        <div class="history-card">
          <h2>🧾 Historique des paiements</h2>
          <div class="history-table" *ngIf="payments.length > 0">
            <div class="table-row table-header">
              <span>Date</span>
              <span>Description</span>
              <span>Montant</span>
              <span>Statut</span>
            </div>
            <div class="table-row" *ngFor="let payment of payments">
              <span>{{ payment.paidAt | date:'dd/MM/yyyy' }}</span>
              <span>{{ payment.description }}</span>
              <span class="amount">{{ payment.amount }}€</span>
              <span class="status-badge" [class]="'status-' + payment.status.toLowerCase()">
                {{ payment.status }}
              </span>
            </div>
          </div>
          <div class="empty-state" *ngIf="payments.length === 0">
            <p>Aucun paiement enregistré</p>
          </div>
        </div>
      </div>

      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>

      <div class="error-state" *ngIf="error">
        <p>❌ {{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .billing-page {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      margin: 0 0 0.5rem;
      color: #2d3748;
      font-size: 2rem;
    }

    .page-header p {
      margin: 0;
      color: #718096;
    }

    .billing-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .plan-card, .usage-card, .history-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .plan-header h2 {
      margin: 0;
      color: #2d3748;
    }

    .plan-badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .plan-badge.plan-demo {
      background: #e2e8f0;
      color: #4a5568;
    }

    .plan-badge.plan-per_event {
      background: #bee3f8;
      color: #2c5282;
    }

    .plan-badge.plan-monthly {
      background: #c6f6d5;
      color: #22543d;
    }

    .plan-info {
      margin-bottom: 1.5rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f7fafc;
    }

    .label {
      font-weight: 600;
      color: #718096;
    }

    .status.active {
      color: #22543d;
      font-weight: 600;
    }

    .upgrade-cta {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
    }

    .upgrade-cta h3 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
    }

    .upgrade-cta p {
      margin: 0 0 1.5rem;
      opacity: 0.95;
    }

    .subscription-actions {
      text-align: center;
      padding: 1.5rem;
      background: #f7fafc;
      border-radius: 8px;
    }

    .action-hint {
      margin: 0.5rem 0 0;
      color: #718096;
      font-size: 0.85rem;
    }

    .usage-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .usage-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f7fafc;
      border-radius: 8px;
    }

    .usage-icon {
      font-size: 2rem;
    }

    .usage-content {
      display: flex;
      flex-direction: column;
    }

    .usage-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2d3748;
    }

    .usage-label {
      font-size: 0.85rem;
      color: #718096;
    }

    .history-card h2 {
      margin: 0 0 1.5rem;
      color: #2d3748;
    }

    .table-row {
      display: grid;
      grid-template-columns: 1fr 2fr 1fr 1fr;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .table-header {
      font-weight: 600;
      color: #4a5568;
      background: #f7fafc;
      border-radius: 8px;
    }

    .amount {
      font-weight: 600;
      color: #2d3748;
    }

    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 600;
      text-align: center;
    }

    .status-badge.status-paid {
      background: #c6f6d5;
      color: #22543d;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-primary {
      background: white;
      color: #667eea;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
    }

    .btn-outline {
      background: transparent;
      border: 2px solid #667eea;
      color: #667eea;
    }

    .btn-outline:hover {
      background: #667eea;
      color: white;
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 3rem;
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

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #a0aec0;
    }

    .info-message {
      background: #ebf8ff;
      border: 1px solid #bee3f8;
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .info-message p {
      margin: 0;
      color: #2c5282;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .table-row {
        grid-template-columns: 1fr;
      }

      .table-header {
        display: none;
      }
    }
  `]
})
export class BillingComponent implements OnInit {
  status: SubscriptionStatus | null = null;
  payments: Payment[] = [];
  loading = false;
  error = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBillingInfo();
  }

  loadBillingInfo(): void {
    this.loading = true;

    this.http.get<SubscriptionStatus>('/api/payments/status').subscribe({
      next: (data) => {
        this.status = data;
        this.loadPaymentHistory();
      },
      error: (err) => {
        console.error('Error loading billing status:', err);
        this.error = 'Erreur lors du chargement des informations';
        this.loading = false;
      }
    });
  }

  loadPaymentHistory(): void {
    this.http.get<{ payments: Payment[] }>('/api/payments/history').subscribe({
      next: (data) => {
        this.payments = data.payments;
        this.loading = false;
      },
      error: (err) => {
        // Gérer gracieusement l'erreur 403 (pas les permissions nécessaires)
        if (err.status === 403) {
          console.warn('Payment history not accessible (insufficient permissions)');
          this.payments = []; // Historique vide
        } else {
          console.error('Error loading payment history:', err);
        }
        this.loading = false;
      }
    });
  }

  getPlanName(plan: string): string {
    const names: any = {
      'DEMO': 'Plan DÉMO',
      'PER_EVENT': 'Par Événement',
      'MONTHLY': 'Mensuel'
    };
    return names[plan] || plan;
  }

  openCustomerPortal(): void {
    const returnUrl = `${window.location.origin}/admin/billing`;

    this.http.post<{ portalUrl: string }>('/api/payments/portal', { returnUrl }).subscribe({
      next: (response) => {
        window.location.href = response.portalUrl;
      },
      error: (err) => {
        console.error('Error opening portal:', err);

        // Gérer les différents types d'erreurs
        if (err.status === 404 && err.error?.code === 'NO_CUSTOMER') {
          alert('Aucun client Stripe trouvé. Veuillez d\'abord effectuer un paiement pour accéder au portail.');
        } else {
          alert('Erreur lors de l\'ouverture du portail client. Veuillez réessayer plus tard.');
        }
      }
    });
  }
}
