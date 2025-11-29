/**
 * Script pour marquer les migrations comme exécutées
 *
 * À utiliser quand les tables existent déjà mais les migrations ne sont pas enregistrées
 *
 * Usage:
 *   npx ts-node apps/api/fix-migrations.ts
 */

import "reflect-metadata";
import { AppDataSource } from "./src/db/data-source";

// Liste des migrations dans l'ordre chronologique
const migrations = [
  { timestamp: 1699000000000, name: "CreateInitialSchema1699000000000" },
  { timestamp: 1699100000000, name: "AddMultiTenant1699100000000" },
  { timestamp: 1727800000000, name: "AddSuperAdmin1727800000000" },
  { timestamp: 1727900000000, name: "AddPasswordReset1727900000000" },
  { timestamp: 1728000000000, name: "AddPayments1728000000000" },
  { timestamp: 1728010000000, name: "AddAuditLog1728010000000" },
  { timestamp: 1728020000000, name: "AddTenantSession1728020000000" },
  { timestamp: 1728030000000, name: "UpdateSubscriptionPlans1728030000000" },
  { timestamp: 1728040000000, name: "AddEventStatus1728040000000" }
];

async function fixMigrations() {
  try {
    console.log("🔧 Correction des migrations");
    console.log("=".repeat(80));

    console.log("\n🔌 Connexion à la base de données...");
    await AppDataSource.initialize();
    console.log("✅ Connecté\n");

    const queryRunner = AppDataSource.createQueryRunner();

    // 1. Vérifier que la table migrations existe
    console.log("📋 Vérification de la table migrations...");
    const migrationsTableExists = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'migrations'
    `);

    if (migrationsTableExists[0].count === 0) {
      console.log("❌ La table 'migrations' n'existe pas. Créons-la...");
      await queryRunner.query(`
        CREATE TABLE migrations (
          id int NOT NULL AUTO_INCREMENT,
          timestamp bigint NOT NULL,
          name varchar(255) NOT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB
      `);
      console.log("✅ Table 'migrations' créée");
    } else {
      console.log("✅ Table 'migrations' existe");
    }

    // 2. Vérifier les migrations déjà enregistrées
    const existingMigrations = await queryRunner.query(`
      SELECT * FROM migrations ORDER BY timestamp ASC
    `);

    console.log(`\n📊 État actuel: ${existingMigrations.length} migration(s) enregistrée(s)`);

    if (existingMigrations.length > 0) {
      console.log("\nMigrations déjà enregistrées:");
      for (const mig of existingMigrations) {
        console.log(`   - ${mig.name}`);
      }
    }

    // 3. Vérifier les colonnes de la table tenants
    console.log("\n🔍 Vérification du schéma actuel...");

    const tenantColumns = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tenants'
    `);

    const columnNames = tenantColumns.map((col: any) => col.COLUMN_NAME);

    // Vérifier quelles migrations ont déjà été appliquées
    const appliedMigrations: string[] = [];

    // Migration 1-2: Tables de base existent
    if (columnNames.includes('id')) {
      appliedMigrations.push('CreateInitialSchema1699000000000');
      appliedMigrations.push('AddMultiTenant1699100000000');
    }

    // Migration 8: Colonnes subscription
    if (columnNames.includes('max_songs_per_event')) {
      appliedMigrations.push('UpdateSubscriptionPlans1728030000000');
    }

    console.log(`✅ ${appliedMigrations.length} migration(s) déjà appliquée(s) au schéma`);

    // 4. Demander confirmation
    console.log("\n⚠️  ATTENTION:");
    console.log("=".repeat(80));
    console.log("Ce script va marquer les migrations suivantes comme exécutées:");
    console.log("");

    for (const migration of migrations) {
      const alreadyRecorded = existingMigrations.some((m: any) => m.name === migration.name);
      const status = alreadyRecorded ? '✅ Déjà enregistrée' : '➕ Sera ajoutée';
      console.log(`   ${status}: ${migration.name}`);
    }

    console.log("\nVoulez-vous continuer ? (Ctrl+C pour annuler)");
    console.log("Attente de 5 secondes...\n");

    await new Promise(resolve => setTimeout(resolve, 5000));

    // 5. Marquer les migrations comme exécutées
    let added = 0;

    for (const migration of migrations) {
      const alreadyRecorded = existingMigrations.some((m: any) => m.name === migration.name);

      if (!alreadyRecorded) {
        await queryRunner.query(`
          INSERT INTO migrations (timestamp, name)
          VALUES (?, ?)
        `, [migration.timestamp, migration.name]);
        console.log(`   ✅ Ajouté: ${migration.name}`);
        added++;
      }
    }

    console.log(`\n✅ ${added} migration(s) ajoutée(s)`);
    console.log(`📊 Total: ${existingMigrations.length + added} migration(s) enregistrée(s)`);

    await queryRunner.release();

    console.log("\n🎉 Correction terminée avec succès!");
    console.log("\n💡 Vous pouvez maintenant créer votre compte admin:");
    console.log('   docker exec -it blindtest-api npx ts-node apps/api/init-production.ts email@example.com password "Name"');

  } catch (error) {
    console.error("\n❌ Erreur:", error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

fixMigrations();
