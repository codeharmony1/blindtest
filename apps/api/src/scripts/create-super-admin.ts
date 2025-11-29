/**
 * Script pour créer un super-administrateur
 * Usage: npm run create-super-admin
 */

import "reflect-metadata";
import { AppDataSource } from "../db/data-source";
import { SuperAdminService } from "../services/super-admin.service";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createSuperAdmin() {
  try {
    console.log("==============================================");
    console.log("  Création d'un Super-Administrateur");
    console.log("==============================================\n");

    // Initialiser la connexion DB
    await AppDataSource.initialize();
    console.log("✅ Connexion à la base de données établie\n");

    const service = new SuperAdminService();

    // Demander les informations
    const email = await question("Email du super-admin: ");
    if (!email || !email.includes("@")) {
      throw new Error("Email invalide");
    }

    const name = await question("Nom complet (optionnel): ");

    let password = await question("Mot de passe (min. 8 caractères): ");
    while (password.length < 8) {
      console.log("⚠️  Le mot de passe doit contenir au moins 8 caractères");
      password = await question("Mot de passe (min. 8 caractères): ");
    }

    const confirmPassword = await question("Confirmer le mot de passe: ");
    if (password !== confirmPassword) {
      throw new Error("Les mots de passe ne correspondent pas");
    }

    console.log("\n⏳ Création du super-admin...");

    // Créer le super-admin
    const admin = await service.createSuperAdmin({
      email: email.trim(),
      password: password,
      name: name.trim() || undefined,
    });

    console.log("\n✅ Super-admin créé avec succès !");
    console.log("==============================================");
    console.log(`ID: ${admin.id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Nom: ${admin.name || "Non défini"}`);
    console.log(`Actif: ${admin.is_active ? "Oui" : "Non"}`);
    console.log("==============================================");
    console.log("\n🔐 Vous pouvez maintenant vous connecter à:");
    console.log(`   ${process.env.API_URL || "http://localhost:3000"}/api/backstage/auth/login`);
    console.log("\n");

  } catch (error: any) {
    console.error("\n❌ Erreur:", error.message);

    if (error.message === "EMAIL_ALREADY_EXISTS") {
      console.error("   Cet email est déjà utilisé par un autre super-admin.");
    }
  } finally {
    rl.close();
    await AppDataSource.destroy();
    process.exit(0);
  }
}

// Exécuter le script
createSuperAdmin();
