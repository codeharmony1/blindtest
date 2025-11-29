import { AppDataSource } from "./src/db/data-source";

async function testSchema() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connexion à la base de données établie");

    // Vérifier que les colonnes existent
    const queryRunner = AppDataSource.createQueryRunner();
    const columns = await queryRunner.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'blindtest'
        AND TABLE_NAME = 'events'
        AND COLUMN_NAME IN ('start_date', 'end_date', 'actual_start_date', 'code_expires_at')
      ORDER BY COLUMN_NAME
    `);

    console.log("\n📊 Colonnes lifecycle dans la table events:");
    console.table(columns);

    // Vérifier l'index
    const indexes = await queryRunner.query(`
      SHOW INDEX FROM events WHERE Key_name = 'idx_event_code_expiry'
    `);

    console.log("\n📑 Index idx_event_code_expiry:");
    console.table(indexes);

    await queryRunner.release();
    await AppDataSource.destroy();

    console.log("\n✅ Test du schéma réussi!");
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

testSchema();
