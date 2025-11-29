/**
 * Script pour lister tous les utilisateurs dans la base de données
 *
 * Usage:
 *   npx ts-node apps/api/list-all-users.ts
 */

import "reflect-metadata";
import { AppDataSource } from "./src/db/data-source";
import { TenantUser } from "./src/db/entities/TenantUser";
import { Organizer } from "./src/db/entities/Organizer";
import { Tenant } from "./src/db/entities/Tenant";

async function listAllUsers() {
  try {
    console.log("🔌 Connexion à la base de données...");
    await AppDataSource.initialize();
    console.log("✅ Connecté à la base de données\n");

    // Lister les Tenants
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const tenants = await tenantRepo.find();

    console.log("🏢 TENANTS:");
    console.log("=" .repeat(80));
    if (tenants.length === 0) {
      console.log("   Aucun tenant trouvé");
    } else {
      for (const tenant of tenants) {
        console.log(`   - ${tenant.name} (${tenant.slug})`);
        console.log(`     ID: ${tenant.id}`);
        console.log(`     Plan: ${tenant.subscription_plan}`);
        console.log(`     Statut: ${tenant.subscription_status}`);
        console.log("");
      }
    }

    // Lister les TenantUsers
    const tenantUserRepo = AppDataSource.getRepository(TenantUser);
    const tenantUsers = await tenantUserRepo.find({
      relations: ['tenant']
    });

    console.log("\n👥 TENANT USERS (Système Multi-Tenant):");
    console.log("=" .repeat(80));
    if (tenantUsers.length === 0) {
      console.log("   Aucun TenantUser trouvé");
    } else {
      for (const user of tenantUsers) {
        console.log(`   - ${user.email}`);
        console.log(`     ID: ${user.id}`);
        console.log(`     Tenant: ${user.tenant?.name || 'N/A'} (${user.tenant?.slug || 'N/A'})`);
        console.log(`     Rôle: ${user.role}`);
        console.log(`     Nom: ${user.getFullName()}`);
        console.log(`     Actif: ${user.is_active ? 'Oui' : 'Non'}`);
        console.log(`     Dernière connexion: ${user.last_login_at || 'Jamais'}`);
        console.log("");
      }
    }

    // Lister les Organizers
    const organizerRepo = AppDataSource.getRepository(Organizer);
    const organizers = await organizerRepo.find();

    console.log("\n👤 ORGANIZERS (Ancien Système):");
    console.log("=" .repeat(80));
    if (organizers.length === 0) {
      console.log("   Aucun Organizer trouvé");
    } else {
      for (const organizer of organizers) {
        console.log(`   - ${organizer.email}`);
        console.log(`     ID: ${organizer.id}`);
        console.log(`     Nom: ${organizer.display_name || 'N/A'}`);
        console.log(`     Créé le: ${organizer.created_at}`);
        console.log("");
      }
    }

    console.log("\n📊 RÉSUMÉ:");
    console.log("=" .repeat(80));
    console.log(`   Tenants: ${tenants.length}`);
    console.log(`   TenantUsers (nouveau système): ${tenantUsers.length}`);
    console.log(`   Organizers (ancien système): ${organizers.length}`);

    console.log("\n💡 NOTES:");
    console.log("   - Le frontend utilise le système TenantUser (/api/tenants/login)");
    console.log("   - Si vous ne pouvez pas vous connecter, assurez-vous d'avoir un compte TenantUser");
    console.log("   - Utilisez reset-user-password.ts pour réinitialiser un mot de passe");

  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

listAllUsers();
