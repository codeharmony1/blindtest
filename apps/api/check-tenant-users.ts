import { AppDataSource } from "./src/db/data-source";
import { Tenant } from "./src/db/entities/Tenant";
import { TenantUser } from "./src/db/entities/TenantUser";
import * as bcrypt from "bcryptjs";

async function checkTenantUsers() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connected to database");

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const userRepo = AppDataSource.getRepository(TenantUser);

    // Chercher le tenant default
    const defaultTenant = await tenantRepo.findOne({ where: { slug: "default" } });

    if (!defaultTenant) {
      console.log("❌ Tenant 'default' introuvable");
      process.exit(1);
    }

    console.log(`\n✅ Tenant 'default' trouvé (ID: ${defaultTenant.id})`);

    // Lister tous les utilisateurs de ce tenant
    const users = await userRepo.find({ where: { tenant_id: defaultTenant.id } });

    console.log(`\n📋 Utilisateurs du tenant (${users.length}):`);
    for (const user of users) {
      console.log(`\n  - Email: ${user.email}`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Name: ${user.first_name} ${user.last_name}`);
      console.log(`    ID: ${user.id}`);
    }

    // Si aucun utilisateur, en créer un
    if (users.length === 0) {
      console.log("\n⚠️  Aucun utilisateur trouvé. Création de l'administrateur...");

      const hashedPassword = await bcrypt.hash("admin123456", 10);

      const newUser = userRepo.create({
        tenant_id: defaultTenant.id,
        email: "admin@blindtest.local",
        password_hash: hashedPassword,
        role: "OWNER",
        first_name: "Admin",
        last_name: "Default",
        display_name: "Administrator"
      });

      await userRepo.save(newUser);
      console.log("✅ Utilisateur créé avec succès!");
    } else {
      // Mettre à jour le mot de passe du premier utilisateur
      const firstUser = users[0];
      console.log(`\n🔧 Mise à jour du mot de passe pour ${firstUser.email}...`);

      const hashedPassword = await bcrypt.hash("admin123456", 10);
      firstUser.password_hash = hashedPassword;
      await userRepo.save(firstUser);

      console.log("✅ Mot de passe mis à jour!");
    }

    console.log("\n📋 Credentials finaux:");
    console.log("   Tenant Slug: default");
    console.log("   Email: admin@blindtest.local");
    console.log("   Password: admin123456");

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

checkTenantUsers();
