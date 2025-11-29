import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from "typeorm";

export class AddEventLifecycleDates1762300000000 implements MigrationInterface {
  name = 'AddEventLifecycleDates1762300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Ajouter les nouvelles colonnes
    await queryRunner.addColumn(
      "events",
      new TableColumn({
        name: "start_date",
        type: "datetime",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "events",
      new TableColumn({
        name: "end_date",
        type: "datetime",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "events",
      new TableColumn({
        name: "actual_start_date",
        type: "datetime",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "events",
      new TableColumn({
        name: "code_expires_at",
        type: "datetime",
        isNullable: true,
      })
    );

    // 2. Créer un index pour les requêtes de codes actifs
    await queryRunner.createIndex(
      "events",
      new TableIndex({
        name: "idx_event_code_expiry",
        columnNames: ["code", "code_expires_at"],
      })
    );

    // 3. Pour les événements existants sans dates, on les laisse avec code_expires_at = NULL
    // Cela signifie que ce sont des codes permanents (comportement legacy)
    console.log("✅ Migration: Colonnes lifecycle ajoutées à 'events'");
    console.log("   - start_date");
    console.log("   - end_date");
    console.log("   - actual_start_date");
    console.log("   - code_expires_at");
    console.log("ℹ️  Les événements existants conservent code_expires_at = NULL (codes permanents)");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer l'index
    await queryRunner.dropIndex("events", "idx_event_code_expiry");

    // Supprimer les colonnes
    await queryRunner.dropColumn("events", "code_expires_at");
    await queryRunner.dropColumn("events", "actual_start_date");
    await queryRunner.dropColumn("events", "end_date");
    await queryRunner.dropColumn("events", "start_date");

    console.log("⚠️ Rollback: Colonnes lifecycle supprimées de 'events'");
  }
}
