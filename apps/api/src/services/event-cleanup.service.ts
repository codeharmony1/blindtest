import { AppDataSource } from "../db/data-source";
import { Event } from "../db/entities/Event";
import { LessThan, Not, IsNull, And } from "typeorm";

/**
 * Marque les événements expirés comme COMPLETED
 * À exécuter quotidiennement via un cron job
 */
export async function cleanupExpiredEvents(): Promise<number> {
  const now = new Date();
  const eventRepo = AppDataSource.getRepository(Event);

  const expiredEvents = await eventRepo
    .createQueryBuilder("event")
    .where("event.status = :status", { status: "ACTIVE" })
    .andWhere("event.code_expires_at IS NOT NULL")
    .andWhere("event.code_expires_at < :now", { now })
    .getMany();

  for (const event of expiredEvents) {
    event.status = "COMPLETED";
    event.completed_at = now;
    await eventRepo.save(event);
    console.log(
      `✅ Événement ${event.code} (${event.name}) marqué comme COMPLETED (code expiré)`
    );
  }

  return expiredEvents.length;
}

/**
 * Démarre le cron job de nettoyage
 * À appeler au démarrage de l'application
 */
export function startEventCleanupCron() {
  // Exécuter tous les jours à 3h du matin
  // Alternative simple : setInterval pour tests
  const EVERY_24_HOURS = 24 * 60 * 60 * 1000;

  setInterval(async () => {
    console.log("[CLEANUP] Démarrage du nettoyage des événements expirés...");
    try {
      const count = await cleanupExpiredEvents();
      console.log(`[CLEANUP] ${count} événement(s) marqué(s) comme COMPLETED`);
    } catch (error) {
      console.error("[CLEANUP] Erreur lors du nettoyage:", error);
    }
  }, EVERY_24_HOURS);

  console.log("✅ Cron job de nettoyage des événements démarré");
}
