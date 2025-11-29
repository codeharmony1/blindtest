import { AppDataSource } from "./src/db/data-source";
import { SuperAdmin } from "./src/db/entities/SuperAdmin";
import bcrypt from "bcryptjs";

async function checkPassword() {
  try {
    await AppDataSource.initialize();

    const adminRepo = AppDataSource.getRepository(SuperAdmin);
    const admin = await adminRepo.findOne({
      where: { email: "admin@blindtest.local" }
    });

    if (!admin) {
      console.log("❌ Super-admin non trouvé");
      await AppDataSource.destroy();
      process.exit(1);
    }

    console.log(`✅ Super-admin trouvé: ${admin.email}`);
    console.log(`   Nom: ${admin.name}`);
    console.log(`   Hash du mot de passe: ${admin.password_hash.substring(0, 30)}...`);

    // Tester avec différents mots de passe
    const testPasswords = [
      "admin123456",
      "Admin123!",
      "admin",
      "password"
    ];

    console.log("\n🔐 Test de mots de passe:");
    for (const pwd of testPasswords) {
      const isValid = await bcrypt.compare(pwd, admin.password_hash);
      console.log(`   ${pwd}: ${isValid ? '✅' : '❌'}`);
    }

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkPassword();
