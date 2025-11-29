import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveCustomDomain1759900000000 implements MigrationInterface {
  name = 'RemoveCustomDomain1759900000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Supprimer l'index unique sur custom_domain s'il existe
    const table = await queryRunner.getTable("tenants");
    const customDomainIndex = table?.indices.find(index =>
      index.columnNames.includes("custom_domain")
    );

    if (customDomainIndex) {
      await queryRunner.query(`DROP INDEX \`${customDomainIndex.name}\` ON \`tenants\``);
    }

    // Supprimer la colonne custom_domain
    await queryRunner.query(`ALTER TABLE \`tenants\` DROP COLUMN \`custom_domain\``);

    console.log('✅ Migration RemoveCustomDomain1759900000000 completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recréer la colonne custom_domain en cas de rollback
    await queryRunner.query(
      `ALTER TABLE \`tenants\` ADD \`custom_domain\` varchar(100) NULL`
    );

    // Recréer l'index unique
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_custom_domain\` ON \`tenants\` (\`custom_domain\`)`
    );

    console.log('✅ Rollback RemoveCustomDomain1759900000000 completed');
  }
}
