-- Migration pour transformer l'application en système multi-tenant
-- Étape 1: Créer les nouvelles tables multi-tenant

-- Table des tenants (clients)
CREATE TABLE `tenants` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(100) NULL UNIQUE,
  `custom_domain` varchar(100) NULL UNIQUE,
  `subscription_plan` enum('TRIAL','BASIC','PRO','ENTERPRISE') NOT NULL DEFAULT 'TRIAL',
  `subscription_status` enum('ACTIVE','EXPIRED','CANCELLED','PAST_DUE') NOT NULL DEFAULT 'ACTIVE',
  `subscription_expires_at` datetime NULL,
  `billing_email` varchar(255) NOT NULL,
  `stripe_customer_id` varchar(255) NULL,
  `stripe_subscription_id` varchar(255) NULL,
  `max_concurrent_events` int NOT NULL DEFAULT 1,
  `max_players_per_event` int NOT NULL DEFAULT 20,
  `max_users` int NOT NULL DEFAULT 5,
  `settings_json` longtext NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_slug` (`slug`),
  KEY `idx_tenant_domain` (`custom_domain`),
  KEY `idx_tenant_subscription` (`subscription_status`, `subscription_expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des utilisateurs par tenant
CREATE TABLE `tenant_users` (
  `id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('OWNER','ADMIN','DJ','VIEWER') NOT NULL DEFAULT 'VIEWER',
  `display_name` varchar(255) NULL,
  `first_name` varchar(100) NULL,
  `last_name` varchar(100) NULL,
  `last_login_at` datetime NULL,
  `email_verified_at` datetime NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `preferences_json` longtext NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_user_email` (`tenant_id`, `email`),
  KEY `idx_tenant_user_role` (`tenant_id`, `role`),
  UNIQUE KEY `uq_tenant_user_email` (`tenant_id`, `email`),
  CONSTRAINT `fk_tenant_users_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des sessions payantes
CREATE TABLE `tenant_sessions` (
  `id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NULL,
  `duration_days` int NOT NULL,
  `starts_at` datetime NOT NULL,
  `expires_at` datetime NOT NULL,
  `max_events` int NOT NULL DEFAULT 10,
  `max_players_per_event` int NOT NULL DEFAULT 100,
  `max_total_players` int NOT NULL DEFAULT 1000,
  `payment_status` enum('PENDING','PAID','EXPIRED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `amount_paid` decimal(10,2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'EUR',
  `payment_reference` varchar(255) NULL,
  `stripe_checkout_session_id` varchar(255) NULL,
  `paid_at` datetime NULL,
  `metadata_json` longtext NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_session_dates` (`tenant_id`, `starts_at`, `expires_at`),
  KEY `idx_session_payment` (`payment_status`, `expires_at`),
  CONSTRAINT `fk_tenant_sessions_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des paiements
CREATE TABLE `payments` (
  `id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `session_id` varchar(36) NULL,
  `payment_type` enum('SUBSCRIPTION','SESSION','ADDON') NOT NULL DEFAULT 'SESSION',
  `payment_method` enum('STRIPE','PAYPAL','BANK_TRANSFER','OTHER') NOT NULL DEFAULT 'STRIPE',
  `status` enum('PENDING','PROCESSING','PAID','FAILED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'EUR',
  `tax_amount` decimal(10,2) NULL,
  `discount_amount` decimal(10,2) NULL,
  `stripe_payment_intent_id` varchar(255) NULL,
  `stripe_checkout_session_id` varchar(255) NULL,
  `external_transaction_id` varchar(255) NULL,
  `billing_address` varchar(500) NULL,
  `billing_country` varchar(100) NULL,
  `billing_email` varchar(255) NULL,
  `customer_name` varchar(255) NULL,
  `description` varchar(500) NOT NULL,
  `metadata_json` longtext NULL,
  `paid_at` datetime NULL,
  `failed_at` datetime NULL,
  `refunded_at` datetime NULL,
  `failure_reason` text NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_payments` (`tenant_id`, `status`, `created_at`),
  KEY `idx_payment_external` (`stripe_payment_intent_id`),
  CONSTRAINT `fk_payments_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_session` FOREIGN KEY (`session_id`) REFERENCES `tenant_sessions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter les colonnes tenant_id aux tables existantes (sans contraintes FK pour l'instant)
ALTER TABLE `events`
ADD COLUMN `tenant_id` varchar(36) NULL AFTER `id`,
ADD COLUMN `session_id` varchar(36) NULL AFTER `tenant_id`;

ALTER TABLE `teams`
ADD COLUMN `tenant_id` varchar(36) NULL AFTER `id`;

ALTER TABLE `players`
ADD COLUMN `tenant_id` varchar(36) NULL AFTER `id`;

ALTER TABLE `rounds`
ADD COLUMN `tenant_id` varchar(36) NULL AFTER `id`;

ALTER TABLE `round_songs`
ADD COLUMN `tenant_id` varchar(36) NULL AFTER `id`;

ALTER TABLE `answers`
ADD COLUMN `tenant_id` varchar(36) NULL AFTER `id`;

ALTER TABLE `scores`
ADD COLUMN `tenant_id` varchar(36) NULL AFTER `id`;

-- Modifier la table event_staff pour supporter les nouveaux utilisateurs tenant
ALTER TABLE `event_staff`
ADD COLUMN `tenant_user_id` varchar(36) NULL AFTER `id`,
MODIFY COLUMN `organizer_id` bigint unsigned NULL;

-- Rendre la colonne organizer_id nullable dans events pour compatibilité
ALTER TABLE `events`
MODIFY COLUMN `organizer_id` bigint unsigned NULL;

-- Créer un tenant par défaut pour la migration
INSERT INTO `tenants` (
  `id`,
  `name`,
  `slug`,
  `subscription_plan`,
  `billing_email`,
  `max_concurrent_events`,
  `max_players_per_event`,
  `created_at`
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Tenant',
  'default',
  'ENTERPRISE',
  'admin@blindtest.local',
  999,
  999,
  NOW()
);

-- Migrer les données existantes vers le tenant par défaut
UPDATE `events` SET `tenant_id` = '00000000-0000-0000-0000-000000000001' WHERE `tenant_id` IS NULL;
UPDATE `teams` SET `tenant_id` = '00000000-0000-0000-0000-000000000001' WHERE `tenant_id` IS NULL;
UPDATE `players` SET `tenant_id` = '00000000-0000-0000-0000-000000000001' WHERE `tenant_id` IS NULL;
UPDATE `rounds` SET `tenant_id` = '00000000-0000-0000-0000-000000000001' WHERE `tenant_id` IS NULL;
UPDATE `round_songs` SET `tenant_id` = '00000000-0000-0000-0000-000000000001' WHERE `tenant_id` IS NULL;
UPDATE `answers` SET `tenant_id` = '00000000-0000-0000-0000-000000000001' WHERE `tenant_id` IS NULL;
UPDATE `scores` SET `tenant_id` = '00000000-0000-0000-0000-000000000001' WHERE `tenant_id` IS NULL;

-- Ajouter les index après la migration des données
ALTER TABLE `events`
ADD KEY `idx_event_tenant` (`tenant_id`, `code`),
ADD KEY `idx_event_tenant_session` (`tenant_id`, `session_id`);

ALTER TABLE `teams`
ADD KEY `idx_team_tenant` (`tenant_id`, `event_id`);

ALTER TABLE `players`
ADD KEY `idx_player_tenant` (`tenant_id`, `event_id`);

ALTER TABLE `rounds`
ADD KEY `idx_round_tenant` (`tenant_id`, `event_id`);

ALTER TABLE `round_songs`
ADD KEY `idx_roundsong_tenant` (`tenant_id`, `round_id`);

ALTER TABLE `answers`
ADD KEY `idx_answer_tenant` (`tenant_id`, `round_song_id`);

ALTER TABLE `scores`
ADD KEY `idx_score_tenant` (`tenant_id`, `event_id`);

-- Les index pour event_staff seront ajoutés après la création de la colonne

-- Ajouter les contraintes de clés étrangères après migration des données
ALTER TABLE `events`
ADD CONSTRAINT `fk_events_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_events_session` FOREIGN KEY (`session_id`) REFERENCES `tenant_sessions` (`id`) ON DELETE SET NULL,
MODIFY COLUMN `tenant_id` varchar(36) NOT NULL;

-- Rendre tenant_id obligatoire sur toutes les tables après migration
ALTER TABLE `teams`
MODIFY COLUMN `tenant_id` varchar(36) NOT NULL,
ADD CONSTRAINT `fk_teams_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

ALTER TABLE `players`
MODIFY COLUMN `tenant_id` varchar(36) NOT NULL,
ADD CONSTRAINT `fk_players_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

ALTER TABLE `rounds`
MODIFY COLUMN `tenant_id` varchar(36) NOT NULL,
ADD CONSTRAINT `fk_rounds_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

ALTER TABLE `round_songs`
MODIFY COLUMN `tenant_id` varchar(36) NOT NULL,
ADD CONSTRAINT `fk_round_songs_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

ALTER TABLE `answers`
MODIFY COLUMN `tenant_id` varchar(36) NOT NULL,
ADD CONSTRAINT `fk_answers_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

ALTER TABLE `scores`
MODIFY COLUMN `tenant_id` varchar(36) NOT NULL,
ADD CONSTRAINT `fk_scores_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

-- Contrainte et index pour event_staff (après création de la colonne tenant_user_id)
ALTER TABLE `event_staff`
ADD KEY `idx_event_staff_tenant_user` (`event_id`, `tenant_user_id`, `role`),
ADD UNIQUE KEY `uq_event_staff_tenant` (`event_id`, `tenant_user_id`, `role`),
ADD CONSTRAINT `fk_event_staff_tenant_user` FOREIGN KEY (`tenant_user_id`) REFERENCES `tenant_users` (`id`) ON DELETE CASCADE;