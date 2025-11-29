/**
 * Script pour vérifier l'état du schéma de la base de données
 *
 * Usage:
 *   npx ts-node apps/api/check-db-schema.ts
 */

import "reflect-metadata";
import { AppDataSource } from "./src/db/data-source";

async function checkDatabaseSchema() {
  try {
    console.log("🔌 Connexion à la base de données...");
    await AppDataSource.initialize();
    console.log("✅ Connecté à la base de données\n");

    const queryRunner = AppDataSource.createQueryRunner();

    // 1. Vérifier la table migrations
    console.log("📋 Table migrations:");
    console.log("=".repeat(80));

    const migrations = await queryRunner.query(`
      SELECT * FROM migrations ORDER BY timestamp ASC
    `);

    if (migrations.length === 0) {
      console.log("   ⚠️  Aucune migration enregistrée");
    } else {
      console.log(`   ✅ ${migrations.length} migration(s) enregistrée(s):\n`);
      for (const migration of migrations) {
        console.log(`   - ${migration.name} (${new Date(migration.timestamp).toISOString()})`);
      }
    }

    // 2. Vérifier les colonnes de la table tenants
    console.log("\n📋 Colonnes de la table 'tenants':");
    console.log("=".repeat(80));

    const tenantColumns = await queryRunner.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tenants'
      ORDER BY ORDINAL_POSITION
    `);

    if (tenantColumns.length === 0) {
      console.log("   ⚠️  La table 'tenants' n'existe pas");
    } else {
      for (const col of tenantColumns) {
        console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
      }
    }

    // 3. Vérifier les colonnes problématiques
    console.log("\n🔍 Vérification des colonnes problématiques:");
    console.log("=".repeat(80));

    const problematicColumns = [
      'max_songs_per_event',
      'max_concurrent_events',
      'max_players_per_event',
      'max_users'
    ];

    for (const columnName of problematicColumns) {
      const exists = tenantColumns.some((col: any) => col.COLUMN_NAME === columnName);
      console.log(`   ${exists ? '✅' : '❌'} ${columnName} ${exists ? 'existe' : 'n\'existe pas'}`);
    }

    // 4. Lister toutes les tables
    console.log("\n📋 Tables existantes:");
    console.log("=".repeat(80));

    const tables = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);

    for (const table of tables) {
      console.log(`   - ${table.TABLE_NAME}`);
    }

    console.log("\n💡 Recommandations:");
    console.log("=".repeat(80));

    if (migrations.length === 0 && tenantColumns.length > 0) {
      console.log("   ⚠️  Les tables existent mais aucune migration n'est enregistrée.");
      console.log("   → Utilisez 'mark-migrations-as-run.ts' pour marquer les migrations comme exécutées");
    } else if (migrations.length > 0 && migrations.length < 9) {
      console.log(`   ⚠️  Seulement ${migrations.length}/9 migrations sont enregistrées.`);
      console.log("   → Certaines migrations ont échoué ou n'ont pas été exécutées");
      console.log("   → Utilisez 'fix-migrations.ts' pour corriger");
    } else if (migrations.length === 9) {
      console.log("   ✅ Toutes les migrations sont enregistrées");
      console.log("   → La base de données est à jour");
    }

    await queryRunner.release();

  } catch (error) {
    console.error("\n❌ Erreur:", error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

checkDatabaseSchema();
