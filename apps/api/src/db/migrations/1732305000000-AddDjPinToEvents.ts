import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDjPinToEvents1732305000000 implements MigrationInterface {
  name = "AddDjPinToEvents1732305000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter la colonne dj_pin_hash à la table events
    await queryRunner.addColumn(
      "events",
      new TableColumn({
        name: "dj_pin_hash",
        type: "varchar",
        length: "255",
        isNullable: true,
      })
    );

    console.log("✅ Migration: Colonne 'dj_pin_hash' ajoutée à 'events'");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer la colonne en cas de rollback
    await queryRunner.dropColumn("events", "dj_pin_hash");

    console.log("⚠️ Rollback: Colonne 'dj_pin_hash' supprimée de 'events'");
  }
}
