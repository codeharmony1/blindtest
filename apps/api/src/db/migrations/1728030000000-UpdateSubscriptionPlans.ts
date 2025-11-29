import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSubscriptionPlans1728030000000 implements MigrationInterface {
    name = 'UpdateSubscriptionPlans1728030000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Ajouter la colonne max_songs_per_event
        await queryRunner.query(`
            ALTER TABLE \`tenants\`
            ADD COLUMN \`max_songs_per_event\` int NULL
        `);

        // 2. Modifier l'enum subscription_plan pour les nouveaux plans
        await queryRunner.query(`
            ALTER TABLE \`tenants\`
            MODIFY COLUMN \`subscription_plan\`
            enum('DEMO', 'PER_EVENT', 'MONTHLY', 'TRIAL', 'BASIC', 'PRO', 'ENTERPRISE')
            DEFAULT 'DEMO'
        `);

        // 3. Ajouter SUSPENDED au statut
        await queryRunner.query(`
            ALTER TABLE \`tenants\`
            MODIFY COLUMN \`subscription_status\`
            enum('ACTIVE', 'EXPIRED', 'CANCELLED', 'PAST_DUE', 'SUSPENDED')
            DEFAULT 'ACTIVE'
        `);

        // 4. Migrer les anciens plans vers les nouveaux
        await queryRunner.query(`
            UPDATE \`tenants\`
            SET \`subscription_plan\` = 'DEMO'
            WHERE \`subscription_plan\` = 'TRIAL'
        `);

        await queryRunner.query(`
            UPDATE \`tenants\`
            SET \`subscription_plan\` = 'MONTHLY'
            WHERE \`subscription_plan\` IN ('BASIC', 'PRO', 'ENTERPRISE')
        `);

        // 5. Définir max_songs_per_event pour les plans DEMO
        await queryRunner.query(`
            UPDATE \`tenants\`
            SET \`max_songs_per_event\` = 5
            WHERE \`subscription_plan\` = 'DEMO'
        `);

        // 6. Supprimer les anciennes valeurs de l'enum
        await queryRunner.query(`
            ALTER TABLE \`tenants\`
            MODIFY COLUMN \`subscription_plan\`
            enum('DEMO', 'PER_EVENT', 'MONTHLY')
            DEFAULT 'DEMO'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback: remettre les anciens enums
        await queryRunner.query(`
            ALTER TABLE \`tenants\`
            MODIFY COLUMN \`subscription_plan\`
            enum('TRIAL', 'BASIC', 'PRO', 'ENTERPRISE')
            DEFAULT 'TRIAL'
        `);

        await queryRunner.query(`
            ALTER TABLE \`tenants\`
            MODIFY COLUMN \`subscription_status\`
            enum('ACTIVE', 'EXPIRED', 'CANCELLED', 'PAST_DUE')
            DEFAULT 'ACTIVE'
        `);

        // Supprimer la colonne max_songs_per_event
        await queryRunner.query(`
            ALTER TABLE \`tenants\`
            DROP COLUMN \`max_songs_per_event\`
        `);
    }
}
