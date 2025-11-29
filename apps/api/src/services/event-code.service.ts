import { Repository, Brackets } from "typeorm";
import { Event } from "../db/entities/Event";

/**
 * Options de génération de code d'événement
 */
interface CodeGenerationOptions {
  eventRepo: Repository<Event>;
  tenantId: string;
  preferredCode?: string; // Code souhaité (pour réactivation)
  startDate?: Date;
  endDate?: Date;
  codeLength?: number; // 8 caractères par défaut
}

/**
 * Génère un code d'événement unique basé sur le lifecycle
 */
export async function generateUniqueEventCode(
  options: CodeGenerationOptions
): Promise<string> {
  const {
    eventRepo,
    tenantId,
    preferredCode,
    startDate,
    endDate,
    codeLength = 8, // Augmenté à 8 pour réduire les collisions
  } = options;

  // Calculer la date d'expiration du code (end_date + 30 jours buffer)
  const codeExpiresAt = calculateCodeExpiration(startDate, endDate);

  // Cas 1 : Tentative de réutiliser un code préféré (réactivation)
  if (preferredCode) {
    const isAvailable = await isCodeAvailable(
      eventRepo,
      preferredCode,
      tenantId,
      codeExpiresAt
    );

    if (isAvailable) {
      console.log(`✅ Code préféré "${preferredCode}" réutilisé`);
      return preferredCode;
    }
    console.log(
      `⚠️ Code préféré "${preferredCode}" déjà pris, génération nouveau code`
    );
  }

  // Cas 2 : Génération d'un nouveau code unique
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    const newCode = generateRandomCode(codeLength);
    const isAvailable = await isCodeAvailable(
      eventRepo,
      newCode,
      tenantId,
      codeExpiresAt
    );

    if (isAvailable) {
      console.log(`✅ Nouveau code généré: "${newCode}"`);
      return newCode;
    }
  }

  throw new Error(
    "Impossible de générer un code unique après plusieurs tentatives"
  );
}

/**
 * Vérifie si un code est disponible pour la période donnée
 */
async function isCodeAvailable(
  eventRepo: Repository<Event>,
  code: string,
  tenantId: string,
  proposedExpiryDate: Date | null
): Promise<boolean> {
  const now = new Date();

  // Chercher des événements avec le même code qui sont encore actifs
  const conflictingEvents = await eventRepo
    .createQueryBuilder("event")
    .where("event.code = :code", { code })
    .andWhere("event.tenant_id = :tenantId", { tenantId })
    .andWhere(
      new Brackets((qb) => {
        // Code sans expiration = toujours actif (événements legacy)
        qb.where("event.code_expires_at IS NULL")
          // OU code qui n'a pas encore expiré
          .orWhere("event.code_expires_at > :now", { now });
      })
    )
    .getMany();

  return conflictingEvents.length === 0;
}

/**
 * Génère un code aléatoire de longueur donnée
 */
function generateRandomCode(length: number = 8): string {
  // Alphabet sans caractères ambigus (0/O, 1/I, etc.)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

/**
 * Calcule la date d'expiration du code
 */
export function calculateCodeExpiration(
  startDate: Date | null | undefined,
  endDate: Date | null | undefined
): Date | null {
  // Si pas de date de fin définie, code permanent (legacy)
  if (!endDate) return null;

  // Buffer post-événement : 1 jour (24h) après la fin
  // Permet aux participants de consulter les résultats pendant 24h
  // L'organisateur garde un accès illimité via son interface admin
  const BUFFER_DAYS = 1;
  const expiration = new Date(endDate);
  expiration.setDate(expiration.getDate() + BUFFER_DAYS);

  return expiration;
}

/**
 * Vérifie si un événement peut être réactivé avec son ancien code
 */
export async function canReactivateWithCode(
  eventRepo: Repository<Event>,
  event: Event,
  newStartDate: Date,
  newEndDate: Date
): Promise<{ canReuse: boolean; reason?: string }> {
  const newExpiryDate = calculateCodeExpiration(newStartDate, newEndDate);

  const isAvailable = await isCodeAvailable(
    eventRepo,
    event.code,
    event.tenant_id,
    newExpiryDate
  );

  if (isAvailable) {
    return { canReuse: true };
  } else {
    return {
      canReuse: false,
      reason: "Le code est déjà utilisé par un autre événement actif",
    };
  }
}
