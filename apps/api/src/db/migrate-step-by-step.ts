import { AppDataSource } from './data-source';
import * as fs from 'fs';
import * as path from 'path';

async function runStepByStepMigration() {
  try {
    console.log('🚀 Démarrage de la migration multi-tenant étape par étape...');

    // Initialiser la connexion à la base de données
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Connexion à la base de données établie');
    }

    // Étape 1: Créer les nouvelles tables multi-tenant
    console.log('\n📋 Étape 1: Création des tables tenants');

    const step1Commands = [
      `CREATE TABLE IF NOT EXISTS tenants (
        id varchar(36) NOT NULL,
        name varchar(255) NOT NULL,
        slug varchar(100) NULL UNIQUE,
        custom_domain varchar(100) NULL UNIQUE,
        subscription_plan enum('TRIAL','BASIC','PRO','ENTERPRISE') NOT NULL DEFAULT 'TRIAL',
        subscription_status enum('ACTIVE','EXPIRED','CANCELLED','PAST_DUE') NOT NULL DEFAULT 'ACTIVE',
        subscription_expires_at datetime NULL,
        billing_email varchar(255) NOT NULL,
        stripe_customer_id varchar(255) NULL,
        stripe_subscription_id varchar(255) NULL,
        max_concurrent_events int NOT NULL DEFAULT 1,
        max_players_per_event int NOT NULL DEFAULT 20,
        max_users int NOT NULL DEFAULT 5,
        settings_json longtext NULL,
        is_active tinyint(1) NOT NULL DEFAULT 1,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_tenant_slug (slug),
        KEY idx_tenant_domain (custom_domain),
        KEY idx_tenant_subscription (subscription_status, subscription_expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS tenant_users (
        id varchar(36) NOT NULL,
        tenant_id varchar(36) NOT NULL,
        email varchar(255) NOT NULL,
        password_hash varchar(255) NOT NULL,
        role enum('OWNER','ADMIN','DJ','VIEWER') NOT NULL DEFAULT 'VIEWER',
        display_name varchar(255) NULL,
        first_name varchar(100) NULL,
        last_name varchar(100) NULL,
        last_login_at datetime NULL,
        email_verified_at datetime NULL,
        is_active tinyint(1) NOT NULL DEFAULT 1,
        preferences_json longtext NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_tenant_user_email (tenant_id, email),
        KEY idx_tenant_user_role (tenant_id, role),
        UNIQUE KEY uq_tenant_user_email (tenant_id, email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS tenant_sessions (
        id varchar(36) NOT NULL,
        tenant_id varchar(36) NOT NULL,
        name varchar(255) NOT NULL,
        description text NULL,
        duration_days int NOT NULL,
        starts_at datetime NOT NULL,
        expires_at datetime NOT NULL,
        max_events int NOT NULL DEFAULT 10,
        max_players_per_event int NOT NULL DEFAULT 100,
        max_total_players int NOT NULL DEFAULT 1000,
        payment_status enum('PENDING','PAID','EXPIRED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
        amount_paid decimal(10,2) NOT NULL,
        currency varchar(3) NOT NULL DEFAULT 'EUR',
        payment_reference varchar(255) NULL,
        stripe_checkout_session_id varchar(255) NULL,
        paid_at datetime NULL,
        metadata_json longtext NULL,
        is_active tinyint(1) NOT NULL DEFAULT 1,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_tenant_session_dates (tenant_id, starts_at, expires_at),
        KEY idx_session_payment (payment_status, expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS payments (
        id varchar(36) NOT NULL,
        tenant_id varchar(36) NOT NULL,
        session_id varchar(36) NULL,
        payment_type enum('SUBSCRIPTION','SESSION','ADDON') NOT NULL DEFAULT 'SESSION',
        payment_method enum('STRIPE','PAYPAL','BANK_TRANSFER','OTHER') NOT NULL DEFAULT 'STRIPE',
        status enum('PENDING','PROCESSING','PAID','FAILED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
        amount decimal(10,2) NOT NULL,
        currency varchar(3) NOT NULL DEFAULT 'EUR',
        tax_amount decimal(10,2) NULL,
        discount_amount decimal(10,2) NULL,
        stripe_payment_intent_id varchar(255) NULL,
        stripe_checkout_session_id varchar(255) NULL,
        external_transaction_id varchar(255) NULL,
        billing_address varchar(500) NULL,
        billing_country varchar(100) NULL,
        billing_email varchar(255) NULL,
        customer_name varchar(255) NULL,
        description varchar(500) NOT NULL,
        metadata_json longtext NULL,
        paid_at datetime NULL,
        failed_at datetime NULL,
        refunded_at datetime NULL,
        failure_reason text NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_tenant_payments (tenant_id, status, created_at),
        KEY idx_payment_external (stripe_payment_intent_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ];

    for (let i = 0; i < step1Commands.length; i++) {
      try {
        console.log(`⚙️  Création table ${i + 1}/${step1Commands.length}`);
        await AppDataSource.query(step1Commands[i]);
      } catch (error: any) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
          console.log(`⚠️  Table déjà existante - ignoré`);
        } else {
          throw error;
        }
      }
    }

    // Créer le tenant par défaut
    console.log('\n📋 Étape 2: Création du tenant par défaut');
    try {
      await AppDataSource.query(`
        INSERT IGNORE INTO tenants (
          id, name, slug, subscription_plan, billing_email, max_concurrent_events, max_players_per_event, created_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000001',
          'Default Tenant',
          'default',
          'ENTERPRISE',
          'admin@blindtest.local',
          999,
          999,
          NOW()
        )
      `);
      console.log('✅ Tenant par défaut créé');
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('⚠️  Tenant par défaut déjà existant');
      } else {
        throw error;
      }
    }

    // Étape 3: Ajouter les contraintes FK aux nouvelles tables
    console.log('\n📋 Étape 3: Contraintes FK nouvelles tables');
    const step3Commands = [
      'ALTER TABLE tenant_users ADD CONSTRAINT fk_tenant_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE',
      'ALTER TABLE tenant_sessions ADD CONSTRAINT fk_tenant_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE',
      'ALTER TABLE payments ADD CONSTRAINT fk_payments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE',
      'ALTER TABLE payments ADD CONSTRAINT fk_payments_session FOREIGN KEY (session_id) REFERENCES tenant_sessions(id) ON DELETE SET NULL'
    ];

    for (let i = 0; i < step3Commands.length; i++) {
      try {
        console.log(`⚙️  Contrainte ${i + 1}/${step3Commands.length}`);
        await AppDataSource.query(step3Commands[i]);
      } catch (error: any) {
        if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('Duplicate key name')) {
          console.log(`⚠️  Contrainte déjà existante - ignoré`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Migration étape par étape terminée avec succès !');
    console.log('🎉 Les tables multi-tenant sont prêtes !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter la migration si ce script est appelé directement
if (require.main === module) {
  runStepByStepMigration();
}

export { runStepByStepMigration };