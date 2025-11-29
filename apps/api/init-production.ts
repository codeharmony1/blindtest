/**
 * Script d'initialisation de la production
 *
 * Ce script crée :
 * - Le tenant par défaut 'default'
 * - Un compte administrateur avec les identifiants fournis
 *
 * Usage:
 *   npx ts-node apps/api/init-production.ts <admin-email> <admin-password> [admin-name]
 *
 * Exemple:
 *   npx ts-node apps/api/init-production.ts admin@blindtest.fr MySecureP@ssw0rd "John Doe"
 */

import "reflect-metadata";
import { AppDataSource } from "./src/db/data-source";
import { Tenant } from "./src/db/entities/Tenant";
import { TenantUser } from "./src/db/entities/TenantUser";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function initProduction(email: string, password: string, displayName?: string) {
  try {
    console.log("🔌 Connexion à la base de données...");
    await AppDataSource.initialize();
    console.log("✅ Connecté à la base de données\n");

    // Valider le mot de passe
    if (password.length < 8) {
      console.error("❌ Le mot de passe doit contenir au moins 8 caractères");
      process.exit(1);
    }

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("❌ Format d'email invalide");
      process.exit(1);
    }

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const userRepo = AppDataSource.getRepository(TenantUser);

    // 1. Créer ou récupérer le tenant 'default'
    let tenant = await tenantRepo.findOne({ where: { slug: 'default' } });

    if (!tenant) {
      console.log("📦 Création du tenant 'default'...");
      tenant = tenantRepo.create({
        id: uuidv4(),
        name: "Blind Test Musical",
        slug: "default",
        subscription_plan: "PRO",
        subscription_status: "active",
        subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
        max_concurrent_events: 999,
        max_players_per_event: 999,
        max_users: 10,
        created_at: new Date(),
        updated_at: new Date()
      });
      await tenantRepo.save(tenant);
      console.log("✅ Tenant 'default' créé");
    } else {
      console.log("✅ Tenant 'default' existe déjà");
    }

    // 2. Vérifier si l'utilisateur existe déjà
    const existingUser = await userRepo.findOne({
      where: { email, tenant_id: tenant.id }
    });

    if (existingUser) {
      console.log(`\n⚠️  L'utilisateur ${email} existe déjà dans le tenant 'default'`);
      console.log("   Voulez-vous réinitialiser son mot de passe ? (Ctrl+C pour annuler)\n");

      // Attendre 3 secondes
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Réinitialiser le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
      existingUser.password_hash = hashedPassword;
      if (displayName) {
        existingUser.display_name = displayName;
      }
      await userRepo.save(existingUser);

      console.log("✅ Mot de passe réinitialisé avec succès");
    } else {
      console.log(`\n👤 Création de l'administrateur ${email}...`);

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = userRepo.create({
        id: uuidv4(),
        tenant_id: tenant.id,
        email,
        password_hash: hashedPassword,
        role: "OWNER",
        display_name: displayName || email.split('@')[0],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      await userRepo.save(user);
      console.log("✅ Administrateur créé avec succès");
    }

    // 3. Afficher le résumé
    console.log("\n" + "=".repeat(80));
    console.log("✅ INITIALISATION PRODUCTION TERMINÉE");
    console.log("=".repeat(80));
    console.log("\n📋 Informations de connexion:");
    console.log(`   URL: ${process.env.APP_BASE_URL || 'https://blindtest.codeharmony.fr'}/auth/login`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Tenant: default`);
    console.log(`\n📦 Tenant:");
    console.log(`   Nom: ${tenant.name}`);
    console.log(`   Slug: ${tenant.slug}`);
    console.log(`   Plan: ${tenant.subscription_plan}`);
    console.log(`   Statut: ${tenant.subscription_status}`);
    console.log(`   Expire le: ${tenant.subscription_expires_at?.toISOString().split('T')[0]}`);

    console.log("\n💡 Prochaines étapes:");
    console.log("   1. Connectez-vous à l'interface admin");
    console.log("   2. Créez votre premier événement");
    console.log("   3. Ajoutez vos chansons");
    console.log("   4. Partagez le code événement avec vos joueurs");

    console.log("\n🔒 Sécurité:");
    console.log("   - Changez le mot de passe après la première connexion");
    console.log("   - Ne partagez jamais vos identifiants");
    console.log("   - Utilisez un mot de passe fort (min 12 caractères recommandés)");

  } catch (error) {
    console.error("\n❌ Erreur:", error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

// Récupérer les arguments
const args = process.argv.slice(2);

if (args.length < 2 || args.length > 3) {
  console.log("❌ Usage incorrect\n");
  console.log("Usage: npx ts-node apps/api/init-production.ts <admin-email> <admin-password> [admin-name]");
  console.log("\nExemples:");
  console.log("  npx ts-node apps/api/init-production.ts admin@blindtest.fr MySecureP@ssw0rd");
  console.log('  npx ts-node apps/api/init-production.ts admin@blindtest.fr MySecureP@ssw0rd "John Doe"');
  console.log("\n⚠️  Assurez-vous d'utiliser un mot de passe fort (min 8 caractères, 12 recommandés)");
  process.exit(1);
}

const [email, password, displayName] = args;

initProduction(email, password, displayName);
