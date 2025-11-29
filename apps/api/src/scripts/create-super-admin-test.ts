/**
 * Script pour créer un super-administrateur de test
 * Usage: npm run create:super-admin:test
 */

import "reflect-metadata";
import { AppDataSource } from "../db/data-source";
import { SuperAdminService } from "../services/super-admin.service";

async function createTestSuperAdmin() {
  try {
    console.log("==============================================");
    console.log("  Création d'un Super-Admin de TEST");
    console.log("==============================================\n");

    // Initialiser la connexion DB
    await AppDataSource.initialize();
    console.log("✅ Connexion à la base de données établie\n");

    const service = new SuperAdminService();

    // Données de test
    const testData = {
      email: "admin@blindtest.local",
      password: "SuperAdmin123!",
      name: "Super Admin Test",
    };

    console.log("📝 Données du super-admin de test:");
    console.log(`   Email: ${testData.email}`);
    console.log(`   Password: ${testData.password}`);
    console.log(`   Name: ${testData.name}\n`);

    console.log("⏳ Création du super-admin...");

    // Créer le super-admin
    const admin = await service.createSuperAdmin(testData);

    console.log("\n✅ Super-admin de test créé avec succès !");
    console.log("==============================================");
    console.log(`ID: ${admin.id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Nom: ${admin.name}`);
    console.log(`Actif: ${admin.is_active ? "Oui" : "Non"}`);
    console.log(`Créé le: ${admin.created_at}`);
    console.log("==============================================");
    console.log("\n🔐 Connexion:");
    console.log(`   URL: http://localhost:3000/api/backstage/auth/login`);
    console.log(`   Email: ${testData.email}`);
    console.log(`   Password: ${testData.password}`);
    console.log("\n");

  } catch (error: any) {
    console.error("\n❌ Erreur:", error.message);

    if (error.message === "EMAIL_ALREADY_EXISTS") {
      console.log("\n✅ Un super-admin avec cet email existe déjà.");
      console.log("   Vous pouvez vous connecter avec:");
      console.log(`   Email: admin@blindtest.local`);
      console.log(`   Password: SuperAdmin123!`);
    }
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

// Exécuter le script
createTestSuperAdmin();
