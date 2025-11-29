import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddGroupToRoundSong1730053000000 implements MigrationInterface {
  name = "AddGroupToRoundSong1730053000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter la colonne group_official à la table round_songs
    await queryRunner.addColumn(
      "round_songs",
      new TableColumn({
        name: "group_official",
        type: "varchar",
        length: "255",
        isNullable: true,
      })
    );

    console.log("✅ Migration: Colonne 'group_official' ajoutée à 'round_songs'");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer la colonne en cas de rollback
    await queryRunner.dropColumn("round_songs", "group_official");

    console.log("⚠️ Rollback: Colonne 'group_official' supprimée de 'round_songs'");
  }
}
