import { AppDataSource } from "./src/db/data-source";
import { Tenant } from "./src/db/entities/Tenant";
import { TenantUser } from "./src/db/entities/TenantUser";
import * as bcrypt from "bcryptjs";

async function createTestTenantUser() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connected to database");

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const userRepo = AppDataSource.getRepository(TenantUser);

    // Créer ou récupérer le tenant "default"
    let tenant = await tenantRepo.findOne({
      where: { slug: "default" }
    });

    if (!tenant) {
      console.log("Creating default tenant...");
      tenant = tenantRepo.create({
        name: "Default Tenant",
        slug: "default",
        subscription_plan: "MONTHLY",
        subscription_status: "ACTIVE",
        billing_email: "admin@blindtest.local",
        max_concurrent_events: 999,
        max_players_per_event: 999,
        max_users: 999,
        is_active: true
      });
      await tenantRepo.save(tenant);
      console.log("✅ Default tenant created");
    } else {
      console.log("✅ Default tenant already exists");
    }

    // Créer ou mettre à jour l'utilisateur de test
    let user = await userRepo.findOne({
      where: { email: "test@blindtest.local" }
    });

    const hashedPassword = await bcrypt.hash("test123", 10);

    if (user) {
      console.log("⚠️  User test@blindtest.local already exists. Updating password...");
      user.password_hash = hashedPassword;
      await userRepo.save(user);
      console.log("✅ Password updated");
    } else {
      console.log("Creating new test user...");
      user = userRepo.create({
        email: "test@blindtest.local",
        password_hash: hashedPassword,
        display_name: "Test Admin",
        first_name: "Test",
        last_name: "Admin",
        role: "OWNER",
        tenant_id: tenant.id,
        is_active: true
      });
      await userRepo.save(user);
      console.log("✅ User created");
    }

    console.log("\n📋 Credentials:");
    console.log("   Email: test@blindtest.local");
    console.log("   Password: test123");
    console.log("   Tenant: default");
    console.log("\n🌐 Login URL: http://localhost:4200");

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createTestTenantUser();
