import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTableMode1762000000000 implements MigrationInterface {
    name = 'AddTableMode1762000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Créer la table `tables`
        await queryRunner.query(`
            CREATE TABLE \`tables\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`event_id\` bigint UNSIGNED NOT NULL,
                \`tenant_id\` varchar(36) NOT NULL,
                \`name\` varchar(100) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                INDEX \`idx_table_tenant\` (\`tenant_id\`, \`event_id\`),
                INDEX \`IDX_tables_tenant_id\` (\`tenant_id\`),
                UNIQUE INDEX \`uq_table_name_per_event\` (\`event_id\`, \`name\`),
                CONSTRAINT \`FK_tables_event_id\` FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
            ) ENGINE=InnoDB
        `);

        // 2. Ajouter la colonne table_mode à la table events
        await queryRunner.query(`
            ALTER TABLE \`events\`
            ADD COLUMN \`table_mode\` tinyint NOT NULL DEFAULT 0
        `);

        // 3. Ajouter les colonnes liées au mode table dans teams
        await queryRunner.query(`
            ALTER TABLE \`teams\`
            ADD COLUMN \`table_id\` bigint UNSIGNED NULL,
            ADD COLUMN \`manual_participants_count\` int NULL,
            ADD COLUMN \`captain_player_id\` bigint UNSIGNED NULL
        `);

        // 4. Ajouter la contrainte de clé étrangère pour teams.table_id
        await queryRunner.query(`
            ALTER TABLE \`teams\`
            ADD CONSTRAINT \`FK_teams_table_id\`
            FOREIGN KEY (\`table_id\`)
            REFERENCES \`tables\`(\`id\`)
            ON DELETE SET NULL
            ON UPDATE NO ACTION
        `);

        // 5. Ajouter un index sur teams.table_id
        await queryRunner.query(`
            CREATE INDEX \`IDX_teams_table_id\` ON \`teams\` (\`table_id\`)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer dans l'ordre inverse

        // 1. Supprimer l'index sur teams.table_id
        await queryRunner.query(`
            DROP INDEX \`IDX_teams_table_id\` ON \`teams\`
        `);

        // 2. Supprimer la contrainte de clé étrangère
        await queryRunner.query(`
            ALTER TABLE \`teams\`
            DROP FOREIGN KEY \`FK_teams_table_id\`
        `);

        // 3. Supprimer les colonnes liées au mode table de teams
        await queryRunner.query(`
            ALTER TABLE \`teams\`
            DROP COLUMN \`captain_player_id\`,
            DROP COLUMN \`manual_participants_count\`,
            DROP COLUMN \`table_id\`
        `);

        // 4. Supprimer la colonne table_mode de events
        await queryRunner.query(`
            ALTER TABLE \`events\`
            DROP COLUMN \`table_mode\`
        `);

        // 5. Supprimer la table tables
        await queryRunner.query(`
            DROP TABLE \`tables\`
        `);
    }
}
