import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { AppDataSource } from "../../db/data-source";
import { TenantUser } from "../../db/entities/TenantUser";
import { PasswordResetToken } from "../../db/entities/PasswordResetToken";
import { emailService } from "../../services/email.service";
import { authRateLimit } from "../../middlewares/rate-limit";

const router = Router();

// Appliquer rate limiting strictement sur reset password
router.use(authRateLimit);

/**
 * POST /api/auth/forgot-password
 * Demande de réinitialisation de mot de passe
 *
 * IMPORTANT: Utilise uniquement TenantUser (système multi-tenant unifié)
 */
router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body ?? {};

    if (!email) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Email required" }
      });
    }

    const userRepo = AppDataSource.getRepository(TenantUser);
    const tokenRepo = AppDataSource.getRepository(PasswordResetToken);

    // Chercher l'utilisateur dans TenantUser
    // Note: Un email peut exister dans plusieurs tenants
    const tenantUsers = await userRepo.find({
      where: { email },
      relations: ['tenant']
    });

    // Pour des raisons de sécurité, on renvoie toujours la même réponse
    // même si l'email n'existe pas (évite l'énumération d'utilisateurs)
    if (tenantUsers.length === 0) {
      return res.json({
        success: true,
        message: "Si cet email existe, un lien de réinitialisation a été envoyé."
      });
    }

    // Si l'utilisateur existe dans plusieurs tenants, on envoie un seul email
    // et le token sera valide pour tous ses comptes
    const firstUser = tenantUsers[0];
    const displayName = firstUser.getFullName();

    // Générer un token unique
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Valide 1 heure

    // Invalider les anciens tokens non utilisés de cet email
    await tokenRepo
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({ used: true, used_at: new Date() })
      .where("email = :email", { email })
      .andWhere("used = :used", { used: false })
      .execute();

    // Créer le nouveau token
    const resetToken = tokenRepo.create({
      id: uuidv4(),
      email,
      token,
      expires_at: expiresAt,
      used: false
    });

    await tokenRepo.save(resetToken);

    // Envoyer l'email
    try {
      await emailService.sendPasswordResetEmail(email, token, displayName);
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      // En production, on pourrait vouloir rollback le token ici
      // Mais pour éviter de révéler l'erreur à l'utilisateur, on continue
    }

    return res.json({
      success: true,
      message: "Si cet email existe, un lien de réinitialisation a été envoyé."
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" }
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Réinitialisation effective du mot de passe avec token
 *
 * IMPORTANT: Réinitialise le mot de passe pour TOUS les comptes TenantUser avec cet email
 */
router.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body ?? {};

    if (!token || !newPassword) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Token and new password required" }
      });
    }

    // Valider la force du mot de passe
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: { code: "WEAK_PASSWORD", message: "Password must be at least 8 characters" }
      });
    }

    const tokenRepo = AppDataSource.getRepository(PasswordResetToken);
    const userRepo = AppDataSource.getRepository(TenantUser);

    // Récupérer le token
    const resetToken = await tokenRepo.findOne({ where: { token } });

    if (!resetToken) {
      return res.status(400).json({
        error: { code: "INVALID_TOKEN", message: "Invalid or expired token" }
      });
    }

    // Vérifier validité
    if (!resetToken.isValid()) {
      return res.status(400).json({
        error: {
          code: resetToken.used ? "TOKEN_ALREADY_USED" : "TOKEN_EXPIRED",
          message: "Invalid or expired token"
        }
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe pour TOUS les TenantUser avec cet email
    // (Un utilisateur peut avoir le même email dans plusieurs tenants)
    const tenantUsers = await userRepo.find({
      where: { email: resetToken.email }
    });

    if (tenantUsers.length === 0) {
      return res.status(404).json({
        error: { code: "USER_NOT_FOUND", message: "User not found" }
      });
    }

    // Réinitialiser le mot de passe pour tous les comptes
    for (const user of tenantUsers) {
      user.password_hash = hashedPassword;
      await userRepo.save(user);
    }

    // Marquer le token comme utilisé
    resetToken.markAsUsed();
    await tokenRepo.save(resetToken);

    console.log(`✅ Password reset successful for ${tenantUsers.length} account(s) with email ${resetToken.email}`);

    return res.json({
      success: true,
      message: "Password reset successful"
    });

  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" }
    });
  }
});

/**
 * GET /api/auth/verify-reset-token/:token
 * Vérifier si un token est valide (sans le consommer)
 */
router.get("/auth/verify-reset-token/:token", async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Token required" }
      });
    }

    const tokenRepo = AppDataSource.getRepository(PasswordResetToken);
    const resetToken = await tokenRepo.findOne({ where: { token } });

    if (!resetToken || !resetToken.isValid()) {
      return res.status(400).json({
        valid: false,
        error: { code: "INVALID_TOKEN", message: "Invalid or expired token" }
      });
    }

    return res.json({
      valid: true,
      email: resetToken.email,
      expiresAt: resetToken.expires_at
    });

  } catch (error) {
    console.error("Verify token error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Internal server error" }
    });
  }
});

export default router;
