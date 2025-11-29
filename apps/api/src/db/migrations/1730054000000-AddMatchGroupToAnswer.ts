import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddMatchGroupToAnswer1730054000000 implements MigrationInterface {
  name = "AddMatchGroupToAnswer1730054000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter la colonne match_group à la table answers
    await queryRunner.addColumn(
      "answers",
      new TableColumn({
        name: "match_group",
        type: "tinyint",
        width: 1,
        default: 0,
      })
    );

    console.log("✅ Migration: Colonne 'match_group' ajoutée à 'answers'");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer la colonne en cas de rollback
    await queryRunner.dropColumn("answers", "match_group");

    console.log("⚠️ Rollback: Colonne 'match_group' supprimée de 'answers'");
  }
}
