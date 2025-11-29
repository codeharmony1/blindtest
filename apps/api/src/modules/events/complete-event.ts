import { AppDataSource } from "../../db/data-source";
import { Event } from "../../db/entities/Event";
import { Round } from "../../db/entities/Round";
import { RoundSong } from "../../db/entities/RoundSong";
import { Team } from "../../db/entities/Team";
import { Player } from "../../db/entities/Player";
import { Score } from "../../db/entities/Score";
import { io } from "../../ws/socket";

/**
 * Marque un événement comme complété et émet l'événement WebSocket avec les statistiques finales
 */
export async function completeEvent(eventCode: string): Promise<boolean> {
  const eventRepo = AppDataSource.getRepository(Event);
  const roundRepo = AppDataSource.getRepository(Round);
  const songRepo = AppDataSource.getRepository(RoundSong);
  const teamRepo = AppDataSource.getRepository(Team);
  const playerRepo = AppDataSource.getRepository(Player);
  const scoreRepo = AppDataSource.getRepository(Score);

  // Récupérer l'événement
  const event = await eventRepo.findOne({ where: { code: eventCode } });
  if (!event) {
    console.error(`[completeEvent] Event not found: ${eventCode}`);
    return false;
  }

  // Vérifier s'il n'est pas déjà complété
  if (event.status === "COMPLETED") {
    console.log(`[completeEvent] Event already completed: ${eventCode}`);
    return true;
  }

  // Calculer les statistiques
  const rounds = await roundRepo.find({ where: { event_id: event.id } });
  const totalRounds = rounds.length;

  let totalSongs = 0;
  for (const round of rounds) {
    const songs = await songRepo.count({ where: { round_id: round.id } });
    totalSongs += songs;
  }

  const teams = await teamRepo.find({ where: { event_id: event.id } });
  const totalTeams = teams.length;

  const players = await playerRepo.find({ where: { event_id: event.id } });
  const totalPlayers = players.length;

  // Calculer la durée de l'événement (en secondes)
  const duration = Math.floor((Date.now() - new Date(event.created_at).getTime()) / 1000);

  // Récupérer le classement final
  const scores = await scoreRepo.find({ where: { event_id: event.id } });
  const finalLeaderboard = scores
    .map((s) => ({
      teamId: s.team_id,
      name: teams.find((t) => t.id === s.team_id)?.name ?? "???",
      totalPoints: s.total_points,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((x, i) => ({ ...x, rank: i + 1 }));

  // Mettre à jour le statut de l'événement
  await eventRepo.update(
    { code: eventCode },
    {
      status: "COMPLETED",
      completed_at: new Date(),
    }
  );

  // Émettre l'événement WebSocket
  io.to(`event:${eventCode}`).emit("event_completed", {
    eventCode,
    totalRounds,
    totalSongs,
    totalTeams,
    totalPlayers,
    duration,
    finalLeaderboard,
  });

  console.log(`[completeEvent] Event completed: ${eventCode} | Rounds: ${totalRounds} | Songs: ${totalSongs} | Teams: ${totalTeams} | Players: ${totalPlayers}`);

  return true;
}

/**
 * Vérifie si un événement peut être marqué comme complété automatiquement
 * (toutes les chansons ont été jouées et corrigées)
 */
export async function checkEventCompletion(eventId: string): Promise<boolean> {
  const roundRepo = AppDataSource.getRepository(Round);
  const songRepo = AppDataSource.getRepository(RoundSong);

  // Récupérer tous les rounds de l'événement
  const rounds = await roundRepo.find({ where: { event_id: eventId } });

  if (rounds.length === 0) {
    return false; // Pas de rounds, pas de complétion possible
  }

  // Vérifier que toutes les chansons de tous les rounds sont terminées
  for (const round of rounds) {
    const songs = await songRepo.find({ where: { round_id: round.id } });

    if (songs.length === 0) {
      return false; // Round vide, pas de complétion
    }

    // Vérifier que toutes les chansons sont en statut "closed" ou "scored"
    const allSongsClosed = songs.every(
      (song) => song.status === "closed" || song.status === "scored"
    );

    if (!allSongsClosed) {
      return false; // Il reste des chansons non terminées
    }
  }

  return true; // Tous les rounds et toutes les chansons sont terminés
}
