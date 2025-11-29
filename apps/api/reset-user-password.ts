/**
 * Script pour réinitialiser le mot de passe d'un utilisateur TenantUser
 *
 * Usage:
 *   npx ts-node apps/api/reset-user-password.ts <email> <nouveau-mot-de-passe>
 *
 * Exemple:
 *   npx ts-node apps/api/reset-user-password.ts admin@example.com MonNouveauPassword123
 */

import "reflect-metadata";
import { AppDataSource } from "./src/db/data-source";
import { TenantUser } from "./src/db/entities/TenantUser";
import { Organizer } from "./src/db/entities/Organizer";
import bcrypt from "bcryptjs";

async function resetUserPassword(email: string, newPassword: string) {
  try {
    console.log("🔌 Connexion à la base de données...");
    await AppDataSource.initialize();
    console.log("✅ Connecté à la base de données\n");

    // Chercher dans TenantUser
    const tenantUserRepo = AppDataSource.getRepository(TenantUser);
    const tenantUsers = await tenantUserRepo.find({
      where: { email },
      relations: ['tenant']
    });

    // Chercher dans Organizer
    const organizerRepo = AppDataSource.getRepository(Organizer);
    const organizers = await organizerRepo.find({
      where: { email }
    });

    console.log(`📧 Recherche pour l'email: ${email}`);
    console.log(`   - TenantUser trouvés: ${tenantUsers.length}`);
    console.log(`   - Organizers trouvés: ${organizers.length}\n`);

    if (tenantUsers.length === 0 && organizers.length === 0) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email ${email}`);
      console.log("\n💡 Vérifiez l'orthographe de l'email ou listez les utilisateurs disponibles.");
      process.exit(1);
    }

    // Valider le mot de passe
    if (newPassword.length < 8) {
      console.error("❌ Le mot de passe doit contenir au moins 8 caractères");
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Réinitialiser TenantUser
    if (tenantUsers.length > 0) {
      console.log("🔐 Réinitialisation dans TenantUser:");
      for (const user of tenantUsers) {
        user.password_hash = hashedPassword;
        await tenantUserRepo.save(user);
        console.log(`   ✅ Tenant: ${user.tenant.name} (${user.tenant.slug})`);
        console.log(`      - Email: ${user.email}`);
        console.log(`      - Rôle: ${user.role}`);
        console.log(`      - Nom: ${user.getFullName()}`);
      }
    }

    // Réinitialiser Organizer
    if (organizers.length > 0) {
      console.log("\n🔐 Réinitialisation dans Organizer:");
      for (const organizer of organizers) {
        organizer.password_hash = hashedPassword;
        await organizerRepo.save(organizer);
        console.log(`   ✅ ID: ${organizer.id}`);
        console.log(`      - Email: ${organizer.email}`);
        console.log(`      - Nom: ${organizer.display_name || 'N/A'}`);
      }
    }

    console.log("\n✅ Mot de passe réinitialisé avec succès !");
    console.log(`\n📝 Informations de connexion:`);
    console.log(`   - Email: ${email}`);
    console.log(`   - Mot de passe: ${newPassword}`);

    if (tenantUsers.length > 0) {
      console.log(`   - Tenant slug: ${tenantUsers[0].tenant.slug}`);
      console.log(`\n🌐 Connexion:`);
      console.log(`   URL: https://blindtest.codeharmony.fr/auth/login`);
      console.log(`   Le système utilisera automatiquement le tenant 'default'`);
    }

  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

// Récupérer les arguments de ligne de commande
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.log("Usage: npx ts-node apps/api/reset-user-password.ts <email> <nouveau-mot-de-passe>");
  console.log("\nExemple:");
  console.log("  npx ts-node apps/api/reset-user-password.ts admin@example.com MonNouveauPassword123");
  process.exit(1);
}

const [email, newPassword] = args;

resetUserPassword(email, newPassword);
