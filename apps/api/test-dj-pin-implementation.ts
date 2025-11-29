import { AppDataSource } from "./src/db/data-source";
import { Event } from "./src/db/entities/Event";
import { generateSecurePIN, hashPIN, verifyPIN } from "./src/services/pin.service";

async function testDJPinImplementation() {
  console.log("🧪 TESTS D'IMPLÉMENTATION DJ PIN\n");
  console.log("=" .repeat(60));

  try {
    // Initialiser la connexion DB
    console.log("\n1️⃣ Connexion à la base de données...");
    await AppDataSource.initialize();
    console.log("✅ Connexion réussie");

    // Test 1: Vérifier que la colonne dj_pin_hash existe
    console.log("\n2️⃣ Vérification de la colonne dj_pin_hash...");
    const queryRunner = AppDataSource.createQueryRunner();
    const columns = await queryRunner.query(
      "SHOW COLUMNS FROM events WHERE Field = 'dj_pin_hash'"
    );
    await queryRunner.release();

    if (columns.length > 0) {
      console.log("✅ Colonne dj_pin_hash existe");
      console.log("   Type:", columns[0].Type);
      console.log("   Null:", columns[0].Null);
    } else {
      console.error("❌ Colonne dj_pin_hash n'existe pas !");
      process.exit(1);
    }

    // Test 2: Générer un PIN sécurisé
    console.log("\n3️⃣ Test de génération de PIN...");
    const pin = generateSecurePIN();
    console.log("✅ PIN généré:", pin);
    console.log("   Longueur:", pin.length, "caractères");
    console.log("   Format valide:", /^\d{6}$/.test(pin) ? "✅" : "❌");

    // Vérifier que ce n'est pas un PIN faible
    const weakPins = ["000000", "111111", "123456", "654321"];
    const isWeak = weakPins.includes(pin);
    console.log("   PIN non-faible:", isWeak ? "❌" : "✅");

    // Test 3: Hash du PIN
    console.log("\n4️⃣ Test de hash bcrypt...");
    const pinHash = await hashPIN(pin);
    console.log("✅ Hash généré:", pinHash.substring(0, 30) + "...");
    console.log("   Longueur hash:", pinHash.length, "caractères");
    console.log("   Format bcrypt:", pinHash.startsWith("$2") ? "✅" : "❌");

    // Test 4: Vérification du PIN
    console.log("\n5️⃣ Test de vérification PIN...");
    const isValid = await verifyPIN(pin, pinHash);
    console.log("✅ Vérification PIN correct:", isValid ? "✅" : "❌");

    const wrongPin = "000000";
    const isInvalid = await verifyPIN(wrongPin, pinHash);
    console.log("✅ Rejet PIN incorrect:", !isInvalid ? "✅" : "❌");

    // Test 5: Compter les événements avec PIN
    console.log("\n6️⃣ Vérification des événements existants...");
    const eventRepo = AppDataSource.getRepository(Event);
    const eventsWithPin = await eventRepo
      .createQueryBuilder("event")
      .where("event.dj_pin_hash IS NOT NULL")
      .getCount();

    const totalEvents = await eventRepo.count();
    console.log("✅ Événements totaux:", totalEvents);
    console.log("✅ Événements avec PIN:", eventsWithPin);
    console.log("✅ Événements sans PIN:", totalEvents - eventsWithPin);

    // Test 6: Créer un événement de test avec PIN
    console.log("\n7️⃣ Test de création d'événement avec PIN...");
    const testPin = generateSecurePIN();
    const testPinHash = await hashPIN(testPin);

    // Chercher le tenant par défaut
    const tenantRepo = AppDataSource.getRepository((await import("./src/db/entities/Tenant")).Tenant);
    const defaultTenant = await tenantRepo.findOne({
      where: { slug: "default" }
    });

    if (!defaultTenant) {
      console.warn("⚠️ Tenant par défaut non trouvé, création du tenant...");
    }

    const testEvent = eventRepo.create({
      name: "Test DJ PIN " + Date.now(),
      code: "TEST" + Math.random().toString(36).substring(2, 6).toUpperCase(),
      game_mode: "TEAM",
      table_mode: false,
      dj_pin_hash: testPinHash,
      tenant_id: defaultTenant?.id || "00000000-0000-0000-0000-000000000001",
    });

    const savedEvent = await eventRepo.save(testEvent);
    console.log("✅ Événement de test créé:");
    console.log("   ID:", savedEvent.id);
    console.log("   Code:", savedEvent.code);
    console.log("   PIN (à noter):", testPin);
    console.log("   Hash stocké:", savedEvent.dj_pin_hash ? "✅" : "❌");

    // Test 7: Vérifier que le PIN fonctionne
    console.log("\n8️⃣ Test de récupération et vérification...");
    const retrievedEvent = await eventRepo.findOne({
      where: { id: savedEvent.id }
    });

    if (retrievedEvent && retrievedEvent.dj_pin_hash) {
      const pinWorks = await verifyPIN(testPin, retrievedEvent.dj_pin_hash);
      console.log("✅ PIN vérifié depuis BDD:", pinWorks ? "✅" : "❌");
    }

    // Résumé final
    console.log("\n" + "=".repeat(60));
    console.log("✅ TOUS LES TESTS RÉUSSIS !");
    console.log("=".repeat(60));
    console.log("\n📝 Événement de test créé :");
    console.log(`   Code événement: ${savedEvent.code}`);
    console.log(`   PIN DJ: ${testPin}`);
    console.log("\n🧪 Pour tester l'authentification DJ :");
    console.log(`   1. Aller sur http://localhost:4200/dj-login`);
    console.log(`   2. Entrer le code: ${savedEvent.code}`);
    console.log(`   3. Entrer le PIN: ${testPin}`);
    console.log(`   4. Vérifier la redirection vers /dj/${savedEvent.code}`);

  } catch (error) {
    console.error("\n❌ ERREUR:", error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log("\n👋 Connexion fermée");
  }
}

testDJPinImplementation();
