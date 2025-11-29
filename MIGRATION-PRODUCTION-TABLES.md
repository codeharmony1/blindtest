# 🗄️ Migration Production - Mode Tables

## ⚠️ AVANT DE COMMENCER

**Cette migration ajoute la fonctionnalité "Faites gagner votre table"**

### Changements apportés :
1. Nouvelle table `tables`
2. Nouvelle colonne `table_mode` dans `events`
3. Nouvelle colonne `table_id` dans `teams`

### Impact :
- ✅ **NON destructif** - Aucune donnée n'est supprimée
- ✅ **Rétrocompatible** - Les événements existants continuent de fonctionner
- ✅ **Sans downtime** - Peut être appliqué en production sans arrêt

---

## 🔄 MÉTHODE 1 : Migration automatique (Recommandée)

### Étape 1 : Backup de la base de données

```bash
# Se connecter au serveur de production
ssh user@votre-serveur.com

# Créer un backup avant la migration
mysqldump -u root -p blindtest > backup_avant_migration_tables_$(date +%Y%m%d_%H%M%S).sql

# Vérifier que le backup existe
ls -lh backup_*.sql
```

### Étape 2 : Déployer le nouveau code

```bash
# Sur votre serveur de production
cd /path/to/blindtest

# Mettre à jour le code
git pull origin main  # ou votre branche de production

# Installer les dépendances (si nécessaire)
npm install

# Rebuild l'API
cd apps/api
npm run build
```

### Étape 3 : Exécuter la migration

```bash
# Dans le dossier apps/api
npm run migrate:run
```

**Sortie attendue :**
```
Migration AddTableMode1762000000000 has been executed successfully.
```

### Étape 4 : Vérification

```bash
# Vérifier que les tables ont été créées
mysql -u root -p blindtest -e "DESCRIBE tables;"
mysql -u root -p blindtest -e "SHOW COLUMNS FROM events LIKE 'table_mode';"
mysql -u root -p blindtest -e "SHOW COLUMNS FROM teams LIKE 'table_id';"
```

### Étape 5 : Redémarrer l'API

```bash
# Avec PM2
pm2 restart blindtest-api

# Ou avec systemd
sudo systemctl restart blindtest-api

# Vérifier que tout fonctionne
curl http://localhost:3001/api/health
```

---

## 🔧 MÉTHODE 2 : Migration manuelle SQL (Alternative)

Si vous préférez exécuter manuellement le SQL :

### Script SQL complet

```sql
-- ==========================================
-- Migration: Ajout du Mode Tables
-- Date: 2025-11-03
-- Version: 1762000000000-AddTableMode
-- ==========================================

-- Vérifier si la migration a déjà été appliquée
SELECT * FROM migrations WHERE name = 'AddTableMode1762000000000';

-- Si la migration n'existe pas, continuer :

START TRANSACTION;

-- 1. Créer la table `tables`
CREATE TABLE IF NOT EXISTS `tables` (
    `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
    `event_id` bigint UNSIGNED NOT NULL,
    `tenant_id` varchar(36) NOT NULL,
    `name` varchar(100) NOT NULL,
    `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    INDEX `idx_table_tenant` (`tenant_id`, `event_id`),
    INDEX `IDX_tables_tenant_id` (`tenant_id`),
    UNIQUE INDEX `uq_table_name_per_event` (`event_id`, `name`),
    CONSTRAINT `FK_tables_event_id`
        FOREIGN KEY (`event_id`)
        REFERENCES `events`(`id`)
        ON DELETE CASCADE
        ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Ajouter la colonne table_mode à events
ALTER TABLE `events`
ADD COLUMN IF NOT EXISTS `table_mode` tinyint NOT NULL DEFAULT 0
COMMENT 'Mode "Faites gagner votre table" activé';

-- 3. Ajouter la colonne table_id à teams
ALTER TABLE `teams`
ADD COLUMN IF NOT EXISTS `table_id` bigint UNSIGNED NULL
COMMENT 'ID de la table à laquelle appartient cette équipe';

-- 4. Ajouter la contrainte de clé étrangère
ALTER TABLE `teams`
ADD CONSTRAINT `FK_teams_table_id`
FOREIGN KEY (`table_id`)
REFERENCES `tables`(`id`)
ON DELETE SET NULL
ON UPDATE NO ACTION;

-- 5. Ajouter un index sur teams.table_id
CREATE INDEX IF NOT EXISTS `IDX_teams_table_id` ON `teams` (`table_id`);

-- 6. Enregistrer la migration
INSERT INTO `migrations`(`timestamp`, `name`)
VALUES (1762000000000, 'AddTableMode1762000000000');

COMMIT;

-- Vérification
SELECT 'Migration terminée avec succès' AS status;
DESCRIBE tables;
SHOW COLUMNS FROM events LIKE 'table_mode';
SHOW COLUMNS FROM teams LIKE 'table_id';
```

### Exécution manuelle

```bash
# Copier le script sur le serveur
scp migration-tables.sql user@serveur:/tmp/

# Se connecter au serveur
ssh user@serveur

# Exécuter le script
mysql -u root -p blindtest < /tmp/migration-tables.sql
```

---

## 🔍 VÉRIFICATIONS POST-MIGRATION

### 1. Vérifier la structure de la BDD

```sql
-- Tables créées
SHOW TABLES LIKE 'tables';

-- Colonnes ajoutées
SHOW COLUMNS FROM events LIKE 'table_mode';
SHOW COLUMNS FROM teams LIKE 'table_id';

-- Index créés
SHOW INDEX FROM tables;
SHOW INDEX FROM teams WHERE Key_name = 'IDX_teams_table_id';

-- Contraintes FK
SELECT
    CONSTRAINT_NAME,
    TABLE_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'teams' AND CONSTRAINT_NAME = 'FK_teams_table_id';
```

### 2. Tester l'API

```bash
# Santé de l'API
curl http://localhost:3001/api/health

# Créer un événement de test avec tableMode
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Mode Table",
    "code": "TESTMODE",
    "gameMode": "TEAM",
    "tableMode": true
  }'

# Vérifier l'événement
curl http://localhost:3001/api/events/TESTMODE/public
```

### 3. Vérifier les logs

```bash
# Logs PM2
pm2 logs blindtest-api --lines 50

# Logs système (si systemd)
journalctl -u blindtest-api -n 50 -f
```

---

## 🚨 ROLLBACK (en cas de problème)

### Si la migration échoue :

```bash
# Restaurer le backup
mysql -u root -p blindtest < backup_avant_migration_tables_XXXXXXXX.sql

# Revenir au code précédent
git reset --hard HEAD~1
npm run build
pm2 restart blindtest-api
```

### Rollback SQL manuel :

```sql
START TRANSACTION;

-- Supprimer l'enregistrement de migration
DELETE FROM migrations WHERE name = 'AddTableMode1762000000000';

-- Supprimer l'index
DROP INDEX `IDX_teams_table_id` ON `teams`;

-- Supprimer la contrainte FK
ALTER TABLE `teams` DROP FOREIGN KEY `FK_teams_table_id`;

-- Supprimer la colonne table_id
ALTER TABLE `teams` DROP COLUMN `table_id`;

-- Supprimer la colonne table_mode
ALTER TABLE `events` DROP COLUMN `table_mode`;

-- Supprimer la table tables
DROP TABLE `tables`;

COMMIT;
```

---

## 📊 MONITORING POST-DÉPLOIEMENT

### Choses à surveiller (24-48h) :

1. **Performance des requêtes**
   ```sql
   -- Temps d'exécution des requêtes sur tables
   SELECT * FROM mysql.slow_query_log
   WHERE sql_text LIKE '%tables%'
   ORDER BY query_time DESC
   LIMIT 10;
   ```

2. **Utilisation de la nouvelle fonctionnalité**
   ```sql
   -- Nombre d'événements en mode table
   SELECT COUNT(*) FROM events WHERE table_mode = 1;

   -- Nombre de tables créées
   SELECT COUNT(*) FROM tables;

   -- Nombre d'équipes assignées à des tables
   SELECT COUNT(*) FROM teams WHERE table_id IS NOT NULL;
   ```

3. **Erreurs d'application**
   - Vérifier les logs d'erreur
   - Surveiller les métriques Sentry/NewRelic (si configuré)

---

## ✅ CHECKLIST DÉPLOIEMENT

- [ ] Backup de la base de données créé
- [ ] Code mis à jour sur le serveur
- [ ] Dépendances installées (`npm install`)
- [ ] Migration exécutée (`npm run migrate:run`)
- [ ] Vérifications SQL réussies
- [ ] API rebuild (`npm run build`)
- [ ] Service redémarré
- [ ] Tests API réussis
- [ ] Monitoring en place
- [ ] Documentation mise à jour

---

## 🆘 CONTACTS EN CAS DE PROBLÈME

- **Développeur** : [Votre contact]
- **DBA** : [Contact DBA si applicable]
- **DevOps** : [Contact DevOps si applicable]

---

## 📚 RESSOURCES

- Migration TypeORM : [apps/api/src/db/migrations/1762000000000-AddTableMode.ts](apps/api/src/db/migrations/1762000000000-AddTableMode.ts)
- Documentation : [CLAUDE.md](CLAUDE.md)
- Tests : [apps/api/test-table-simple.ts](apps/api/test-table-simple.ts)
