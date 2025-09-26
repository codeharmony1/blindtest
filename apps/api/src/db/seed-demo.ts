// apps/api/src/db/seed-demo.ts
import { AppDataSource } from "./data-source";
import { Organizer } from "./entities/Organizer";
import { Event } from "./entities/Event";
import { Round } from "./entities/Round";
import { RoundSong } from "./entities/RoundSong";
import { Team } from "./entities/Team";
import { Player } from "./entities/Player";

async function seed() {
  await AppDataSource.initialize();

  const orgRepo = AppDataSource.getRepository(Organizer);
  const evRepo = AppDataSource.getRepository(Event);
  const roundRepo = AppDataSource.getRepository(Round);
  const songRepo = AppDataSource.getRepository(RoundSong);
  const teamRepo = AppDataSource.getRepository(Team);
  const playerRepo = AppDataSource.getRepository(Player);

  // Organizer démo (sans login pour l’instant)
  let org = await orgRepo.findOne({ where: { email: "demo@blindtest.local" } });
  if (!org) {
    org = orgRepo.create({
      email: "demo@blindtest.local",
      password_hash: "demo",
      display_name: "Demo",
    });
    org = await orgRepo.save(org);
  }

  // Event DEMO (unique par code)
  let ev = await evRepo.findOne({ where: { code: "DEMO" } });
  if (!ev) {
    ev = evRepo.create({
      organizer: org,
      code: "DEMO",
      name: "Blindtest DEMO",
      settings_json: JSON.stringify({
        defaultSongDuration: 7,
        defaultSongsPerRound: 3,
        leaderboardLiveGlobal: true,
        leaderboardOnProjectorDuringTimer: false,
      }),
    });
    ev = await evRepo.save(ev);
  }

  // Round
  let round = await roundRepo.findOne({ where: { event_id: ev.id } });
  if (!round) {
    round = roundRepo.create({
      event: ev,
      event_id: ev.id,
      name: "Demo Round",
      default_duration_s: 7,
      total_songs: 3,
    });
    round = await roundRepo.save(round);
  }

  // Songs (3)
  const existingSongs = await songRepo.find({ where: { round_id: round.id } });
  if (existingSongs.length === 0) {
    const songs = [
      {
        idx: 1,
        title_official: "Billie Jean",
        artist_official: "Michael Jackson",
        aliases_json: JSON.stringify(["MJ"]),
      },
      {
        idx: 2,
        title_official: "Shape of You",
        artist_official: "Ed Sheeran",
        aliases_json: JSON.stringify([]),
      },
      {
        idx: 3,
        title_official: "Smells Like Teen Spirit",
        artist_official: "Nirvana",
        aliases_json: JSON.stringify([]),
      },
    ];
    for (const s of songs) {
      const rs = songRepo.create({
        round,
        round_id: round.id,
        mode: "prepared",
        status: "pending",
        duration_s: 7,
        ...s,
      });
      await songRepo.save(rs);
    }
  }

  // Teams + captains
  const teams = await teamRepo.find({ where: { event_id: ev.id } });
  if (teams.length === 0) {
    const t1 = await teamRepo.save(
      teamRepo.create({
        event: ev,
        event_id: ev.id,
        name: "Table 1",
        manual_participants_count: 0,
      }),
    );
    const t2 = await teamRepo.save(
      teamRepo.create({
        event: ev,
        event_id: ev.id,
        name: "Table 2",
        manual_participants_count: 0,
      }),
    );

    const p1 = await playerRepo.save(
      playerRepo.create({
        event: ev,
        event_id: ev.id,
        team: t1,
        team_id: t1.id,
        nickname: "Capitaine T1",
        is_captain: true,
      }),
    );
    const p2 = await playerRepo.save(
      playerRepo.create({
        event: ev,
        event_id: ev.id,
        team: t2,
        team_id: t2.id,
        nickname: "Capitaine T2",
        is_captain: true,
      }),
    );

    t1.captain_player_id = p1.id;
    await teamRepo.save(t1);
    t2.captain_player_id = p2.id;
    await teamRepo.save(t2);
  }

  console.log("✅ Seed DEMO terminé. Event code = DEMO");
  await AppDataSource.destroy();
}

seed().catch((e) => {
  console.error("❌ Seed error:", e);
  process.exit(1);
});
