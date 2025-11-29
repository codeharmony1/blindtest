import { AppDataSource } from "./src/db/data-source";
import { Organizer } from "./src/db/entities/Organizer";
import * as bcrypt from "bcryptjs";

async function createTestAdmin() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connected to database");

    const organizerRepo = AppDataSource.getRepository(Organizer);

    // Check if test admin exists
    let admin = await organizerRepo.findOne({
      where: { email: "test@blindtest.local" }
    });

    if (admin) {
      console.log("⚠️  Admin test@blindtest.local existe déjà. Mise à jour du mot de passe...");

      // Update password
      const hashedPassword = await bcrypt.hash("test123", 10);
      admin.password_hash = hashedPassword;
      await organizerRepo.save(admin);

      console.log("✅ Mot de passe mis à jour");
    } else {
      console.log("Creating new test admin...");

      const hashedPassword = await bcrypt.hash("test123", 10);

      admin = organizerRepo.create({
        email: "test@blindtest.local",
        password_hash: hashedPassword,
        display_name: "Test Admin"
      });

      await organizerRepo.save(admin);
      console.log("✅ Admin créé");
    }

    console.log("\n📋 Credentials:");
    console.log("   Email: test@blindtest.local");
    console.log("   Password: test123");

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createTestAdmin();
