import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreatePasswordResetTokens1759800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier si la table existe déjà
    const tableExists = await queryRunner.hasTable("password_reset_tokens");

    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: "password_reset_tokens",
          columns: [
            {
              name: "id",
              type: "varchar",
              length: "36",
              isPrimary: true,
              generationStrategy: "uuid",
            },
            {
              name: "email",
              type: "varchar",
              length: "255",
              isNullable: false,
            },
            {
              name: "token",
              type: "varchar",
              length: "255",
              isNullable: false,
            },
            {
              name: "expires_at",
              type: "datetime",
              isNullable: false,
            },
            {
              name: "used",
              type: "boolean",
              default: false,
              isNullable: false,
            },
            {
              name: "used_at",
              type: "datetime",
              isNullable: true,
            },
            {
              name: "created_at",
              type: "datetime",
              default: "CURRENT_TIMESTAMP",
              isNullable: false,
            },
          ],
        }),
        true
      );
    }

    // Créer les indexes seulement s'ils n'existent pas
    const table = await queryRunner.getTable("password_reset_tokens");

    // Index unique sur le token
    const tokenIndexExists = table?.indices.some(index => index.name === "IDX_PASSWORD_RESET_TOKEN");
    if (!tokenIndexExists) {
      await queryRunner.createIndex(
        "password_reset_tokens",
        new TableIndex({
          name: "IDX_PASSWORD_RESET_TOKEN",
          columnNames: ["token"],
          isUnique: true,
        })
      );
    }

    // Index sur email pour recherches
    const emailIndexExists = table?.indices.some(index => index.name === "IDX_PASSWORD_RESET_EMAIL");
    if (!emailIndexExists) {
      await queryRunner.createIndex(
        "password_reset_tokens",
        new TableIndex({
          name: "IDX_PASSWORD_RESET_EMAIL",
          columnNames: ["email"],
        })
      );
    }

    // Index sur expires_at pour nettoyage automatique
    const expiresIndexExists = table?.indices.some(index => index.name === "IDX_PASSWORD_RESET_EXPIRES");
    if (!expiresIndexExists) {
      await queryRunner.createIndex(
        "password_reset_tokens",
        new TableIndex({
          name: "IDX_PASSWORD_RESET_EXPIRES",
          columnNames: ["expires_at"],
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("password_reset_tokens");
  }
}
