import { AppDataSource } from "./src/db/data-source";
import { SuperAdminService } from "./src/services/super-admin.service";

async function createAdminForTests() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connected to database");

    const service = new SuperAdminService();

    // Créer un super-admin avec les credentials attendus par le script de test
    const email = "admin@blindtest.local";
    const password = "admin123456";

    try {
      const admin = await service.createSuperAdmin({
        email,
        password,
        name: "Admin Test"
      });

      console.log("\n✅ Super-admin créé pour les tests:");
      console.log(`   Email: ${admin.email}`);
      console.log(`   Mot de passe: ${password}`);
      console.log(`   Nom: ${admin.name}`);
    } catch (error: any) {
      if (error.message === "EMAIL_ALREADY_EXISTS") {
        console.log(`\n⚠️  Super-admin ${email} existe déjà`);
        console.log("   Credentials: admin@blindtest.local / admin123456");
      } else {
        throw error;
      }
    }

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createAdminForTests();
