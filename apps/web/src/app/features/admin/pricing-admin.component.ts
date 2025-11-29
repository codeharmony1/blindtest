import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

interface PricingPlan {
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
}

@Component({
  selector: 'bt-pricing-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="pricing-admin-page">
      <!-- Page Header -->
      <header class="page-header">
        <h1>💰 Tarifs & Plans</h1>
        <p>Choisissez le plan qui convient à vos besoins</p>
      </header>

      <!-- Pricing Cards -->
      <section class="pricing-section">
        <div class="pricing-grid">
          <!-- Plan DEMO -->
          <div class="pricing-card demo">
            <div class="card-badge">Gratuit</div>
            <h2>Plan DÉMO</h2>
            <div class="price">
              <span class="amount">0€</span>
              <span class="period">/ à vie</span>
            </div>
            <ul class="features">
              <li>✅ Événements illimités</li>
              <li>✅ Joueurs illimités</li>
              <li>⚠️ Limité à 5 chansons par événement</li>
              <li>✅ Tous les thèmes disponibles</li>
              <li>📧 Support par email</li>
            </ul>
            <button class="btn btn-secondary" disabled>
              Plan actuel
            </button>
          </div>

          <!-- Plan PER_EVENT -->
          <div class="pricing-card per-event">
            <div class="card-badge">Populaire</div>
            <h2>Paiement par Événement</h2>
            <div class="price">
              <span class="amount">19€</span>
              <span class="period">/ par événement</span>
            </div>
            <ul class="features">
              <li>✅ 1 événement à la fois</li>
              <li>🎵 Chansons illimitées</li>
              <li>👥 Joueurs illimités</li>
              <li>🎨 Tous les thèmes disponibles</li>
              <li>📧 Support par email</li>
              <li>💾 Export des résultats CSV</li>
            </ul>
            <button class="btn btn-primary" (click)="selectPlan('PER_EVENT')">
              Choisir ce plan
            </button>
          </div>

          <!-- Plan MONTHLY -->
          <div class="pricing-card monthly recommended">
            <div class="card-badge best-value">Meilleur rapport qualité/prix</div>
            <h2>Plan Mensuel</h2>
            <div class="price">
              <span class="amount">49€</span>
              <span class="period">/ mois</span>
            </div>
            <ul class="features">
              <li>✅ Événements illimités</li>
              <li>🎵 Chansons illimitées</li>
              <li>👥 Joueurs illimités</li>
              <li>🎨 Thèmes personnalisés</li>
              <li>⭐ Support prioritaire</li>
              <li>💾 Export des résultats CSV</li>
              <li>📊 Statistiques avancées</li>
              <li>🔄 Annulation à tout moment</li>
            </ul>
            <button class="btn btn-accent" (click)="selectPlan('MONTHLY')">
              Choisir ce plan
            </button>
          </div>
        </div>
      </section>

      <!-- Temporary Sessions -->
      <section class="sessions-section">
        <h2>🕐 Sessions Temporaires</h2>
        <p class="section-subtitle">
          Besoin d'accès limité dans le temps ? Optez pour une session temporaire !
        </p>

        <div class="sessions-grid">
          <div class="session-card">
            <h3>2 jours</h3>
            <div class="session-price">19€</div>
            <ul class="session-features">
              <li>Événements illimités pendant 2 jours</li>
              <li>100 joueurs max par événement</li>
              <li>Support par email</li>
            </ul>
            <button class="btn btn-outline" (click)="selectSession('2days')">
              Acheter
            </button>
          </div>

          <div class="session-card">
            <h3>1 semaine</h3>
            <div class="session-price">49€</div>
            <ul class="session-features">
              <li>Événements illimités pendant 7 jours</li>
              <li>200 joueurs max par événement</li>
              <li>Support par email</li>
            </ul>
            <button class="btn btn-outline" (click)="selectSession('1week')">
              Acheter
            </button>
          </div>

          <div class="session-card">
            <h3>1 mois</h3>
            <div class="session-price">99€</div>
            <ul class="session-features">
              <li>Événements illimités pendant 30 jours</li>
              <li>500 joueurs max par événement</li>
              <li>Support prioritaire</li>
            </ul>
            <button class="btn btn-outline" (click)="selectSession('1month')">
              Acheter
            </button>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="faq-section">
        <h2>❓ Questions Fréquentes</h2>
        <div class="faq-grid">
          <div class="faq-item">
            <h3>Le plan DÉMO est-il vraiment gratuit ?</h3>
            <p>Oui ! Le plan DÉMO est 100% gratuit et illimité dans le temps. La seule limitation est le nombre de chansons (5 maximum par événement).</p>
          </div>
          <div class="faq-item">
            <h3>Puis-je annuler mon abonnement mensuel ?</h3>
            <p>Oui, vous pouvez annuler votre abonnement à tout moment. Il restera actif jusqu'à la fin de la période déjà payée.</p>
          </div>
          <div class="faq-item">
            <h3>Comment fonctionne le paiement par événement ?</h3>
            <p>Vous payez 19€ pour organiser un événement. Vous pouvez ensuite créer autant de rounds et ajouter autant de chansons que vous le souhaitez pour cet événement.</p>
          </div>
          <div class="faq-item">
            <h3>Les sessions temporaires incluent-elles tout ?</h3>
            <p>Oui ! Les sessions temporaires débloquent toutes les fonctionnalités pendant la durée choisie, avec uniquement une limite de joueurs par événement.</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .pricing-admin-page {
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Page Header */
    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem;
      color: #2d3748;
    }

    .page-header p {
      font-size: 1.125rem;
      color: #718096;
      margin: 0;
    }

    /* Pricing Section */
    .pricing-section {
      margin-bottom: 3rem;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }

    .pricing-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      position: relative;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.3s;
      border: 2px solid transparent;
    }

    .pricing-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }

    .pricing-card.recommended {
      border-color: #f59e0b;
      transform: scale(1.02);
    }

    .pricing-card.recommended:hover {
      transform: scale(1.02) translateY(-8px);
    }

    .card-badge {
      position: absolute;
      top: -12px;
      right: 20px;
      background: #667eea;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 700;
    }

    .card-badge.best-value {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    .pricing-card h2 {
      margin: 1rem 0 1.5rem;
      font-size: 1.5rem;
      color: #2d3748;
    }

    .price {
      margin-bottom: 2rem;
    }

    .price .amount {
      font-size: 2.5rem;
      font-weight: 800;
      color: #667eea;
    }

    .price .period {
      color: #718096;
      font-size: 0.9rem;
    }

    .features {
      list-style: none;
      padding: 0;
      margin: 0 0 2rem 0;
    }

    .features li {
      padding: 0.75rem 0;
      color: #4a5568;
      font-size: 0.95rem;
      border-bottom: 1px solid #f7fafc;
    }

    .btn {
      width: 100%;
      padding: 1rem 2rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #5568d3;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }

    .btn-accent {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .btn-accent:hover {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
      transform: translateY(-2px);
    }

    /* Sessions Section */
    .sessions-section {
      margin-bottom: 3rem;
    }

    .sessions-section h2 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      color: #2d3748;
    }

    .section-subtitle {
      font-size: 1rem;
      color: #718096;
      margin-bottom: 2rem;
    }

    .sessions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
    }

    .session-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .session-card h3 {
      font-size: 1.5rem;
      margin: 0 0 1rem;
      color: #2d3748;
    }

    .session-price {
      font-size: 2rem;
      font-weight: 800;
      color: #667eea;
      margin-bottom: 1.5rem;
    }

    .session-features {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem 0;
    }

    .session-features li {
      padding: 0.5rem 0;
      font-size: 0.9rem;
      color: #4a5568;
    }

    .btn-outline {
      background: white;
      border: 2px solid #667eea;
      color: #667eea;
    }

    .btn-outline:hover {
      background: #667eea;
      color: white;
      transform: translateY(-2px);
    }

    /* FAQ Section */
    .faq-section h2 {
      font-size: 2rem;
      margin-bottom: 2rem;
      color: #2d3748;
    }

    .faq-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
    }

    .faq-item {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .faq-item h3 {
      font-size: 1.125rem;
      margin: 0 0 0.75rem;
      color: #2d3748;
    }

    .faq-item p {
      margin: 0;
      color: #4a5568;
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      .page-header h1 {
        font-size: 2rem;
      }

      .pricing-card.recommended {
        transform: scale(1);
      }

      .pricing-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PricingAdminComponent implements OnInit {
  pricing: any = null;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPricing();
  }

  loadPricing(): void {
    this.apiService.getPricing().subscribe({
      next: (data: any) => {
        this.pricing = data;
        console.log('Pricing loaded:', data);
      },
      error: (err: any) => console.error('Error loading pricing:', err)
    });
  }

  selectPlan(plan: string): void {
    const token = localStorage.getItem('tenant_auth_token')
      || localStorage.getItem('bt_tenant_token')
      || localStorage.getItem('bt_access_token')
      || localStorage.getItem('bt_super_admin_token');

    if (!token) {
      this.router.navigate(['/auth/register'], { queryParams: { plan } });
      return;
    }

    const successUrl = `${window.location.origin}/admin/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${window.location.origin}/admin/pricing`;

    this.apiService.createSubscriptionCheckout(plan, successUrl, cancelUrl).subscribe({
      next: (response: any) => window.location.href = response.checkoutUrl,
      error: (error: any) => {
        console.error('Checkout error:', error);

        if (error.status === 409 && error.error?.code === 'SUBSCRIPTION_ALREADY_EXISTS') {
          alert('Vous avez déjà un abonnement actif pour ce plan. Consultez la page "Mon Abonnement" pour gérer votre abonnement.');
          this.router.navigate(['/admin/billing']);
        } else {
          alert('Une erreur est survenue lors de la création du paiement. Veuillez réessayer.');
        }
      }
    });
  }

  selectSession(sessionType: string): void {
    const token = localStorage.getItem('tenant_auth_token')
      || localStorage.getItem('bt_tenant_token')
      || localStorage.getItem('bt_access_token')
      || localStorage.getItem('bt_super_admin_token');

    if (!token) {
      this.router.navigate(['/auth/register'], { queryParams: { sessionType } });
      return;
    }

    const sessionName = prompt('Nom de votre session temporaire :') || `Session ${sessionType}`;
    const successUrl = `${window.location.origin}/admin/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${window.location.origin}/admin/pricing`;

    this.apiService.createSessionCheckout(sessionType, sessionName, successUrl, cancelUrl).subscribe({
      next: (response: any) => window.location.href = response.checkoutUrl,
      error: (error: any) => console.error('Checkout error:', error)
    });
  }
}
