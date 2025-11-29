-- Migration: Ajouter colonne status et completed_at à la table events
-- Date: 2025-10-06
-- Description: Permet de distinguer les événements DRAFT, ACTIVE, et COMPLETED

-- Ajouter la colonne status (ENUM)
ALTER TABLE `events`
ADD COLUMN `status` ENUM('DRAFT', 'ACTIVE', 'COMPLETED')
NOT NULL DEFAULT 'ACTIVE'
AFTER `game_mode`;

-- Ajouter la colonne completed_at (DATETIME nullable)
ALTER TABLE `events`
ADD COLUMN `completed_at` DATETIME NULL
AFTER `created_at`;

-- Index pour faciliter les requêtes sur le status
CREATE INDEX `idx_event_status` ON `events` (`status`);

-- Mettre à jour les événements existants (tous considérés comme ACTIVE par défaut)
UPDATE `events` SET `status` = 'ACTIVE' WHERE `status` IS NULL;

-- Commentaires
COMMENT ON COLUMN `events`.`status` IS 'Statut de l''événement: DRAFT (brouillon), ACTIVE (en cours), COMPLETED (terminé)';
COMMENT ON COLUMN `events`.`completed_at` IS 'Date et heure de fin de l''événement (NULL si non terminé)';
