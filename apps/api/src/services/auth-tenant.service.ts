import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../db/data-source";
import { TenantUser } from "../db/entities/TenantUser";
import { Tenant } from "../db/entities/Tenant";
import { env } from "../config/env";
import { v4 as uuidv4 } from "uuid";

export interface AuthTokenPayload {
  userId: string;
  tenantId: string;
  role: 'OWNER' | 'ADMIN' | 'DJ' | 'VIEWER';
  email: string;
  sessionId?: string;
  eventCode?: string;
  isSuperAdmin?: boolean;
  exp: number;
}

export interface LoginResult {
  user: TenantUser;
  tenant: Tenant;
  token: string;
  refreshToken: string;
}

export class AuthTenantService {
  private userRepo = AppDataSource.getRepository(TenantUser);
  private tenantRepo = AppDataSource.getRepository(Tenant);

  /**
   * Authentifier un utilisateur par email/password pour un tenant
   */
  async login(
    email: string,
    password: string,
    tenantSlug?: string,
    tenantId?: string
  ): Promise<LoginResult> {
    // Récupérer le tenant
    let tenant: Tenant | null = null;

    if (tenantId) {
      tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    } else if (tenantSlug) {
      tenant = await this.tenantRepo.findOne({ where: { slug: tenantSlug } });
    }

    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    if (!tenant.is_active) {
      throw new Error("TENANT_SUSPENDED");
    }

    // Récupérer l'utilisateur
    const user = await this.userRepo.findOne({
      where: {
        email,
        tenant_id: tenant.id,
        is_active: true
      },
      relations: ['tenant']
    });

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Vérifier l'abonnement du tenant
    if (!tenant.isSubscriptionActive()) {
      throw new Error("SUBSCRIPTION_EXPIRED");
    }

    // Mettre à jour la dernière connexion
    user.updateLastLogin();
    await this.userRepo.save(user);

    // Générer les tokens
    const token = this.generateAccessToken(user, tenant);
    const refreshToken = this.generateRefreshToken(user, tenant);

    return {
      user,
      tenant,
      token,
      refreshToken
    };
  }

  /**
   * Créer un nouvel utilisateur dans un tenant
   */
  async createUser(
    tenantId: string,
    data: {
      email: string;
      password: string;
      role: 'ADMIN' | 'DJ' | 'VIEWER';
      displayName?: string;
      firstName?: string;
      lastName?: string;
    },
    createdBy: TenantUser
  ): Promise<TenantUser> {
    // Vérifier que le créateur a les permissions
    if (!createdBy.canManageUsers()) {
      throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    // Vérifier que l'email n'existe pas déjà pour ce tenant
    const existingUser = await this.userRepo.findOne({
      where: {
        email: data.email,
        tenant_id: tenantId
      }
    });

    if (existingUser) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    // Vérifier les limites du tenant
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
      relations: ['users']
    });

    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    if (tenant.users.length >= tenant.max_users) {
      throw new Error("USER_LIMIT_REACHED");
    }

    // Créer l'utilisateur
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = this.userRepo.create({
      id: uuidv4(),
      tenant_id: tenantId,
      email: data.email,
      password_hash: hashedPassword,
      role: data.role,
      display_name: data.displayName,
      first_name: data.firstName,
      last_name: data.lastName,
      is_active: true
    });

    return await this.userRepo.save(user);
  }

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(
    userId: string,
    data: {
      email?: string;
      role?: 'ADMIN' | 'DJ' | 'VIEWER';
      displayName?: string;
      firstName?: string;
      lastName?: string;
      isActive?: boolean;
    },
    updatedBy: TenantUser
  ): Promise<TenantUser> {
    const user = await this.userRepo.findOne({
      where: { id: userId, tenant_id: updatedBy.tenant_id }
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Vérifier les permissions
    if (!updatedBy.canManageUsers() && updatedBy.id !== userId) {
      throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    // Ne pas permettre de modifier le rôle OWNER
    if (user.role === 'OWNER' && data.role) {
      throw new Error("CANNOT_MODIFY_OWNER");
    }

    // Appliquer les modifications
    if (data.email) user.email = data.email;
    if (data.role && updatedBy.canManageUsers()) user.role = data.role;
    if (data.displayName !== undefined) user.display_name = data.displayName;
    if (data.firstName !== undefined) user.first_name = data.firstName;
    if (data.lastName !== undefined) user.last_name = data.lastName;
    if (data.isActive !== undefined && updatedBy.canManageUsers()) {
      user.is_active = data.isActive;
    }

    return await this.userRepo.save(user);
  }

  /**
   * Changer le mot de passe d'un utilisateur
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Vérifier le mot de passe actuel
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      throw new Error("INVALID_CURRENT_PASSWORD");
    }

    // Hacher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password_hash = hashedNewPassword;

    await this.userRepo.save(user);
  }

  /**
   * Supprimer un utilisateur
   */
  async deleteUser(userId: string, deletedBy: TenantUser): Promise<void> {
    if (!deletedBy.canManageUsers()) {
      throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    const user = await this.userRepo.findOne({
      where: { id: userId, tenant_id: deletedBy.tenant_id }
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Ne pas permettre de supprimer le propriétaire
    if (user.role === 'OWNER') {
      throw new Error("CANNOT_DELETE_OWNER");
    }

    await this.userRepo.remove(user);
  }

  /**
   * Récupérer tous les utilisateurs d'un tenant
   */
  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    return await this.userRepo.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'ASC' }
    });
  }

  /**
   * Récupérer un utilisateur par ID
   */
  async getUserById(userId: string, tenantId: string): Promise<TenantUser | null> {
    return await this.userRepo.findOne({
      where: { id: userId, tenant_id: tenantId },
      relations: ['tenant']
    });
  }

  /**
   * Générer un token d'accès
   */
  public generateAccessToken(user: TenantUser, tenant: Tenant): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 8) // 8 heures
    };

    return jwt.sign(payload, env.JWT_SECRET);
  }

  /**
   * Générer un token de rafraîchissement
   */
  private generateRefreshToken(user: TenantUser, tenant: Tenant): string {
    const payload = {
      userId: user.id,
      tenantId: tenant.id,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) // 30 jours
    };

    return jwt.sign(payload, env.JWT_SECRET);
  }

  /**
   * Générer un token pour l'accès à un événement spécifique
   */
  generateEventToken(
    user: TenantUser,
    tenant: Tenant,
    eventCode: string,
    sessionId?: string
  ): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
      email: user.email,
      eventCode,
      sessionId,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 12) // 12 heures
    };

    return jwt.sign(payload, env.JWT_SECRET);
  }

  /**
   * Générer un token super admin
   */
  generateSuperAdminToken(adminEmail: string): string {
    const payload = {
      email: adminEmail,
      isSuperAdmin: true,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 4) // 4 heures
    };

    return jwt.sign(payload, env.JWT_SECRET);
  }

  /**
   * Rafraîchir un token d'accès
   */
  async refreshToken(refreshTokenString: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshTokenString, env.JWT_SECRET) as any;

      if (decoded.type !== 'refresh') {
        throw new Error("INVALID_REFRESH_TOKEN");
      }

      // Récupérer l'utilisateur et le tenant
      const user = await this.userRepo.findOne({
        where: { id: decoded.userId, tenant_id: decoded.tenantId },
        relations: ['tenant']
      });

      if (!user || !user.is_active) {
        throw new Error("USER_NOT_FOUND");
      }

      if (!user.tenant.is_active) {
        throw new Error("TENANT_SUSPENDED");
      }

      // Générer de nouveaux tokens
      const newToken = this.generateAccessToken(user, user.tenant);
      const newRefreshToken = this.generateRefreshToken(user, user.tenant);

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error("INVALID_REFRESH_TOKEN");
    }
  }

  /**
   * Valider un token et retourner les informations utilisateur
   */
  async validateToken(token: string): Promise<TenantUser | null> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;

      if (decoded.isSuperAdmin) {
        return null; // Super admin n'est pas un utilisateur tenant
      }

      const user = await this.userRepo.findOne({
        where: { id: decoded.userId, tenant_id: decoded.tenantId },
        relations: ['tenant']
      });

      return user || null;
    } catch (error) {
      return null;
    }
  }
}