import { AppDataSource } from "./src/db/data-source";
import { Organizer } from "./src/db/entities/Organizer";
import { Event } from "./src/db/entities/Event";
import { Team } from "./src/db/entities/Team";
import { Player } from "./src/db/entities/Player";

async function testGameModes() {
  console.log("🔧 Initialisation de la base de données...");
  await AppDataSource.initialize();
  
  const organizerRepo = AppDataSource.getRepository(Organizer);
  const eventRepo = AppDataSource.getRepository(Event);
  const teamRepo = AppDataSource.getRepository(Team);
  const playerRepo = AppDataSource.getRepository(Player);
  
  // Trouver ou créer un organisateur
  let organizer = await organizerRepo.findOne({ where: {} });
  if (!organizer) {
    organizer = new Organizer();
    organizer.email = "test@example.com";
    organizer.password_hash = "test";
    organizer = await organizerRepo.save(organizer);
    console.log("✅ Organisateur créé:", organizer.id);
  } else {
    console.log("✅ Organisateur trouvé:", organizer.id);
  }
  
  // TEST 1: Créer événement en mode TEAM
  console.log("\n📋 TEST 1: Événement en mode TEAM");
  const eventTeam = new Event();
  eventTeam.organizer = organizer;
  eventTeam.name = "Test Event TEAM";
  eventTeam.code = "TEAM01";
  eventTeam.game_mode = "TEAM";
  eventTeam.tenant_id = "00000000-0000-0000-0000-000000000001";
  const savedTeam = await eventRepo.save(eventTeam);
  console.log("✅ Événement TEAM créé:", savedTeam.code, "- Mode:", savedTeam.game_mode);
  
  // Créer une équipe pour mode TEAM
  const team1 = new Team();
  team1.event = savedTeam;
  team1.event_id = savedTeam.id;
  team1.tenant_id = savedTeam.tenant_id;
  team1.name = "Table 1";
  const savedTeam1 = await teamRepo.save(team1);
  console.log("✅ Équipe créée:", savedTeam1.name);
  
  // Ajouter des joueurs à l'équipe
  const player1 = new Player();
  player1.event = savedTeam;
  player1.event_id = savedTeam.id;
  player1.team = savedTeam1;
  player1.team_id = savedTeam1.id;
  player1.tenant_id = savedTeam.tenant_id;
  player1.nickname = "Alice";
  player1.is_captain = true;
  await playerRepo.save(player1);
  console.log("✅ Joueur ajouté (capitaine):", player1.nickname);
  
  const player2 = new Player();
  player2.event = savedTeam;
  player2.event_id = savedTeam.id;
  player2.team = savedTeam1;
  player2.team_id = savedTeam1.id;
  player2.tenant_id = savedTeam.tenant_id;
  player2.nickname = "Bob";
  player2.is_captain = false;
  await playerRepo.save(player2);
  console.log("✅ Joueur ajouté:", player2.nickname);
  
  // TEST 2: Créer événement en mode SOLO
  console.log("\n📋 TEST 2: Événement en mode SOLO");
  const eventSolo = new Event();
  eventSolo.organizer = organizer;
  eventSolo.name = "Test Event SOLO";
  eventSolo.code = "SOLO01";
  eventSolo.game_mode = "SOLO";
  eventSolo.tenant_id = "00000000-0000-0000-0000-000000000001";
  const savedSolo = await eventRepo.save(eventSolo);
  console.log("✅ Événement SOLO créé:", savedSolo.code, "- Mode:", savedSolo.game_mode);
  
  // Simuler join en mode SOLO (création auto d'équipes individuelles)
  const soloPlayer1 = "Charlie";
  const soloTeam1 = new Team();
  soloTeam1.event = savedSolo;
  soloTeam1.event_id = savedSolo.id;
  soloTeam1.tenant_id = savedSolo.tenant_id;
  soloTeam1.name = soloPlayer1; // En mode SOLO, nom équipe = pseudo
  const savedSoloTeam1 = await teamRepo.save(soloTeam1);
  
  const player3 = new Player();
  player3.event = savedSolo;
  player3.event_id = savedSolo.id;
  player3.team = savedSoloTeam1;
  player3.team_id = savedSoloTeam1.id;
  player3.tenant_id = savedSolo.tenant_id;
  player3.nickname = soloPlayer1;
  player3.is_captain = true;
  await playerRepo.save(player3);
  console.log("✅ Joueur SOLO ajouté:", player3.nickname, "- Équipe:", savedSoloTeam1.name);
  
  const soloPlayer2 = "Diana";
  const soloTeam2 = new Team();
  soloTeam2.event = savedSolo;
  soloTeam2.event_id = savedSolo.id;
  soloTeam2.tenant_id = savedSolo.tenant_id;
  soloTeam2.name = soloPlayer2;
  const savedSoloTeam2 = await teamRepo.save(soloTeam2);
  
  const player4 = new Player();
  player4.event = savedSolo;
  player4.event_id = savedSolo.id;
  player4.team = savedSoloTeam2;
  player4.team_id = savedSoloTeam2.id;
  player4.tenant_id = savedSolo.tenant_id;
  player4.nickname = soloPlayer2;
  player4.is_captain = true;
  await playerRepo.save(player4);
  console.log("✅ Joueur SOLO ajouté:", player4.nickname, "- Équipe:", savedSoloTeam2.name);
  
  // Vérifications
  console.log("\n🔍 VÉRIFICATIONS:");
  
  const teamsTeam = await teamRepo.find({ where: { event_id: savedTeam.id } });
  const playersTeam = await playerRepo.find({ where: { event_id: savedTeam.id } });
  console.log(`Mode TEAM - Équipes: ${teamsTeam.length}, Joueurs: ${playersTeam.length}`);
  console.log(`  → ${teamsTeam.map(t => t.name).join(", ")}`);
  console.log(`  → ${playersTeam.map(p => p.nickname).join(", ")}`);
  
  const teamsSolo = await teamRepo.find({ where: { event_id: savedSolo.id } });
  const playersSolo = await playerRepo.find({ where: { event_id: savedSolo.id } });
  console.log(`Mode SOLO - Équipes: ${teamsSolo.length}, Joueurs: ${playersSolo.length}`);
  console.log(`  → ${teamsSolo.map(t => t.name).join(", ")}`);
  console.log(`  → ${playersSolo.map(p => p.nickname).join(", ")}`);
  
  console.log("\n✅ Tests terminés avec succès!");
  
  await AppDataSource.destroy();
  process.exit(0);
}

testGameModes().catch((err) => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
