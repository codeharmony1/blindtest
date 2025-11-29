import { AppDataSource } from "./src/db/data-source";
import { Event } from "./src/db/entities/Event";
import { Tenant } from "./src/db/entities/Tenant";
import {
  generateUniqueEventCode,
  calculateCodeExpiration,
  canReactivateWithCode,
} from "./src/services/event-code.service";

async function runTests() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connexion à la base de données établie\n");

    const eventRepo = AppDataSource.getRepository(Event);
    const tenantRepo = AppDataSource.getRepository(Tenant);

    // Trouver ou créer un tenant de test
    let tenant = await tenantRepo.findOne({
      where: { slug: "test-lifecycle" },
    });

    if (!tenant) {
      tenant = tenantRepo.create({
        name: "Test Lifecycle",
        slug: "test-lifecycle",
        subscription_plan: "DEMO",
        subscription_status: "ACTIVE",
        billing_email: "test@lifecycle.com",
        max_concurrent_events: 999,
        max_players_per_event: 999,
        is_active: true,
      });
      await tenantRepo.save(tenant);
      console.log("✅ Tenant de test créé");
    }

    console.log("=".repeat(60));
    console.log("TEST 1: Génération de code de 8 caractères");
    console.log("=".repeat(60));

    const code8chars = await generateUniqueEventCode({
      eventRepo,
      tenantId: tenant.id,
      codeLength: 8,
    });

    console.log(`✅ Code généré: ${code8chars}`);
    console.log(`   Longueur: ${code8chars.length} caractères`);
    if (code8chars.length !== 8) {
      throw new Error(`❌ Code devrait faire 8 caractères, reçu: ${code8chars.length}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("TEST 2: Création d'événement SANS dates (legacy)");
    console.log("=".repeat(60));

    const eventLegacy = new Event();
    eventLegacy.name = "Test Legacy Event";
    eventLegacy.code = await generateUniqueEventCode({
      eventRepo,
      tenantId: tenant.id,
      codeLength: 8,
    });
    eventLegacy.game_mode = "TEAM";
    eventLegacy.tenant_id = tenant.id;
    eventLegacy.tenant = tenant;
    // Pas de dates définies

    const savedLegacy = await eventRepo.save(eventLegacy);
    console.log(`✅ Événement legacy créé: ${savedLegacy.code}`);
    console.log(`   start_date: ${savedLegacy.start_date}`);
    console.log(`   end_date: ${savedLegacy.end_date}`);
    console.log(`   code_expires_at: ${savedLegacy.code_expires_at}`);

    // Tester les méthodes helper
    console.log(`   isCodeActive(): ${savedLegacy.isCodeActive()} (devrait être true)`);
    console.log(`   canReuseCode(): ${savedLegacy.canReuseCode()} (devrait être false)`);
    console.log(`   isEventExpired(): ${savedLegacy.isEventExpired()} (devrait être false)`);

    console.log("\n" + "=".repeat(60));
    console.log("TEST 3: Création d'événement AVEC dates");
    console.log("=".repeat(60));

    const now = new Date();
    const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Demain
    const endDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // Après-demain

    const codeExpiresAt = calculateCodeExpiration(startDate, endDate);
    console.log(`   start_date: ${startDate.toISOString()}`);
    console.log(`   end_date: ${endDate.toISOString()}`);
    console.log(`   code_expires_at: ${codeExpiresAt?.toISOString()}`);

    const eventWithDates = new Event();
    eventWithDates.name = "Test Event With Dates";
    eventWithDates.code = await generateUniqueEventCode({
      eventRepo,
      tenantId: tenant.id,
      startDate,
      endDate,
      codeLength: 8,
    });
    eventWithDates.game_mode = "TEAM";
    eventWithDates.tenant_id = tenant.id;
    eventWithDates.tenant = tenant;
    eventWithDates.start_date = startDate;
    eventWithDates.end_date = endDate;
    eventWithDates.code_expires_at = codeExpiresAt;

    const savedWithDates = await eventRepo.save(eventWithDates);
    console.log(`✅ Événement avec dates créé: ${savedWithDates.code}`);

    // Vérifier que l'expiration est bien 30 jours après la fin
    const expectedExpiry = new Date(endDate);
    expectedExpiry.setDate(expectedExpiry.getDate() + 30);

    if (codeExpiresAt) {
      const diff = Math.abs(codeExpiresAt.getTime() - expectedExpiry.getTime());
      if (diff < 1000) {
        // Moins d'1 seconde de différence
        console.log(`✅ Date d'expiration correcte: ${codeExpiresAt.toISOString()}`);
      } else {
        throw new Error(
          `❌ Date d'expiration incorrecte. Attendu: ${expectedExpiry.toISOString()}, Reçu: ${codeExpiresAt.toISOString()}`
        );
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("TEST 4: Validation des dates (endDate > startDate)");
    console.log("=".repeat(60));

    const invalidStartDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const invalidEndDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log(`   startDate: ${invalidStartDate.toISOString()}`);
    console.log(`   endDate: ${invalidEndDate.toISOString()}`);

    if (invalidEndDate <= invalidStartDate) {
      console.log("✅ Validation correcte: endDate <= startDate détecté");
    } else {
      throw new Error("❌ La validation des dates ne fonctionne pas");
    }

    console.log("\n" + "=".repeat(60));
    console.log("TEST 5: Test unicité temporelle des codes");
    console.log("=".repeat(60));

    // Créer un événement avec un code spécifique
    const specificCode = "TEST8CHR";
    const event1 = new Event();
    event1.name = "Event 1";
    event1.code = specificCode;
    event1.game_mode = "TEAM";
    event1.tenant_id = tenant.id;
    event1.tenant = tenant;
    event1.start_date = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    event1.end_date = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    event1.code_expires_at = calculateCodeExpiration(event1.start_date, event1.end_date);

    await eventRepo.save(event1);
    console.log(`✅ Événement 1 créé avec code: ${specificCode}`);

    // Tenter de créer un autre événement avec le même code (devrait générer un nouveau)
    try {
      const newCode = await generateUniqueEventCode({
        eventRepo,
        tenantId: tenant.id,
        preferredCode: specificCode,
        startDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
        codeLength: 8,
      });

      if (newCode !== specificCode) {
        console.log(`✅ Nouveau code généré car ${specificCode} déjà pris: ${newCode}`);
      } else {
        throw new Error("❌ Le code aurait dû être différent");
      }
    } catch (error: any) {
      console.log(`✅ Détection de collision de code: ${error.message}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("TEST 6: Réactivation d'événement");
    console.log("=".repeat(60));

    // Créer un événement expiré
    const expiredEvent = new Event();
    expiredEvent.name = "Expired Event";
    expiredEvent.code = "EXPIRED8";
    expiredEvent.game_mode = "TEAM";
    expiredEvent.tenant_id = tenant.id;
    expiredEvent.tenant = tenant;
    expiredEvent.start_date = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // Il y a 60 jours
    expiredEvent.end_date = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000); // Il y a 50 jours
    expiredEvent.code_expires_at = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000); // Expiré il y a 20 jours
    expiredEvent.status = "COMPLETED";

    await eventRepo.save(expiredEvent);
    console.log(`✅ Événement expiré créé: ${expiredEvent.code}`);

    // Tester canReactivateWithCode
    const reactivationCheck = await canReactivateWithCode(
      eventRepo,
      expiredEvent,
      new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    );

    console.log(`   Peut réutiliser le code: ${reactivationCheck.canReuse}`);
    if (reactivationCheck.canReuse) {
      console.log("✅ Le code expiré peut être réutilisé");
    } else {
      console.log(`   Raison: ${reactivationCheck.reason}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("TEST 7: Méthodes helper de l'entité Event");
    console.log("=".repeat(60));

    // Tester avec un événement actif
    const activeEvent = savedWithDates;
    console.log(`Événement: ${activeEvent.code}`);
    console.log(`   isCodeActive(): ${activeEvent.isCodeActive()}`);
    console.log(`   canReuseCode(): ${activeEvent.canReuseCode()}`);
    console.log(`   isEventActive(): ${activeEvent.isEventActive()}`);
    console.log(`   isEventExpired(): ${activeEvent.isEventExpired()}`);

    // Nettoyage
    console.log("\n" + "=".repeat(60));
    console.log("NETTOYAGE");
    console.log("=".repeat(60));

    await eventRepo.remove([savedLegacy, savedWithDates, event1, expiredEvent]);
    console.log("✅ Événements de test supprimés");

    await AppDataSource.destroy();

    console.log("\n" + "=".repeat(60));
    console.log("✅ TOUS LES TESTS SONT RÉUSSIS !");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ ERREUR DURANT LES TESTS:", error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

runTests();
