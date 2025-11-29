import Stripe from 'stripe';
import { AppDataSource } from '../db/data-source';
import { Tenant } from '../db/entities/Tenant';
import { TenantSession } from '../db/entities/TenantSession';
import { Payment } from '../db/entities/Payment';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';

export class StripeService {
  private stripe: Stripe;
  private tenantRepo = AppDataSource.getRepository(Tenant);
  private sessionRepo = AppDataSource.getRepository(TenantSession);
  private paymentRepo = AppDataSource.getRepository(Payment);

  constructor(stripeSecretKey: string) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  /**
   * Plans d'abonnement disponibles
   */
  private getSubscriptionPlans() {
    return {
      PER_EVENT: {
        name: 'Paiement par Événement',
        price: 1900, // 19€ en centimes
        currency: 'eur',
        interval: 'one_time', // Paiement unique
        features: ['1 événement', 'Chansons illimitées', 'Joueurs illimités']
      },
      MONTHLY: {
        name: 'Plan Mensuel',
        price: 4900, // 49€ en centimes
        currency: 'eur',
        interval: 'month',
        features: ['Événements illimités', 'Chansons illimitées', 'Joueurs illimités', 'Support prioritaire']
      }
    };
  }

  /**
   * Obtenir l'ID de prix Stripe préconfigur é pour un plan
   */
  private getStripePriceId(plan: 'PER_EVENT' | 'MONTHLY'): string | null {
    const priceIds = {
      PER_EVENT: env.STRIPE_PRICE_PER_EVENT,
      MONTHLY: env.STRIPE_PRICE_MONTHLY
    };

    return priceIds[plan] || null;
  }

  /**
   * Obtenir l'ID de prix Stripe pour une session temporaire
   */
  private getStripeSessionPriceId(sessionType: '2days' | '1week' | '1month'): string | null {
    const priceIds = {
      '2days': env.STRIPE_PRICE_2DAYS,
      '1week': env.STRIPE_PRICE_1WEEK,
      '1month': env.STRIPE_PRICE_1MONTH
    };

    return priceIds[sessionType] || null;
  }

  /**
   * Sessions temporaires disponibles
   */
  private getTemporarySessions() {
    return {
      '2days': {
        name: '2 jours',
        duration_days: 2,
        price: 1900, // 19€
        max_events: 999,
        max_players_per_event: 100
      },
      '1week': {
        name: '1 semaine',
        duration_days: 7,
        price: 4900, // 49€
        max_events: 999,
        max_players_per_event: 200
      },
      '1month': {
        name: '1 mois',
        duration_days: 30,
        price: 9900, // 99€
        max_events: 999,
        max_players_per_event: 500
      }
    };
  }

  /**
   * Créer ou récupérer un client Stripe pour un tenant
   */
  async getOrCreateStripeCustomer(tenant: Tenant): Promise<string> {
    if (tenant.stripe_customer_id) {
      // Vérifier que le client existe toujours
      try {
        await this.stripe.customers.retrieve(tenant.stripe_customer_id);
        return tenant.stripe_customer_id;
      } catch (error) {
        // Le client n'existe plus, on va en créer un nouveau
        tenant.stripe_customer_id = undefined;
      }
    }

    // Créer un nouveau client Stripe
    const customer = await this.stripe.customers.create({
      email: tenant.billing_email,
      name: tenant.name,
      metadata: {
        tenant_id: tenant.id,
        tenant_slug: tenant.slug || ''
      }
    });

    // Sauvegarder l'ID client
    tenant.stripe_customer_id = customer.id;
    await this.tenantRepo.save(tenant);

    return customer.id;
  }

  /**
   * Créer une session de checkout pour un abonnement
   */
  async createSubscriptionCheckout(
    tenantId: string,
    plan: 'PER_EVENT' | 'MONTHLY',
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error('TENANT_NOT_FOUND');
    }

    // Vérifier si le tenant a déjà un abonnement actif
    if (tenant.subscription_plan === plan && tenant.subscription_status === 'ACTIVE') {
      throw new Error('SUBSCRIPTION_ALREADY_EXISTS');
    }

    const customerId = await this.getOrCreateStripeCustomer(tenant);
    const isPerevent = plan === 'PER_EVENT';

    // Essayer d'utiliser l'ID de prix préconfigur é
    let priceId = this.getStripePriceId(plan);

    // Si pas d'ID préconfigur é, créer dynamiquement (fallback pour développement)
    if (!priceId) {
      console.warn(`No preconfigured Stripe price ID for plan ${plan}. Creating dynamic price (not recommended for production).`);

      const plans = this.getSubscriptionPlans();
      const planDetails = plans[plan as keyof typeof plans];

      const product = await this.stripe.products.create({
        name: planDetails.name,
        description: `Blind Test Musical - ${planDetails.name}`,
        metadata: {
          plan: plan,
          tenant_id: tenantId
        }
      });

      const priceParams: any = {
        product: product.id,
        unit_amount: planDetails.price,
        currency: planDetails.currency,
      };

      if (!isPerevent) {
        priceParams.recurring = {
          interval: 'month'
        };
      }

      const price = await this.stripe.prices.create(priceParams);
      priceId = price.id;
    }

    // Créer la session de checkout
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: isPerevent ? 'payment' : 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenant_id: tenantId,
        plan: plan,
        type: isPerevent ? 'one_time' : 'subscription'
      }
    });

    return session;
  }

  /**
   * Créer une session de checkout pour une session temporaire
   */
  async createTemporarySessionCheckout(
    tenantId: string,
    sessionType: '2days' | '1week' | '1month',
    sessionName: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ checkoutSession: Stripe.Checkout.Session; tenantSession: TenantSession }> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error('TENANT_NOT_FOUND');
    }

    const sessionDetails = this.getTemporarySessions()[sessionType];
    const customerId = await this.getOrCreateStripeCustomer(tenant);

    // Créer la session tenant en base
    const tenantSession = this.sessionRepo.create({
      id: uuidv4(),
      tenant_id: tenantId,
      name: sessionName,
      duration_days: sessionDetails.duration_days,
      starts_at: new Date(),
      expires_at: new Date(Date.now() + sessionDetails.duration_days * 24 * 60 * 60 * 1000),
      max_events: sessionDetails.max_events,
      max_players_per_event: sessionDetails.max_players_per_event,
      amount_paid: sessionDetails.price / 100, // Convertir centimes en euros
      payment_status: 'PENDING'
    });

    const savedSession = await this.sessionRepo.save(tenantSession);

    // Essayer d'utiliser l'ID de prix préconfigur é
    let priceId = this.getStripeSessionPriceId(sessionType);

    let lineItems: any[];

    if (priceId) {
      // Utiliser l'ID de prix préconfigur é
      lineItems = [
        {
          price: priceId,
          quantity: 1
        }
      ];
    } else {
      // Fallback: créer le prix dynamiquement
      console.warn(`No preconfigured Stripe price ID for session ${sessionType}. Creating dynamic price (not recommended for production).`);

      lineItems = [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${sessionDetails.name} - Blind Test Musical`,
              description: `Accès ${sessionDetails.name} (${sessionDetails.max_players_per_event} joueurs max)`
            },
            unit_amount: sessionDetails.price
          },
          quantity: 1
        }
      ];
    }

    // Créer la session de checkout Stripe
    const checkoutSession = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenant_id: tenantId,
        session_id: savedSession.id,
        type: 'temporary_session'
      }
    });

    // Sauvegarder l'ID de checkout dans la session
    savedSession.stripe_checkout_session_id = checkoutSession.id;
    await this.sessionRepo.save(savedSession);

    return { checkoutSession, tenantSession: savedSession };
  }

  /**
   * Créer un portail client pour la gestion des abonnements
   */
  async createCustomerPortalSession(
    tenantId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant || !tenant.stripe_customer_id) {
      throw new Error('STRIPE_CUSTOMER_NOT_FOUND');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: tenant.stripe_customer_id,
      return_url: returnUrl
    });

    return session;
  }

  /**
   * Traiter un webhook Stripe
   */
  async handleWebhook(
    payload: string,
    signature: string,
    webhookSecret: string
  ): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error: any) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;

      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Gérer la completion d'un checkout
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const tenantId = session.metadata?.tenant_id;
    if (!tenantId) return;

    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) return;

    // Créer un enregistrement de paiement
    const payment = this.paymentRepo.create({
      id: uuidv4(),
      tenant_id: tenantId,
      payment_type: session.metadata?.type === 'subscription' ? 'SUBSCRIPTION' : 'SESSION',
      payment_method: 'STRIPE',
      status: 'PAID',
      amount: (session.amount_total || 0) / 100, // Convertir centimes en euros
      currency: session.currency?.toUpperCase() || 'EUR',
      stripe_checkout_session_id: session.id,
      description: `Payment for ${session.metadata?.type || 'service'}`,
      paid_at: new Date()
    });

    if (session.metadata?.session_id) {
      payment.session_id = session.metadata.session_id;
    }

    await this.paymentRepo.save(payment);

    // Traiter selon le type
    if (session.metadata?.type === 'temporary_session' && session.metadata?.session_id) {
      // Activer la session temporaire
      const tenantSession = await this.sessionRepo.findOne({
        where: { id: session.metadata.session_id }
      });

      if (tenantSession) {
        tenantSession.markAsPaid(session.payment_intent as string);
        await this.sessionRepo.save(tenantSession);
      }
    } else if (session.metadata?.type === 'subscription' && session.metadata?.plan) {
      // Mettre à jour le plan du tenant
      const plan = session.metadata.plan as 'PER_EVENT' | 'MONTHLY';
      tenant.subscription_plan = plan;
      tenant.subscription_status = 'ACTIVE';

      if (session.subscription) {
        tenant.stripe_subscription_id = session.subscription as string;
      }

      // Appliquer les limites du plan
      const planLimits = this.getPlanLimits(plan as 'DEMO' | 'PER_EVENT' | 'MONTHLY');
      Object.assign(tenant, planLimits);

      await this.tenantRepo.save(tenant);
    }
  }

  /**
   * Gérer les changements d'abonnement
   */
  private async handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;

    const tenant = await this.tenantRepo.findOne({
      where: { stripe_customer_id: customerId }
    });

    if (!tenant) return;

    tenant.stripe_subscription_id = subscription.id;
    tenant.subscription_status = subscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE';

    await this.tenantRepo.save(tenant);
  }

  /**
   * Gérer l'annulation d'abonnement
   */
  private async handleSubscriptionCancelled(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;

    const tenant = await this.tenantRepo.findOne({
      where: { stripe_customer_id: customerId }
    });

    if (!tenant) return;

    tenant.subscription_status = 'CANCELLED';
    tenant.subscription_plan = 'DEMO';

    // Réappliquer les limites DEMO
    const demoLimits = this.getPlanLimits('DEMO');
    Object.assign(tenant, demoLimits);

    await this.tenantRepo.save(tenant);
  }

  /**
   * Gérer un paiement réussi
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // Mettre à jour le statut du paiement si nécessaire
    const payment = await this.paymentRepo.findOne({
      where: { stripe_payment_intent_id: paymentIntent.id }
    });

    if (payment && payment.status !== 'PAID') {
      payment.markAsPaid();
      await this.paymentRepo.save(payment);
    }
  }

  /**
   * Gérer un échec de paiement
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.paymentRepo.findOne({
      where: { stripe_payment_intent_id: paymentIntent.id }
    });

    if (payment) {
      payment.markAsFailed(paymentIntent.last_payment_error?.message);
      await this.paymentRepo.save(payment);
    }
  }

  /**
   * Obtenir les limites selon le plan
   */
  private getPlanLimits(plan: 'DEMO' | 'PER_EVENT' | 'MONTHLY') {
    const limits = {
      DEMO: {
        max_concurrent_events: 999, // Événements illimités
        max_players_per_event: 999, // Joueurs illimités
        max_users: 5,
        max_songs_per_event: 5 // Limitation : 5 chansons maximum
      },
      PER_EVENT: {
        max_concurrent_events: 1, // 1 événement à la fois
        max_players_per_event: 999, // Joueurs illimités
        max_users: 10,
        max_songs_per_event: null // Pas de limite de chansons
      },
      MONTHLY: {
        max_concurrent_events: 999, // Événements illimités
        max_players_per_event: 999, // Joueurs illimités
        max_users: 999,
        max_songs_per_event: null // Pas de limite de chansons
      }
    };

    return limits[plan];
  }

  /**
   * Récupérer l'historique des paiements d'un tenant
   */
  async getTenantPayments(tenantId: string): Promise<Payment[]> {
    return await this.paymentRepo.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' }
    });
  }

  /**
   * Récupérer les détails d'une session de checkout
   */
  async getCheckoutSession(sessionId: string): Promise<any> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'customer', 'subscription']
      });

      return {
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency,
        customerEmail: session.customer_details?.email,
        customerName: session.customer_details?.name,
        metadata: session.metadata,
        lineItems: session.line_items?.data.map(item => ({
          description: item.description,
          amount: item.amount_total / 100,
          currency: item.currency
        })),
        createdAt: new Date(session.created * 1000)
      };
    } catch (error: any) {
      throw new Error(`Failed to retrieve checkout session: ${error.message}`);
    }
  }

  /**
   * Annuler un abonnement
   */
  async cancelSubscription(tenantId: string): Promise<void> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant || !tenant.stripe_subscription_id) {
      throw new Error('SUBSCRIPTION_NOT_FOUND');
    }

    await this.stripe.subscriptions.cancel(tenant.stripe_subscription_id);
  }
}