import { AppDataSource } from "./src/db/data-source";

async function migrate() {
  console.log("🔄 Connexion à la base de données...");

  await AppDataSource.initialize();

  console.log("✅ Connecté à la base de données");
  console.log("🔄 Exécution de la migration...");

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    // Vérifier si la colonne existe déjà
    const checkColumn = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'events'
        AND COLUMN_NAME = 'status'
    `);

    if (checkColumn.length > 0) {
      console.log("⚠️  La colonne 'status' existe déjà");
    } else {
      console.log("➕ Ajout de la colonne 'status'...");
      await queryRunner.query(`
        ALTER TABLE events
        ADD COLUMN status ENUM('DRAFT', 'ACTIVE', 'COMPLETED')
        NOT NULL DEFAULT 'ACTIVE'
        AFTER game_mode
      `);
      console.log("✅ Colonne 'status' ajoutée");
    }

    // Vérifier la colonne completed_at
    const checkCompletedAt = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'events'
        AND COLUMN_NAME = 'completed_at'
    `);

    if (checkCompletedAt.length > 0) {
      console.log("⚠️  La colonne 'completed_at' existe déjà");
    } else {
      console.log("➕ Ajout de la colonne 'completed_at'...");
      await queryRunner.query(`
        ALTER TABLE events
        ADD COLUMN completed_at DATETIME NULL
        AFTER created_at
      `);
      console.log("✅ Colonne 'completed_at' ajoutée");
    }

    // Vérifier l'index
    const checkIndex = await queryRunner.query(`
      SHOW INDEX FROM events WHERE Key_name = 'idx_event_status'
    `);

    if (checkIndex.length > 0) {
      console.log("⚠️  L'index 'idx_event_status' existe déjà");
    } else {
      console.log("➕ Ajout de l'index 'idx_event_status'...");
      await queryRunner.query(`
        CREATE INDEX idx_event_status ON events (status)
      `);
      console.log("✅ Index 'idx_event_status' ajouté");
    }

    console.log("🎉 Migration terminée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

migrate()
  .then(() => {
    console.log("✅ Script terminé");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });
