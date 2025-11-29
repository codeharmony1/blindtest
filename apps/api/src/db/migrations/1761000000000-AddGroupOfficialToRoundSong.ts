import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddGroupOfficialToRoundSong1761000000000 implements MigrationInterface {
  name = 'AddGroupOfficialToRoundSong1761000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier si la colonne existe déjà
    const table = await queryRunner.getTable("round_songs");
    const hasGroupOfficial = table?.columns.find(column => column.name === "group_official");

    if (!hasGroupOfficial) {
      // Ajouter la colonne group_official
      await queryRunner.addColumn("round_songs", new TableColumn({
        name: "group_official",
        type: "varchar",
        length: "255",
        isNullable: true,
      }));

      console.log('✅ Migration AddGroupOfficialToRoundSong1761000000000: Colonne group_official ajoutée');
    } else {
      console.log('ℹ️ Migration AddGroupOfficialToRoundSong1761000000000: Colonne group_official existe déjà');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer la colonne en cas de rollback
    const table = await queryRunner.getTable("round_songs");
    const hasGroupOfficial = table?.columns.find(column => column.name === "group_official");

    if (hasGroupOfficial) {
      await queryRunner.dropColumn("round_songs", "group_official");
      console.log('✅ Rollback AddGroupOfficialToRoundSong1761000000000: Colonne group_official supprimée');
    }
  }
}
