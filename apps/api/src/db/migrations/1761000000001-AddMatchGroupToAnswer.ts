import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddMatchGroupToAnswer1761000000001 implements MigrationInterface {
  name = 'AddMatchGroupToAnswer1761000000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier si la colonne existe déjà
    const table = await queryRunner.getTable("answers");
    const hasMatchGroup = table?.columns.find(column => column.name === "match_group");

    if (!hasMatchGroup) {
      // Ajouter la colonne match_group
      await queryRunner.addColumn("answers", new TableColumn({
        name: "match_group",
        type: "tinyint",
        width: 1,
        default: 0,
        isNullable: false,
      }));

      console.log('✅ Migration AddMatchGroupToAnswer1761000000001: Colonne match_group ajoutée');
    } else {
      console.log('ℹ️ Migration AddMatchGroupToAnswer1761000000001: Colonne match_group existe déjà');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer la colonne en cas de rollback
    const table = await queryRunner.getTable("answers");
    const hasMatchGroup = table?.columns.find(column => column.name === "match_group");

    if (hasMatchGroup) {
      await queryRunner.dropColumn("answers", "match_group");
      console.log('✅ Rollback AddMatchGroupToAnswer1761000000001: Colonne match_group supprimée');
    }
  }
}
