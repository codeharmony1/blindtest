import { AppDataSource } from "./src/db/data-source";
import { SuperAdminService } from "./src/services/super-admin.service";

async function createSuperAdmin() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connected to database");

    const service = new SuperAdminService();

    // Créer un super-admin avec des credentials connus
    const email = "superadmin@blindtest.fr";
    const password = "SuperAdmin2025!";

    try {
      const admin = await service.createSuperAdmin({
        email,
        password,
        name: "Super Administrateur"
      });

      console.log("\n✅ Super-admin créé avec succès:");
      console.log(`   Email: ${admin.email}`);
      console.log(`   Mot de passe: ${password}`);
      console.log(`   Nom: ${admin.name}`);
    } catch (error: any) {
      if (error.message === "EMAIL_ALREADY_EXISTS") {
        console.log(`\n⚠️  Un super-admin avec l'email ${email} existe déjà`);
        console.log("   Vous pouvez utiliser cet email pour vous connecter");
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

createSuperAdmin();
