import { AppDataSource } from "./db/data-source";
import { Organizer } from "./db/entities/Organizer";
import bcrypt from "bcryptjs";

async function createTestOrganizer() {
  try {
    console.log("🔗 Connecting to database...");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const organizerRepo = AppDataSource.getRepository(Organizer);

    // Check if test organizer already exists
    const existing = await organizerRepo.findOne({
      where: { email: "test@blindtest.com" }
    });

    if (existing) {
      console.log("✅ Test organizer already exists:", existing.id);
      return existing.id;
    }

    // Create new test organizer
    const hashedPassword = await bcrypt.hash("testpassword123", 12);

    const organizer = organizerRepo.create({
      email: "test@blindtest.com",
      password_hash: hashedPassword,
      display_name: "Test Organizer"
    });

    const saved = await organizerRepo.save(organizer);
    console.log("✅ Created test organizer with ID:", saved.id);

    return saved.id;
  } catch (error) {
    console.error("❌ Error creating test organizer:", error);
    throw error;
  }
}

if (require.main === module) {
  createTestOrganizer()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { createTestOrganizer };