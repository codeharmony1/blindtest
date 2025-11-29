import { AppDataSource } from "./src/db/data-source";
import { Event } from "./src/db/entities/Event";
import { Tenant } from "./src/db/entities/Tenant";
import { cleanupExpiredEvents } from "./src/services/event-cleanup.service";

async function testCleanup() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connexion à la base de données établie\n");

    const eventRepo = AppDataSource.getRepository(Event);
    const tenantRepo = AppDataSource.getRepository(Tenant);

    // Trouver ou créer un tenant de test
    let tenant = await tenantRepo.findOne({
      where: { slug: "test-cleanup" },
    });

    if (!tenant) {
      tenant = tenantRepo.create({
        name: "Test Cleanup",
        slug: "test-cleanup",
        subscription_plan: "DEMO",
        subscription_status: "ACTIVE",
        billing_email: "test@cleanup.com",
        max_concurrent_events: 999,
        max_players_per_event: 999,
        is_active: true,
      });
      await tenantRepo.save(tenant);
    }

    console.log("=".repeat(60));
    console.log("TEST: Service de nettoyage des événements expirés");
    console.log("=".repeat(60));

    // Créer un événement expiré (ACTIVE mais code_expires_at passé)
    const now = new Date();
    const expiredEvent = new Event();
    expiredEvent.name = "Event to Cleanup";
    expiredEvent.code = "CLEANUP8";
    expiredEvent.game_mode = "TEAM";
    expiredEvent.tenant_id = tenant.id;
    expiredEvent.tenant = tenant;
    expiredEvent.status = "ACTIVE"; // Actif mais expiré
    expiredEvent.start_date = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    expiredEvent.end_date = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000);
    expiredEvent.code_expires_at = new Date(now.getTime() - 1000); // Expiré il y a 1 seconde

    await eventRepo.save(expiredEvent);
    console.log(`✅ Événement expiré créé: ${expiredEvent.code}`);
    console.log(`   Status: ${expiredEvent.status}`);
    console.log(`   code_expires_at: ${expiredEvent.code_expires_at?.toISOString()}`);

    // Créer un événement actif (non expiré)
    const activeEvent = new Event();
    activeEvent.name = "Active Event";
    activeEvent.code = "ACTIVE88";
    activeEvent.game_mode = "TEAM";
    activeEvent.tenant_id = tenant.id;
    activeEvent.tenant = tenant;
    activeEvent.status = "ACTIVE";
    activeEvent.start_date = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    activeEvent.end_date = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    activeEvent.code_expires_at = new Date(now.getTime() + 78 * 24 * 60 * 60 * 1000);

    await eventRepo.save(activeEvent);
    console.log(`✅ Événement actif créé: ${activeEvent.code}`);
    console.log(`   Status: ${activeEvent.status}`);
    console.log(`   code_expires_at: ${activeEvent.code_expires_at?.toISOString()}`);

    console.log("\n📋 Exécution du service de nettoyage...");
    const cleanedCount = await cleanupExpiredEvents();

    console.log(`\n✅ Nombre d'événements nettoyés: ${cleanedCount}`);

    // Vérifier que l'événement expiré a bien été marqué comme COMPLETED
    const expiredAfterCleanup = await eventRepo.findOne({
      where: { id: expiredEvent.id },
    });

    console.log("\n📊 Vérification de l'événement expiré:");
    console.log(`   Code: ${expiredAfterCleanup?.code}`);
    console.log(`   Status: ${expiredAfterCleanup?.status} (devrait être COMPLETED)`);
    console.log(`   completed_at: ${expiredAfterCleanup?.completed_at?.toISOString()}`);

    if (expiredAfterCleanup?.status !== "COMPLETED") {
      throw new Error("❌ L'événement expiré n'a pas été marqué comme COMPLETED");
    }

    if (!expiredAfterCleanup?.completed_at) {
      throw new Error("❌ completed_at devrait être défini");
    }

    // Vérifier que l'événement actif n'a PAS été touché
    const activeAfterCleanup = await eventRepo.findOne({
      where: { id: activeEvent.id },
    });

    console.log("\n📊 Vérification de l'événement actif:");
    console.log(`   Code: ${activeAfterCleanup?.code}`);
    console.log(`   Status: ${activeAfterCleanup?.status} (devrait rester ACTIVE)`);

    if (activeAfterCleanup?.status !== "ACTIVE") {
      throw new Error("❌ L'événement actif ne devrait pas avoir été modifié");
    }

    // Nettoyage
    console.log("\n🧹 Nettoyage...");
    await eventRepo.remove([expiredAfterCleanup!, activeAfterCleanup!]);

    await AppDataSource.destroy();

    console.log("\n" + "=".repeat(60));
    console.log("✅ TEST DU SERVICE DE NETTOYAGE RÉUSSI !");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ ERREUR:", error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

testCleanup();
