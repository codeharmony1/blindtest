import { AppDataSource } from "../db/data-source";
import { SuperAdmin } from "../db/entities/SuperAdmin";
import { AuditLog, AuditAction, TargetType } from "../db/entities/AuditLog";
import { Tenant } from "../db/entities/Tenant";
import { TenantUser } from "../db/entities/TenantUser";
import { Event } from "../db/entities/Event";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export class SuperAdminService {
  private adminRepo = AppDataSource.getRepository(SuperAdmin);
  private auditRepo = AppDataSource.getRepository(AuditLog);
  private tenantRepo = AppDataSource.getRepository(Tenant);
  private userRepo = AppDataSource.getRepository(TenantUser);
  private eventRepo = AppDataSource.getRepository(Event);

  /**
   * Authentifier un super-admin
   */
  async authenticate(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ token: string; admin: SuperAdmin }> {
    const admin = await this.adminRepo.findOne({
      where: { email, is_active: true },
    });

    if (!admin) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Mettre à jour la dernière connexion
    admin.updateLastLogin();
    await this.adminRepo.save(admin);

    // Logger la connexion
    await this.logAction({
      adminId: admin.id,
      action: "login",
      targetType: "system",
      ipAddress,
      userAgent,
    });

    // Générer le token JWT
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: "SUPER_ADMIN",
      },
      env.JWT_SECRET,
      { expiresIn: "1h" } // Token court pour sécurité maximale
    );

    return { token, admin };
  }

  /**
   * Créer un nouveau super-admin (opération manuelle)
   */
  async createSuperAdmin(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<SuperAdmin> {
    // Vérifier l'unicité de l'email
    const existing = await this.adminRepo.findOne({
      where: { email: data.email },
    });
    if (existing) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const admin = this.adminRepo.create({
      email: data.email,
      password_hash: passwordHash,
      name: data.name,
      is_active: true,
    });

    return await this.adminRepo.save(admin);
  }

  /**
   * Liste de tous les tenants avec statistiques
   */
  async getAllTenants(filters?: {
    status?: string;
    plan?: string;
    search?: string;
  }): Promise<any[]> {
    const queryBuilder = this.tenantRepo
      .createQueryBuilder("tenant")
      .leftJoinAndSelect("tenant.users", "users")
      .leftJoinAndSelect("tenant.events", "events")
      .select([
        "tenant",
        "users.id",
        "users.email",
        "users.role",
        "users.display_name",
        "events.id",
        "events.code",
        "events.name",
        "events.created_at",
      ]);

    // Filtres
    if (filters?.status) {
      queryBuilder.andWhere("tenant.subscription_status = :status", {
        status: filters.status,
      });
    }

    if (filters?.plan) {
      queryBuilder.andWhere("tenant.subscription_plan = :plan", {
        plan: filters.plan,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        "(tenant.name LIKE :search OR tenant.billing_email LIKE :search OR tenant.slug LIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    queryBuilder.orderBy("tenant.created_at", "DESC");

    const tenants = await queryBuilder.getMany();

    // Enrichir avec les statistiques
    return tenants.map((tenant) => ({
      ...tenant,
      stats: {
        usersCount: tenant.users?.length || 0,
        eventsCount: tenant.events?.length || 0,
        activeEventsCount: tenant.events?.length || 0, // TODO: Impl émenter la logique d'événement actif
      },
    }));
  }

  /**
   * Détails complets d'un tenant
   */
  async getTenantDetails(tenantId: string): Promise<any> {
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
      relations: ["users", "events", "sessions"],
    });

    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    // Calculer les statistiques avancées
    const totalPlayers = 0; // TODO: Calculer depuis les events
    const totalGames = 0; // TODO: Calculer depuis les rounds

    return {
      ...tenant,
      stats: {
        usersCount: tenant.users?.length || 0,
        eventsCount: tenant.events?.length || 0,
        activeEventsCount: tenant.events?.length || 0, // TODO: Implémenter la logique d'événement actif
        totalPlayers,
        totalGames,
        sessionsCount: tenant.sessions?.length || 0,
        activeSessionsCount:
          tenant.sessions?.filter((s) => s.isActive()).length || 0,
      },
    };
  }

  /**
   * Suspendre un tenant
   */
  async suspendTenant(
    tenantId: string,
    adminId: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    tenant.is_active = false;
    tenant.subscription_status = "CANCELLED";
    const updatedTenant = await this.tenantRepo.save(tenant);

    // Logger l'action
    await this.logAction({
      adminId,
      action: "suspend_tenant",
      targetType: "tenant",
      targetId: tenantId,
      metadata: { reason },
      ipAddress,
      userAgent,
    });

    return updatedTenant;
  }

  /**
   * Réactiver un tenant
   */
  async reactivateTenant(
    tenantId: string,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    tenant.is_active = true;
    tenant.subscription_status = "ACTIVE";
    const updatedTenant = await this.tenantRepo.save(tenant);

    // Logger l'action
    await this.logAction({
      adminId,
      action: "reactivate_tenant",
      targetType: "tenant",
      targetId: tenantId,
      ipAddress,
      userAgent,
    });

    return updatedTenant;
  }

  /**
   * Mettre à jour le plan d'un tenant
   */
  async updateTenantPlan(
    tenantId: string,
    plan: "DEMO" | "PER_EVENT" | "MONTHLY",
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    const oldPlan = tenant.subscription_plan;
    const limits = this.getPlanLimits(plan);

    Object.assign(tenant, {
      subscription_plan: plan as any,
      ...limits,
    });

    const updatedTenant = await this.tenantRepo.save(tenant);

    // Logger l'action
    await this.logAction({
      adminId,
      action: "update_plan",
      targetType: "tenant",
      targetId: tenantId,
      metadata: { oldPlan, newPlan: plan },
      ipAddress,
      userAgent,
    });

    return updatedTenant;
  }

  /**
   * Supprimer un tenant (avec confirmation)
   */
  async deleteTenant(
    tenantId: string,
    adminId: string,
    confirmation: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    if (confirmation !== "DELETE") {
      throw new Error("CONFIRMATION_REQUIRED");
    }

    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    // Logger avant suppression
    await this.logAction({
      adminId,
      action: "delete_tenant",
      targetType: "tenant",
      targetId: tenantId,
      metadata: { tenantName: tenant.name },
      ipAddress,
      userAgent,
    });

    // Suppression cascade gérée par les FK
    await this.tenantRepo.remove(tenant);
  }

  /**
   * Obtenir tous les événements en cours (tous tenants)
   */
  async getLiveEvents(): Promise<any[]> {
    // Pour l'instant, récupérer les derniers événements créés
    // TODO: Ajouter une logique de statut "live" sur les événements
    const events = await this.eventRepo
      .createQueryBuilder("event")
      .leftJoinAndSelect("event.tenant", "tenant")
      .leftJoinAndSelect("event.teams", "teams")
      .leftJoinAndSelect("teams.players", "players")
      .select([
        "event.id",
        "event.code",
        "event.name",
        "event.created_at",
        "event.tenant_id",
        "tenant.id",
        "tenant.name",
        "teams.id",
        "teams.name",
        "players.id",
        "players.nickname",
      ])
      .orderBy("event.created_at", "DESC")
      .limit(50) // Limiter aux 50 derniers événements
      .getMany();

    return events.map((event) => ({
      ...event,
      playersCount: event.teams?.reduce(
        (acc, team) => acc + (team.players?.length || 0),
        0
      ),
      teamsCount: event.teams?.length || 0,
    }));
  }

  /**
   * Statistiques globales
   */
  async getGlobalStats(): Promise<{
    tenantsCount: number;
    activeTenantsCount: number;
    totalEventsCount: number;
    liveEventsCount: number;
    totalUsersCount: number;
    totalPlayersCount: number;
  }> {
    const [
      tenantsCount,
      activeTenantsCount,
      totalEventsCount,
      totalUsersCount,
    ] = await Promise.all([
      this.tenantRepo.count(),
      this.tenantRepo.count({ where: { is_active: true } }),
      this.eventRepo.count(),
      this.userRepo.count(),
    ]);

    const liveEvents = await this.getLiveEvents();
    const liveEventsCount = liveEvents.length;
    const totalPlayersCount = liveEvents.reduce(
      (acc, e) => acc + (e.playersCount || 0),
      0
    );

    return {
      tenantsCount,
      activeTenantsCount,
      totalEventsCount,
      liveEventsCount,
      totalUsersCount,
      totalPlayersCount,
    };
  }

  /**
   * Obtenir les logs d'audit
   */
  async getAuditLogs(filters?: {
    adminId?: string;
    action?: AuditAction;
    targetType?: TargetType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    const queryBuilder = this.auditRepo
      .createQueryBuilder("log")
      .leftJoinAndSelect("log.admin", "admin")
      .select([
        "log",
        "admin.id",
        "admin.email",
        "admin.name",
      ]);

    if (filters?.adminId) {
      queryBuilder.andWhere("log.admin_id = :adminId", {
        adminId: filters.adminId,
      });
    }

    if (filters?.action) {
      queryBuilder.andWhere("log.action = :action", { action: filters.action });
    }

    if (filters?.targetType) {
      queryBuilder.andWhere("log.target_type = :targetType", {
        targetType: filters.targetType,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere("log.timestamp >= :startDate", {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere("log.timestamp <= :endDate", {
        endDate: filters.endDate,
      });
    }

    queryBuilder
      .orderBy("log.timestamp", "DESC")
      .limit(filters?.limit || 100);

    return await queryBuilder.getMany();
  }

  /**
   * Logger une action (helper privé)
   */
  private async logAction(data: {
    adminId: string;
    action: AuditAction;
    targetType?: TargetType;
    targetId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const log = AuditLog.create(data);
    return await this.auditRepo.save(log);
  }

  /**
   * Obtenir les limites selon le plan
   */
  private getPlanLimits(plan: "DEMO" | "PER_EVENT" | "MONTHLY"): {
    max_concurrent_events: number;
    max_players_per_event: number;
    max_users: number;
    subscription_expires_at?: Date;
  } {
    const limits = {
      DEMO: {
        max_concurrent_events: 999, // Illimité
        max_players_per_event: 999, // Illimité
        max_users: 5,
        // Pas d'expiration pour DEMO
      },
      PER_EVENT: {
        max_concurrent_events: 1, // 1 événement à la fois
        max_players_per_event: 999,
        max_users: 10,
      },
      MONTHLY: {
        max_concurrent_events: 999, // Illimité
        max_players_per_event: 999,
        max_users: 999,
      },
    };

    return limits[plan] || limits.DEMO;
  }

  /**
   * Arrêter un événement de force (super-admin uniquement)
   */
  async forceStopEvent(
    eventId: string,
    adminId?: string,
    reason?: string
  ): Promise<void> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ["tenant"],
    });

    if (!event) {
      throw new Error("EVENT_NOT_FOUND");
    }

    // Marquer l'événement comme terminé (si vous avez un champ status)
    // event.status = 'FORCE_STOPPED'; // Décommenter si vous ajoutez ce champ
    await this.eventRepo.save(event);

    // Logger l'action critique
    await this.logAction({
      adminId: adminId || "system",
      action: "force_stop_event",
      targetType: "event",
      targetId: eventId,
      metadata: {
        event_code: event.code,
        event_name: event.name,
        tenant_id: event.tenant_id,
        tenant_name: event.tenant?.name,
        reason: reason || "Arrêt forcé par super-admin",
      },
    });

    // TODO: Émettre un événement WebSocket pour notifier tous les participants
    // io.to(`event:${event.code}`).emit('event_force_stopped', { reason });
  }
}
