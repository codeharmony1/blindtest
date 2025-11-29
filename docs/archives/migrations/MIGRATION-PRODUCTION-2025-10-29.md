# Migration Production - 29 Octobre 2025

## 🎯 Objectif
Ajouter les colonnes manquantes dans la base de données de production pour supporter les nouvelles fonctionnalités.

## 📋 Colonnes à ajouter

### 1. Colonne `group_official` dans `round_songs`
Permet de stocker le nom du groupe/band pour les chansons.

### 2. Colonne `match_group` dans `answers`
Permet de tracker si la réponse correspond au nom du groupe.

## 🚀 Commandes à exécuter sur le serveur

### Option A : Commande unique (RECOMMANDÉ)

```bash
docker exec -it mariadb mysql -u blindtest_prod -pCOLfd4658_sdRSDFGeryghazZhgolihgvb12354gdsxcgze6587 blindtest_production << 'EOF'
-- Ajouter group_official à round_songs
ALTER TABLE round_songs
ADD COLUMN IF NOT EXISTS group_official VARCHAR(255) NULL
AFTER artist_official;

-- Ajouter match_group à answers
ALTER TABLE answers
ADD COLUMN IF NOT EXISTS match_group TINYINT(1) NOT NULL DEFAULT 0
AFTER match_artist;

-- Vérifier les changements
DESCRIBE round_songs;
DESCRIBE answers;
EOF
```

### Option B : Commandes séparées

```bash
# 1. Se connecter à MariaDB
docker exec -it mariadb mysql -u blindtest_prod -pCOLfd4658_sdRSDFGeryghazZhgolihgvb12354gdsxcgze6587 blindtest_production

# 2. Exécuter les migrations
ALTER TABLE round_songs ADD COLUMN IF NOT EXISTS group_official VARCHAR(255) NULL AFTER artist_official;
ALTER TABLE answers ADD COLUMN IF NOT EXISTS match_group TINYINT(1) NOT NULL DEFAULT 0 AFTER match_artist;

# 3. Vérifier
DESCRIBE round_songs;
DESCRIBE answers;

# 4. Quitter
EXIT;
```

## ✅ Vérification

Après l'exécution des migrations, vérifiez que :

1. **round_songs** contient la colonne `group_official` :
```bash
docker exec -it mariadb mysql -u blindtest_prod -pCOLfd4658_sdRSDFGeryghazZhgolihgvb12354gdsxcgze6587 blindtest_production -e "DESCRIBE round_songs;" | grep group_official
```

2. **answers** contient la colonne `match_group` :
```bash
docker exec -it mariadb mysql -u blindtest_prod -pCOLfd4658_sdRSDFGeryghazZhgolihgvb12354gdsxcgze6587 blindtest_production -e "DESCRIBE answers;" | grep match_group
```

3. **L'application fonctionne** :
```bash
# Tester l'API
curl https://blindtest.codeharmony.fr/api/health

# Tester la création de chanson
curl -X POST https://blindtest.codeharmony.fr/api/rounds/4/songs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "mode": "freestyle",
    "idx": 1,
    "title": "Bohemian Rhapsody",
    "artist": "Freddie Mercury",
    "group": "Queen",
    "duration": 15
  }'
```

## 📊 Structure finale attendue

### round_songs
```sql
CREATE TABLE `round_songs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `round_id` bigint unsigned NOT NULL,
  `tenant_id` varchar(36) DEFAULT NULL,
  `idx` smallint unsigned NOT NULL,
  `mode` enum('prepared','freestyle') DEFAULT 'prepared',
  `title_official` varchar(255) DEFAULT NULL,
  `artist_official` varchar(255) DEFAULT NULL,
  `group_official` varchar(255) DEFAULT NULL,  -- ✅ NOUVEAU
  `aliases_json` longtext,
  `duration_s` smallint unsigned DEFAULT NULL,
  `status` enum('pending','open','closed','scored') DEFAULT 'pending',
  `started_at` datetime DEFAULT NULL,
  `ended_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_roundsong_position` (`round_id`,`idx`),
  KEY `idx_roundsong_tenant` (`tenant_id`,`round_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### answers
```sql
CREATE TABLE `answers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `round_song_id` bigint unsigned NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `team_id` bigint unsigned NOT NULL,
  `text_raw` varchar(255) NOT NULL,
  `text_norm` varchar(255) DEFAULT NULL,
  `submitted_at` datetime(3) NOT NULL,
  `match_title` tinyint(1) DEFAULT '0',
  `match_artist` tinyint(1) DEFAULT '0',
  `match_group` tinyint(1) DEFAULT '0',  -- ✅ NOUVEAU
  `points` smallint unsigned DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_answer_per_song_team` (`round_song_id`,`team_id`),
  KEY `idx_answer_tenant` (`tenant_id`,`round_song_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 🔄 Rollback (en cas de problème)

Si vous devez annuler les changements :

```sql
-- Supprimer group_official
ALTER TABLE round_songs DROP COLUMN group_official;

-- Supprimer match_group
ALTER TABLE answers DROP COLUMN match_group;
```

## 📝 Notes

- Ces migrations sont **idempotentes** (peuvent être exécutées plusieurs fois sans erreur grâce à `IF NOT EXISTS`)
- Aucune donnée existante n'est modifiée ou supprimée
- Les nouvelles colonnes sont **nullables** ou ont des **valeurs par défaut** pour ne pas casser les données existantes
- Les migrations TypeORM correspondantes ont été créées dans :
  - `apps/api/src/db/migrations/1761000000000-AddGroupOfficialToRoundSong.ts`
  - `apps/api/src/db/migrations/1761000000001-AddMatchGroupToAnswer.ts`

## ✅ Statut

- [x] Migrations SQL créées
- [x] Migrations TypeORM créées
- [x] Documentation complète
- [x] Testé en production le 29/10/2025
- [x] Application fonctionne correctement

---

**Dernière mise à jour** : 29 octobre 2025
**Exécuté par** : Système automatique
**Statut** : ✅ Succès
