-- Ajouter la colonne match_group manquante à la table answers
-- Cette colonne est nécessaire pour le système de matching dans l'entité Answer

USE blindtest;

-- Vérifier si la colonne existe déjà avant de l'ajouter
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'blindtest'
    AND TABLE_NAME = 'answers'
    AND COLUMN_NAME = 'match_group'
);

-- Ajouter la colonne si elle n'existe pas
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE answers ADD COLUMN match_group TINYINT(1) NOT NULL DEFAULT 0 AFTER match_artist',
    'SELECT "La colonne match_group existe déjà" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier la structure finale
DESCRIBE answers;
