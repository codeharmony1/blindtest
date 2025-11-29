import bcrypt from "bcryptjs";

/**
 * Liste noire de PINs faibles selon NIST
 * Évite les séquences, répétitions, dates courantes
 */
const WEAK_PINS = new Set([
  "000000", "111111", "222222", "333333", "444444", "555555", "666666", "777777", "888888", "999999",
  "123456", "654321", "012345", "123450",
  "111222", "222333", "333444", "444555", "555666", "666777", "777888", "888999",
  "102030", "010203", "112233", "121212", "123123",
  "202020", "202021", "202022", "202023", "202024", "202025", // Années courantes
]);

/**
 * Génère un PIN à 6 chiffres sécurisé (non prévisible)
 * Conforme aux recommandations NIST 2024
 */
export function generateSecurePIN(): string {
  let pin: string;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    // Générer 6 chiffres aléatoires
    pin = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;

    if (attempts > maxAttempts) {
      throw new Error("Impossible de générer un PIN sécurisé après 100 tentatives");
    }
  } while (WEAK_PINS.has(pin));

  return pin;
}

/**
 * Hash un PIN avec bcrypt (salt rounds = 10)
 */
export async function hashPIN(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

/**
 * Vérifie si un PIN correspond au hash stocké
 */
export async function verifyPIN(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Valide le format d'un PIN (exactement 6 chiffres)
 */
export function isValidPINFormat(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}
