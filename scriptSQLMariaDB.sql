/* =========================================================
   Blind Test - Schéma MariaDB (DDL)
   Auteur : Alexandre (avec aide IA)
   ========================================================= */

-- (Optionnel) crée la base puis sélectionne-la
CREATE DATABASE IF NOT EXISTS blindtest
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE blindtest;

-- Sécurité/robustesse de session (optionnel)
SET NAMES utf8mb4;
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
SET SESSION innodb_strict_mode = ON;

/* =========================================================
   0) DROP pour réexécuter proprement en dev (optionnel)
   ⚠️ Décommente ces lignes si tu veux recréer à neuf
-----------------------------------------------------------
-- SET FOREIGN_KEY_CHECKS=0;
-- DROP VIEW IF EXISTS vw_leaderboard_by_event;
-- DROP TRIGGER IF EXISTS trg_answers_ai;
-- DROP TRIGGER IF EXISTS trg_answers_au;
-- DROP TRIGGER IF EXISTS trg_answers_ad;
-- DROP TABLE IF EXISTS scores, answers, round_songs, rounds,
--                        players, teams, event_staff, events,
--                        organizers;
-- SET FOREIGN_KEY_CHECKS=1;
========================================================= */

 /* ========================================================
    1) Comptes "staff" (Admin/DJ/Display)
    - organizers : comptes staff (login)
    - event_staff : rôle d'un staff sur un événement
    (les joueurs ne sont pas ici : cf. players)
  ======================================================== */

CREATE TABLE organizers (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  display_name    VARCHAR(255) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_organizers_email (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE events (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organizer_id    BIGINT UNSIGNED NOT NULL,
  code            VARCHAR(16) NOT NULL,                 -- code court pour QR (unique)
  name            VARCHAR(255) NOT NULL,
  settings_json   JSON NULL,                            -- paramètres (durées défaut, options affichage, seuils, purge, thème…)
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_events_code (code),
  KEY idx_events_organizer (organizer_id),
  CONSTRAINT fk_events_organizer
    FOREIGN KEY (organizer_id) REFERENCES organizers(id)
    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Staff affecté à un événement (Admin / DJ / DISPLAY)
CREATE TABLE event_staff (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id        BIGINT UNSIGNED NOT NULL,
  organizer_id    BIGINT UNSIGNED NOT NULL,
  role            ENUM('ADMIN','DJ','DISPLAY') NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_event_staff (event_id, organizer_id, role),
  KEY idx_event_staff_event (event_id),
  KEY idx_event_staff_org (organizer_id),
  CONSTRAINT fk_event_staff_event
    FOREIGN KEY (event_id) REFERENCES events(id)
    ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_event_staff_organizer
    FOREIGN KEY (organizer_id) REFERENCES organizers(id)
    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

 /* ========================================================
    2) Équipes & joueurs
  ======================================================== */

CREATE TABLE teams (
  id                            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id                      BIGINT UNSIGNED NOT NULL,
  name                          VARCHAR(100) NOT NULL,
  password_hash                 VARCHAR(255) NULL,   -- si tu actives un mot de passe d'équipe
  manual_participants_count     SMALLINT UNSIGNED NOT NULL DEFAULT 0, -- invités sans téléphone
  captain_player_id             BIGINT UNSIGNED NULL,  -- FK ajoutée après création de players
  created_at                    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_team_name_per_event (event_id, name),
  KEY idx_teams_event (event_id),
  CONSTRAINT fk_teams_event
    FOREIGN KEY (event_id) REFERENCES events(id)
    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE players (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id        BIGINT UNSIGNED NOT NULL,
  team_id         BIGINT UNSIGNED NOT NULL,
  nickname        VARCHAR(100) NOT NULL,
  is_captain      TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_player_unique_in_event (event_id, nickname),  -- empêche deux pseudos identiques dans le même événement
  KEY idx_players_event (event_id),
  KEY idx_players_team (team_id),
  CONSTRAINT fk_players_event
    FOREIGN KEY (event_id) REFERENCES events(id)
    ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_players_team
    FOREIGN KEY (team_id) REFERENCES teams(id)
    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Ajout de la contrainte (capitaine) une fois players créé (évite circularité)
ALTER TABLE teams
  ADD CONSTRAINT fk_teams_captain
  FOREIGN KEY (captain_player_id) REFERENCES players(id)
  ON DELETE SET NULL ON UPDATE RESTRICT;

 /* ========================================================
    3) Rounds & morceaux
  ======================================================== */

CREATE TABLE rounds (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id              BIGINT UNSIGNED NOT NULL,
  name                  VARCHAR(255) NULL,          -- ex: "Blind Test #1"
  default_duration_s    SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  total_songs           SMALLINT UNSIGNED NOT NULL DEFAULT 20,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_rounds_event (event_id),
  CONSTRAINT fk_rounds_event
    FOREIGN KEY (event_id) REFERENCES events(id)
    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE round_songs (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  round_id          BIGINT UNSIGNED NOT NULL,
  idx               SMALLINT UNSIGNED NOT NULL, -- ordre dans le round (1..N)
  mode              ENUM('prepared','freestyle') NOT NULL DEFAULT 'prepared',
  title_official    VARCHAR(255) NULL,
  artist_official   VARCHAR(255) NULL,
  aliases_json      JSON NULL,                   -- ["MJ","Michael J.","ACDC","AC/DC"]...
  duration_s        SMALLINT UNSIGNED NULL,      -- si NULL -> prendre default_duration_s du round
  status            ENUM('pending','open','closed','scored') NOT NULL DEFAULT 'pending',
  started_at        DATETIME NULL,
  ended_at          DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roundsong_position (round_id, idx),
  KEY idx_round_songs_round (round_id),
  CONSTRAINT fk_round_songs_round
    FOREIGN KEY (round_id) REFERENCES rounds(id)
    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

 /* ========================================================
    4) Réponses & Scores
  ======================================================== */

CREATE TABLE answers (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  round_song_id   BIGINT UNSIGNED NOT NULL,
  team_id         BIGINT UNSIGNED NOT NULL,
  text_raw        VARCHAR(255) NOT NULL,       -- ce que le capitaine a saisi
  text_norm       VARCHAR(255) NULL,           -- version normalisée (serveur)
  submitted_at    DATETIME(3) NOT NULL,        -- horodatage serveur (ms)
  match_title     TINYINT(1) NOT NULL DEFAULT 0,
  match_artist    TINYINT(1) NOT NULL DEFAULT 0,
  points          SMALLINT UNSIGNED NOT NULL DEFAULT 0,  -- 0 / 1 / 2
  PRIMARY KEY (id),
  UNIQUE KEY uq_answer_per_song_team (round_song_id, team_id), -- 1 réponse "courante" par équipe et par morceau
  KEY idx_answers_song (round_song_id),
  KEY idx_answers_team (team_id),
  CONSTRAINT fk_answers_song
    FOREIGN KEY (round_song_id) REFERENCES round_songs(id)
    ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_answers_team
    FOREIGN KEY (team_id) REFERENCES teams(id)
    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE scores (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id        BIGINT UNSIGNED NOT NULL,
  team_id         BIGINT UNSIGNED NOT NULL,
  total_points    INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_scores_team_event (event_id, team_id),
  KEY idx_scores_event (event_id),
  CONSTRAINT fk_scores_event
    FOREIGN KEY (event_id) REFERENCES events(id)
    ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_scores_team
    FOREIGN KEY (team_id) REFERENCES teams(id)
    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

 /* ========================================================
    5) Vue : Leaderboard calculé (option confort)
    - Permet de recalculer à la volée si besoin
  ======================================================== */
CREATE OR REPLACE VIEW vw_leaderboard_by_event AS
SELECT
  e.id                  AS event_id,
  t.id                  AS team_id,
  t.name                AS team_name,
  COALESCE(SUM(a.points), 0) AS total_points
FROM events e
JOIN teams t          ON t.event_id = e.id
LEFT JOIN answers a   ON a.team_id = t.id
LEFT JOIN round_songs rs ON rs.id = a.round_song_id
LEFT JOIN rounds r    ON r.id = rs.round_id AND r.event_id = e.id
GROUP BY e.id, t.id, t.name;

 /* ========================================================
    6) Triggers : Maintien auto de la table scores
    - INSERT : ajoute NEW.points
    - UPDATE : ajoute (NEW.points - OLD.points)
    - DELETE : retire OLD.points
  ======================================================== */
DELIMITER $$

CREATE TRIGGER trg_answers_ai
AFTER INSERT ON answers
FOR EACH ROW
BEGIN
  DECLARE ev BIGINT UNSIGNED;
  SELECT event_id INTO ev
    FROM teams
   WHERE id = NEW.team_id
   LIMIT 1;

  INSERT INTO scores (event_id, team_id, total_points)
  VALUES (ev, NEW.team_id, NEW.points)
  ON DUPLICATE KEY UPDATE total_points = total_points + VALUES(total_points);
END$$

CREATE TRIGGER trg_answers_au
AFTER UPDATE ON answers
FOR EACH ROW
BEGIN
  DECLARE ev BIGINT UNSIGNED;
  DECLARE delta INT;
  SET delta = NEW.points - OLD.points;

  IF delta <> 0 THEN
    SELECT event_id INTO ev
      FROM teams
     WHERE id = NEW.team_id
     LIMIT 1;

    INSERT INTO scores (event_id, team_id, total_points)
    VALUES (ev, NEW.team_id, GREATEST(delta,0))
    ON DUPLICATE KEY UPDATE total_points = total_points + delta;
  END IF;
END$$

CREATE TRIGGER trg_answers_ad
AFTER DELETE ON answers
FOR EACH ROW
BEGIN
  DECLARE ev BIGINT UNSIGNED;
  SELECT event_id INTO ev
    FROM teams
   WHERE id = OLD.team_id
   LIMIT 1;

  UPDATE scores
     SET total_points = GREATEST(total_points - OLD.points, 0)
   WHERE event_id = ev
     AND team_id  = OLD.team_id;
END$$

DELIMITER ;

 /* ========================================================
    7) Index additionnels utiles (déjà posés pour la plupart)
  ======================================================== */
-- (Placeholders si tu veux en rajouter selon tes requêtes réelles)

 /* ========================================================
    8) Conseils d’utilisation
    - Insère un organizer, crée un event (code unique pour QR)
    - Optionnel : assigne des staff au besoin (event_staff)
    - Crée les teams/players
    - Crée un round + ses songs (ou freestyle en live)
    - Chaque answer mettra à jour scores automatiquement
  ======================================================== */

-- Fin du script
