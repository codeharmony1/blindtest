import { AppDataSource } from "../db/data-source";
import { Tenant } from "../db/entities/Tenant";
import { TenantUser } from "../db/entities/TenantUser";
import { TenantSession } from "../db/entities/TenantSession";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export class TenantService {
  private tenantRepo = AppDataSource.getRepository(Tenant);
  private userRepo = AppDataSource.getRepository(TenantUser);
  private sessionRepo = AppDataSource.getRepository(TenantSession);

  /**
   * Créer un nouveau tenant avec son propriétaire
   */
  async createTenant(data: {
    name: string;
    slug?: string;
    ownerEmail: string;
    ownerPassword: string;
    ownerName?: string;
    plan?: 'DEMO' | 'PER_EVENT' | 'MONTHLY';
  }): Promise<{ tenant: Tenant; owner: TenantUser }> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Vérifier l'unicité du slug
      if (data.slug) {
        const existingTenant = await this.tenantRepo.findOne({ where: { slug: data.slug } });
        if (existingTenant) {
          throw new Error("SLUG_ALREADY_EXISTS");
        }
      }

      // Créer le tenant
      const planLimits = this.getPlanLimits(data.plan || 'DEMO');
      const tenant = this.tenantRepo.create({
        id: uuidv4(),
        name: data.name,
        slug: data.slug || this.generateSlug(data.name),
        subscription_plan: data.plan || 'DEMO',
        billing_email: data.ownerEmail,
        max_concurrent_events: planLimits.max_concurrent_events,
        max_players_per_event: planLimits.max_players_per_event,
        max_users: planLimits.max_users,
        max_songs_per_event: planLimits.max_songs_per_event,
        ...(planLimits.subscription_expires_at && { subscription_expires_at: planLimits.subscription_expires_at })
      });

      const savedTenant = await queryRunner.manager.save(tenant);

      // Créer l'utilisateur propriétaire
      const hashedPassword = await bcrypt.hash(data.ownerPassword, 10);
      const owner = this.userRepo.create({
        id: uuidv4(),
        tenant_id: savedTenant.id,
        email: data.ownerEmail,
        password_hash: hashedPassword,
        role: 'OWNER',
        display_name: data.ownerName,
        is_active: true
      });

      const savedOwner = await queryRunner.manager.save(TenantUser, owner) as TenantUser;

      await queryRunner.commitTransaction();

      return { tenant: savedTenant, owner: savedOwner };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Récupérer un tenant par ID
   */
  async getTenantById(tenantId: string): Promise<Tenant | null> {
    return await this.tenantRepo.findOne({
      where: { id: tenantId },
      relations: ['users', 'sessions', 'events']
    });
  }

  /**
   * Récupérer un tenant par slug
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return await this.tenantRepo.findOne({
      where: { slug },
      relations: ['users']
    });
  }

  /**
   * Valider qu'un tenant peut créer un nouvel événement
   */
  async canCreateEvent(tenantId: string): Promise<boolean> {
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
      relations: ['events', 'sessions']
    });

    if (!tenant || !tenant.canCreateEvent()) {
      return false;
    }

    // Vérifier les limites du plan
    const activeEvents = tenant.events.filter(event =>
      // Logique pour déterminer si un événement est actif
      true // TODO: Implémenter la logique d'événement actif
    );

    return activeEvents.length < tenant.max_concurrent_events;
  }

  /**
   * Créer une session payante pour un tenant
   */
  async createSession(tenantId: string, data: {
    name: string;
    description?: string;
    duration_days: number;
    max_events?: number;
    max_players_per_event?: number;
    amount_paid: number;
  }): Promise<TenantSession> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(startsAt.getDate() + data.duration_days);

    const session = this.sessionRepo.create({
      id: uuidv4(),
      tenant_id: tenantId,
      name: data.name,
      description: data.description,
      duration_days: data.duration_days,
      starts_at: startsAt,
      expires_at: expiresAt,
      max_events: data.max_events || 10,
      max_players_per_event: data.max_players_per_event || 100,
      amount_paid: data.amount_paid,
      payment_status: 'PENDING'
    });

    return await this.sessionRepo.save(session);
  }

  /**
   * Marquer une session comme payée
   */
  async markSessionAsPaid(sessionId: string, paymentReference: string): Promise<TenantSession> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new Error("SESSION_NOT_FOUND");
    }

    session.markAsPaid(paymentReference);
    return await this.sessionRepo.save(session);
  }

  /**
   * Récupérer les sessions actives d'un tenant
   */
  async getActiveSessions(tenantId: string): Promise<TenantSession[]> {
    return await this.sessionRepo.find({
      where: {
        tenant_id: tenantId,
        is_active: true,
        payment_status: 'PAID'
      },
      order: { created_at: 'DESC' }
    });
  }

  /**
   * Vérifier si un tenant a une session active
   */
  async hasActiveSession(tenantId: string): Promise<boolean> {
    const activeSessions = await this.getActiveSessions(tenantId);
    return activeSessions.some(session => session.isActive());
  }

  /**
   * Mettre à jour les limites d'un tenant selon son plan
   */
  async updateTenantPlan(tenantId: string, plan: 'DEMO' | 'PER_EVENT' | 'MONTHLY'): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    const limits = this.getPlanLimits(plan);
    Object.assign(tenant, {
      subscription_plan: plan,
      ...limits
    });

    return await this.tenantRepo.save(tenant);
  }

  /**
   * Générer un slug unique à partir du nom
   */
  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // TODO: Vérifier l'unicité et ajouter un suffixe si nécessaire
    return baseSlug;
  }

  /**
   * Obtenir les limites selon le plan
   */
  private getPlanLimits(plan: 'DEMO' | 'PER_EVENT' | 'MONTHLY'): {
    max_concurrent_events: number;
    max_players_per_event: number;
    max_users: number;
    max_songs_per_event?: number; // Pour DEMO
    subscription_expires_at?: Date;
  } {
    const baseLimits = {
      DEMO: {
        max_concurrent_events: 999, // Événements illimités
        max_players_per_event: 999, // Joueurs illimités
        max_users: 5,
        max_songs_per_event: 5 // Limitation : 5 chansons maximum
        // Pas d'expiration pour DEMO
      },
      PER_EVENT: {
        max_concurrent_events: 1, // 1 événement à la fois
        max_players_per_event: 999, // Joueurs illimités
        max_users: 10
        // Pas de limite de chansons
      },
      MONTHLY: {
        max_concurrent_events: 999, // Événements illimités
        max_players_per_event: 999, // Joueurs illimités
        max_users: 999
        // Pas de limite de chansons
      }
    };

    return baseLimits[plan];
  }

  /**
   * Récupérer les statistiques d'usage d'un tenant
   */
  async getTenantUsage(tenantId: string): Promise<{
    eventsCount: number;
    usersCount: number;
    activeSessionsCount: number;
    totalPlayersCount: number;
  }> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    // TODO: Implémenter le calcul réel des statistiques
    return {
      eventsCount: tenant.events?.length || 0,
      usersCount: tenant.users?.length || 0,
      activeSessionsCount: tenant.sessions?.filter(s => s.isActive()).length || 0,
      totalPlayersCount: 0 // Calculer depuis les événements
    };
  }

  /**
   * Suspendre un tenant
   */
  async suspendTenant(tenantId: string, reason?: string): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    tenant.is_active = false;
    tenant.subscription_status = 'CANCELLED';

    return await this.tenantRepo.save(tenant);
  }

  /**
   * Réactiver un tenant
   */
  async reactivateTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    tenant.is_active = true;
    tenant.subscription_status = 'ACTIVE';

    return await this.tenantRepo.save(tenant);
  }
}