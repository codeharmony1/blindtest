import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class CreateSuperAdminAndAuditLog1759525217343 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Créer la table super_admins
        await queryRunner.createTable(
            new Table({
                name: "super_admins",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        length: "36",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "(UUID())",
                    },
                    {
                        name: "email",
                        type: "varchar",
                        length: "255",
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: "password_hash",
                        type: "varchar",
                        length: "255",
                        isNullable: false,
                    },
                    {
                        name: "name",
                        type: "varchar",
                        length: "255",
                        isNullable: true,
                    },
                    {
                        name: "last_login_at",
                        type: "datetime",
                        isNullable: true,
                    },
                    {
                        name: "is_active",
                        type: "boolean",
                        default: true,
                    },
                    {
                        name: "mfa_enabled",
                        type: "boolean",
                        default: false,
                    },
                    {
                        name: "mfa_secret",
                        type: "varchar",
                        length: "255",
                        isNullable: true,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );

        // Index sur email
        await queryRunner.createIndex(
            "super_admins",
            new TableIndex({
                name: "idx_super_admin_email",
                columnNames: ["email"],
                isUnique: true,
            })
        );

        // Créer la table audit_logs
        await queryRunner.createTable(
            new Table({
                name: "audit_logs",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        length: "36",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "(UUID())",
                    },
                    {
                        name: "admin_id",
                        type: "varchar",
                        length: "36",
                        isNullable: true,
                    },
                    {
                        name: "action",
                        type: "enum",
                        enum: [
                            "login",
                            "logout",
                            "create_tenant",
                            "update_tenant",
                            "suspend_tenant",
                            "reactivate_tenant",
                            "delete_tenant",
                            "update_plan",
                            "stop_event",
                            "take_dj_control",
                            "impersonate_tenant",
                        ],
                        isNullable: false,
                    },
                    {
                        name: "target_type",
                        type: "enum",
                        enum: ["tenant", "event", "session", "user", "system"],
                        isNullable: true,
                    },
                    {
                        name: "target_id",
                        type: "varchar",
                        length: "36",
                        isNullable: true,
                    },
                    {
                        name: "metadata_json",
                        type: "longtext",
                        isNullable: true,
                    },
                    {
                        name: "ip_address",
                        type: "varchar",
                        length: "255",
                        isNullable: true,
                    },
                    {
                        name: "user_agent",
                        type: "varchar",
                        length: "500",
                        isNullable: true,
                    },
                    {
                        name: "timestamp",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );

        // Index pour optimiser les recherches de logs
        await queryRunner.createIndex(
            "audit_logs",
            new TableIndex({
                name: "idx_audit_admin",
                columnNames: ["admin_id", "timestamp"],
            })
        );

        await queryRunner.createIndex(
            "audit_logs",
            new TableIndex({
                name: "idx_audit_action",
                columnNames: ["action", "timestamp"],
            })
        );

        await queryRunner.createIndex(
            "audit_logs",
            new TableIndex({
                name: "idx_audit_target",
                columnNames: ["target_type", "target_id"],
            })
        );

        // Clé étrangère audit_logs -> super_admins
        await queryRunner.createForeignKey(
            "audit_logs",
            new TableForeignKey({
                name: "fk_audit_log_admin",
                columnNames: ["admin_id"],
                referencedTableName: "super_admins",
                referencedColumnNames: ["id"],
                onDelete: "SET NULL",
            })
        );

        // Mettre à jour la table tenants pour ajouter support des nouveaux plans
        // Note: Les colonnes subscription_plan et subscription_status existent déjà
        // On va juste s'assurer que les nouveaux plans sont supportés
        await queryRunner.query(`
            ALTER TABLE tenants
            MODIFY COLUMN subscription_plan ENUM('TRIAL', 'BASIC', 'PRO', 'ENTERPRISE', 'DEMO', 'PER_EVENT', 'MONTHLY')
            DEFAULT 'DEMO'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restaurer l'ancienne définition de subscription_plan
        await queryRunner.query(`
            ALTER TABLE tenants
            MODIFY COLUMN subscription_plan ENUM('TRIAL', 'BASIC', 'PRO', 'ENTERPRISE')
            DEFAULT 'TRIAL'
        `);

        // Supprimer la clé étrangère
        await queryRunner.dropForeignKey("audit_logs", "fk_audit_log_admin");

        // Supprimer les index de audit_logs
        await queryRunner.dropIndex("audit_logs", "idx_audit_target");
        await queryRunner.dropIndex("audit_logs", "idx_audit_action");
        await queryRunner.dropIndex("audit_logs", "idx_audit_admin");

        // Supprimer la table audit_logs
        await queryRunner.dropTable("audit_logs");

        // Supprimer l'index de super_admins
        await queryRunner.dropIndex("super_admins", "idx_super_admin_email");

        // Supprimer la table super_admins
        await queryRunner.dropTable("super_admins");
    }

}
