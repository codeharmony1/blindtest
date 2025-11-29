import { AppDataSource } from "./src/db/data-source";
import { Organizer } from "./src/db/entities/Organizer";
import * as jwt from "jsonwebtoken";

async function testDashboard() {
  console.log("🔄 Connexion à la base de données...");
  await AppDataSource.initialize();
  console.log("✅ Connecté");

  try {
    // Récupérer un organisateur existant
    const organizerRepo = AppDataSource.getRepository(Organizer);
    const organizer = await organizerRepo.findOne({ where: {} });

    if (!organizer) {
      console.log("❌ Aucun organisateur trouvé");
      return;
    }

    console.log(`✅ Organisateur trouvé: ${organizer.email} (ID: ${organizer.id})`);

    // Générer un token JWT
    const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-change-me";
    const token = jwt.sign(
      {
        organizerId: organizer.id,
        email: organizer.email,
        type: "staff",
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log(`🔑 Token JWT généré: ${token.substring(0, 50)}...`);

    console.log("\n🧪 Utiliser ce token dans les tests curl:");
    console.log(`\ncurl -H "Authorization: Bearer ${token}" http://localhost:3001/api/dashboard/stats`);
    console.log(`\ncurl -H "Authorization: Bearer ${token}" http://localhost:3001/api/events`);
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

testDashboard()
  .then(() => {
    console.log("\n✅ Tests terminés");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });
