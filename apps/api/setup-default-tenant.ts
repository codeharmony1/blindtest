import { AppDataSource } from "./src/db/data-source";
import { TenantService } from "./src/services/tenant.service";

async function setupDefaultTenant() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connected to database");

    const tenantService = new TenantService();

    // Créer le tenant par défaut
    const result = await tenantService.createTenant({
      name: "Default Company",
      slug: "default",
      ownerEmail: "admin@blindtest.local",
      ownerPassword: "admin123456",
      ownerName: "Administrator",
      plan: "DEMO"
    });

    console.log("\n✅ Tenant créé avec succès!");
    console.log("\n📋 Informations de connexion:");
    console.log(`   Tenant Slug: default`);
    console.log(`   Email: admin@blindtest.local`);
    console.log(`   Password: admin123456`);
    console.log(`\n🌐 URL: http://localhost:4200/auth/login`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    if (error.message === "SLUG_ALREADY_EXISTS") {
      console.log("✅ Le tenant 'default' existe déjà");
      console.log("\n📋 Utilisez ces credentials:");
      console.log(`   Tenant Slug: default`);
      console.log(`   Email: admin@blindtest.local`);
      console.log(`   Password: admin123456`);
    } else {
      console.error("❌ Error:", error);
    }
    await AppDataSource.destroy();
    process.exit(error.message === "SLUG_ALREADY_EXISTS" ? 0 : 1);
  }
}

setupDefaultTenant();
