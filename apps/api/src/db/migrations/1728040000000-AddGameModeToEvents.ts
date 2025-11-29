import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGameModeToEvents1728040000000 implements MigrationInterface {
    name = 'AddGameModeToEvents1728040000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter la colonne game_mode à la table events
        await queryRunner.query(`
            ALTER TABLE \`events\`
            ADD COLUMN \`game_mode\` enum('TEAM', 'SOLO') NOT NULL DEFAULT 'TEAM'
        `);

        // Mettre à jour tous les événements existants en mode TEAM (rétrocompatibilité)
        await queryRunner.query(`
            UPDATE \`events\`
            SET \`game_mode\` = 'TEAM'
            WHERE \`game_mode\` IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer la colonne game_mode
        await queryRunner.query(`
            ALTER TABLE \`events\`
            DROP COLUMN \`game_mode\`
        `);
    }
}
