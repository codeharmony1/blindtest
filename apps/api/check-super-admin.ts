import { AppDataSource } from "./src/db/data-source";
import { SuperAdmin } from "./src/db/entities/SuperAdmin";
import { SuperAdminService } from "./src/services/super-admin.service";

async function checkSuperAdmin() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connected to database");

    const adminRepo = AppDataSource.getRepository(SuperAdmin);
    const admins = await adminRepo.find();

    console.log(`\n📊 Super-admins existants: ${admins.length}`);

    if (admins.length > 0) {
      admins.forEach((admin) => {
        console.log(`  - ${admin.email} (${admin.name || 'Sans nom'})`);
      });
    } else {
      console.log("\n⚠️  Aucun super-admin trouvé. Création d'un super-admin par défaut...");

      const service = new SuperAdminService();
      const newAdmin = await service.createSuperAdmin({
        email: "admin@blindtest.fr",
        password: "Admin123!",
        name: "Super Admin"
      });

      console.log(`✅ Super-admin créé: ${newAdmin.email}`);
      console.log(`   Mot de passe: Admin123!`);
    }

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkSuperAdmin();
