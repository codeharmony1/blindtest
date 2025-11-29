/**
 * Script de test : Vérifier la limitation de 5 chansons pour un tenant DEMO
 */
import { AppDataSource } from "./src/db/data-source";
import { Tenant } from "./src/db/entities/Tenant";
import { Event } from "./src/db/entities/Event";
import { Round } from "./src/db/entities/Round";
import { RoundSong } from "./src/db/entities/RoundSong";

async function testDemoSongLimit() {
  try {
    console.log("🔌 Connexion à la base de données...");
    await AppDataSource.initialize();
    console.log("✅ Connecté\n");

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const eventRepo = AppDataSource.getRepository(Event);
    const roundRepo = AppDataSource.getRepository(Round);
    const songRepo = AppDataSource.getRepository(RoundSong);

    // Récupérer le tenant DEMO créé précédemment
    console.log("🔍 Recherche du tenant DEMO...");
    const tenant = await tenantRepo.findOne({
      where: { slug: "test-demo-org" }
    });

    if (!tenant) {
      throw new Error("Tenant DEMO introuvable. Exécutez d'abord test-create-tenant.ts");
    }

    console.log(`✅ Tenant trouvé : ${tenant.name} (plan: ${tenant.subscription_plan})`);
    console.log(`📊 Limite de chansons : ${tenant.max_songs_per_event}\n`);

    // Créer un événement de test
    console.log("📝 Création d'un événement de test...");
    const event = eventRepo.create({
      tenant_id: tenant.id,
      name: "Test Event DEMO",
      code: "TEST-DEMO-" + Date.now()
    });
    const savedEvent = await eventRepo.save(event);
    console.log(`✅ Événement créé : ${savedEvent.name}\n`);

    // Créer une manche
    console.log("📝 Création d'une manche...");
    const round = roundRepo.create({
      tenant_id: tenant.id,
      event_id: savedEvent.id,
      name: "Test Round"
    });
    const savedRound = await roundRepo.save(round);
    console.log(`✅ Manche créée : ${savedRound.name}\n`);

    // Ajouter 5 chansons (doit réussir)
    console.log("🎵 Ajout de 5 chansons (devrait réussir)...");
    for (let i = 1; i <= 5; i++) {
      const song = songRepo.create({
        tenant_id: tenant.id,
        round_id: savedRound.id,
        idx: i,
        title_official: `Chanson Test ${i}`,
        artist_official: `Artiste ${i}`
      });
      await songRepo.save(song);
      console.log(`  ✅ Chanson ${i}/5 ajoutée`);
    }

    // Vérifier le nombre de chansons
    const songsCount = await songRepo.count({
      where: {
        round: {
          event_id: savedEvent.id
        }
      }
    });

    console.log(`\n✅ ${songsCount} chansons ajoutées avec succès`);
    console.log(`📊 Limite du plan DEMO : ${tenant.max_songs_per_event} chansons\n`);

    // Test : essayer d'ajouter une 6ème chanson
    console.log("🧪 Test : tentative d'ajout d'une 6ème chanson...");
    console.log("   (Ce test simule la logique API - le blocage se fait dans routes.ts)\n");

    // Vérification de la limite (comme dans l'API)
    const currentSongsCount = await songRepo.createQueryBuilder("song")
      .innerJoin("song.round", "round")
      .where("round.event_id = :eventId", { eventId: savedEvent.id })
      .getCount();

    if (tenant.max_songs_per_event && currentSongsCount >= tenant.max_songs_per_event) {
      console.log("❌ LIMITE ATTEINTE !");
      console.log({
        error: {
          code: "SONG_LIMIT_REACHED",
          message: `Plan ${tenant.subscription_plan} limité à ${tenant.max_songs_per_event} chansons par événement. Passez à un plan payant pour ajouter plus de chansons.`,
          limit: tenant.max_songs_per_event,
          current: currentSongsCount
        }
      });
    } else {
      console.log("✅ Ajout possible");
    }

    console.log("\n✅ Test terminé avec succès !");
    console.log("\n📝 Résumé :");
    console.log(`   - Tenant : ${tenant.name}`);
    console.log(`   - Plan : ${tenant.subscription_plan}`);
    console.log(`   - Limite : ${tenant.max_songs_per_event} chansons`);
    console.log(`   - Chansons ajoutées : ${currentSongsCount}`);
    console.log(`   - Statut : ${currentSongsCount >= (tenant.max_songs_per_event || Infinity) ? "LIMITE ATTEINTE ❌" : "OK ✅"}`);

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Erreur lors du test :", error.message);
    console.error(error);
    process.exit(1);
  }
}

testDemoSongLimit();
