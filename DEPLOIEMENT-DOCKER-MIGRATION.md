# 🐳 Déploiement Docker - Migration Mode Tables

## 📋 Vue d'ensemble

Ce guide décrit comment déployer la nouvelle fonctionnalité "Mode Tables" sur un serveur Docker avec Traefik.

**Migration concernée :** `1762000000000-AddTableMode`

---

## ⚠️ PRÉ-REQUIS

- [ ] Accès SSH au serveur
- [ ] Docker et Docker Compose installés
- [ ] Traefik configuré et opérationnel
- [ ] Base de données MariaDB accessible
- [ ] Variables d'environnement configurées

---

## 🔄 ÉTAPE 1 : Backup avant migration

### Se connecter au serveur

```bash
ssh user@votre-serveur.com
cd /path/to/blindtest
```

### Créer un backup de la base de données

```bash
# Via Docker (si MariaDB est dans un container)
docker exec mariadb mysqldump -u root -p$MYSQL_ROOT_PASSWORD blindtest \
  > backup_blindtest_$(date +%Y%m%d_%H%M%S).sql

# Ou directement si MariaDB est sur l'hôte
mysqldump -u root -p blindtest > backup_blindtest_$(date +%Y%m%d_%H%M%S).sql

# Vérifier le backup
ls -lh backup_*.sql
```

### Backup des volumes Docker (optionnel mais recommandé)

```bash
# Lister les volumes
docker volume ls | grep blindtest

# Backup du volume de logs (si nécessaire)
docker run --rm \
  -v blindtest_api_logs:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/blindtest_api_logs_backup.tar.gz -C /data .
```

---

## 📦 ÉTAPE 2 : Préparer les nouvelles images

### Option A : Build sur le serveur (Simple)

```bash
# Mettre à jour le code
git pull origin main

# Build les nouvelles images
docker compose -f docker-compose.prod.yml build --no-cache

# Vérifier les images
docker images | grep blindtest
```

### Option B : Build en local et push vers registry (Production)

```bash
# En local (sur votre machine)
git pull origin main

# Build et tag les images
docker build -t votre-registry.com/blindtest-api:latest ./apps/api
docker build -t votre-registry.com/blindtest-web:latest ./apps/web

# Push vers le registry
docker push votre-registry.com/blindtest-api:latest
docker push votre-registry.com/blindtest-web:latest

# Sur le serveur
ssh user@serveur
docker pull votre-registry.com/blindtest-api:latest
docker pull votre-registry.com/blindtest-web:latest
```

---

## 🗄️ ÉTAPE 3 : Exécuter la migration

### Méthode 1 : Via un container temporaire (Recommandée)

```bash
# Lancer un container temporaire de l'API pour exécuter la migration
docker run --rm \
  --network backend \
  -e NODE_ENV=production \
  -e DB_HOST=mariadb \
  -e DB_PORT=3306 \
  -e DB_USER=${BLINDTEST_DB_USER} \
  -e DB_PASS=${BLINDTEST_DB_PASSWORD} \
  -e DB_NAME=blindtest \
  blindtest-api:latest \
  npm run migrate:run

# Attendre le message de succès :
# "Migration AddTableMode1762000000000 has been executed successfully."
```

### Méthode 2 : Via le container API existant

```bash
# Si l'API est déjà déployée (ancienne version)
docker exec blindtest-api npm run migrate:run
```

### Méthode 3 : Migration SQL manuelle

```bash
# Se connecter à MariaDB
docker exec -it mariadb mysql -u root -p blindtest

# Copier-coller le SQL de migration (voir section SQL ci-dessous)
```

---

## 🚀 ÉTAPE 4 : Déployer les nouveaux containers

### Arrêter les anciens containers

```bash
# Arrêter proprement les containers existants
docker compose -f docker-compose.prod.yml down

# Vérifier qu'ils sont bien arrêtés
docker ps -a | grep blindtest
```

### Démarrer les nouveaux containers

```bash
# Démarrer avec les nouvelles images
docker compose -f docker-compose.prod.yml up -d

# Suivre les logs en temps réel
docker compose -f docker-compose.prod.yml logs -f

# Attendre que les services soient "healthy"
docker ps --filter "name=blindtest" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Vérifier le démarrage

```bash
# Attendre 30-60 secondes puis vérifier la santé
docker compose -f docker-compose.prod.yml ps

# Les containers doivent afficher "healthy" dans la colonne STATUS
```

---

## ✅ ÉTAPE 5 : Vérifications post-déploiement

### 1. Vérifier les logs

```bash
# Logs de l'API
docker logs blindtest-api --tail 100

# Logs du Web
docker logs blindtest-web --tail 50

# Chercher des erreurs
docker logs blindtest-api 2>&1 | grep -i error
```

### 2. Tester l'API

```bash
# Health check
curl https://blindtest.codeharmony.fr/api/health

# Vérifier qu'un événement peut être créé avec tableMode
curl -X POST https://blindtest.codeharmony.fr/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Mode Table",
    "code": "TESTDOCK",
    "gameMode": "TEAM",
    "tableMode": true
  }'

# Vérifier l'endpoint public
curl https://blindtest.codeharmony.fr/api/events/TESTDOCK/public
```

### 3. Vérifier la base de données

```bash
# Se connecter à MariaDB
docker exec -it mariadb mysql -u root -p blindtest

# Vérifier les nouvelles tables et colonnes
SHOW TABLES LIKE 'tables';
SHOW COLUMNS FROM events LIKE 'table_mode';
SHOW COLUMNS FROM teams LIKE 'table_id';

# Vérifier que la migration est enregistrée
SELECT * FROM migrations WHERE name = 'AddTableMode1762000000000';

# Quitter
exit
```

### 4. Tester le frontend

```bash
# Accéder au frontend
curl -I https://blindtest.codeharmony.fr

# Devrait retourner 200 OK
```

---

## 🔍 MONITORING POST-DÉPLOIEMENT

### Surveiller les ressources

```bash
# Utilisation CPU/Mémoire des containers
docker stats blindtest-api blindtest-web

# Espace disque
docker system df
```

### Surveiller les logs en continu

```bash
# Tous les containers blindtest
docker compose -f docker-compose.prod.yml logs -f

# Uniquement l'API
docker logs -f blindtest-api

# Filtrer les erreurs
docker logs -f blindtest-api 2>&1 | grep -i error
```

### Vérifier les connexions WebSocket

```bash
# Vérifier que les WebSockets fonctionnent
docker logs blindtest-api | grep -i websocket

# Devrait afficher des connexions WebSocket réussies
```

---

## 🚨 ROLLBACK EN CAS DE PROBLÈME

### Rollback rapide (restaurer les anciennes images)

```bash
# Arrêter les nouveaux containers
docker compose -f docker-compose.prod.yml down

# Restaurer le backup de la base de données
docker exec -i mariadb mysql -u root -p$MYSQL_ROOT_PASSWORD blindtest < backup_blindtest_XXXXXXXX.sql

# Revenir à l'ancienne version du code
git reset --hard HEAD~1

# Rebuild les anciennes images
docker compose -f docker-compose.prod.yml build

# Redémarrer
docker compose -f docker-compose.prod.yml up -d
```

### Rollback de la migration uniquement

```bash
# Se connecter à MariaDB
docker exec -it mariadb mysql -u root -p blindtest

# Exécuter le rollback SQL (voir section ci-dessous)
```

---

## 📜 SCRIPT SQL MANUEL (si nécessaire)

### Migration complète

```sql
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
ADD COLUMN IF NOT EXISTS `table_mode` tinyint NOT NULL DEFAULT 0;

-- 3. Ajouter la colonne table_id à teams
ALTER TABLE `teams`
ADD COLUMN IF NOT EXISTS `table_id` bigint UNSIGNED NULL;

-- 4. Ajouter la contrainte FK
ALTER TABLE `teams`
ADD CONSTRAINT `FK_teams_table_id`
FOREIGN KEY (`table_id`)
REFERENCES `tables`(`id`)
ON DELETE SET NULL
ON UPDATE NO ACTION;

-- 5. Ajouter l'index
CREATE INDEX IF NOT EXISTS `IDX_teams_table_id` ON `teams` (`table_id`);

-- 6. Enregistrer la migration
INSERT INTO `migrations`(`timestamp`, `name`)
VALUES (1762000000000, 'AddTableMode1762000000000');

COMMIT;
```

### Rollback SQL

```sql
START TRANSACTION;

DELETE FROM migrations WHERE name = 'AddTableMode1762000000000';
DROP INDEX `IDX_teams_table_id` ON `teams`;
ALTER TABLE `teams` DROP FOREIGN KEY `FK_teams_table_id`;
ALTER TABLE `teams` DROP COLUMN `table_id`;
ALTER TABLE `events` DROP COLUMN `table_mode`;
DROP TABLE `tables`;

COMMIT;
```

---

## 🔧 COMMANDES UTILES

### Gestion des containers

```bash
# Redémarrer un service spécifique
docker compose -f docker-compose.prod.yml restart blindtest-api

# Voir les logs d'un service
docker compose -f docker-compose.prod.yml logs blindtest-api -f

# Reconstruire et redéployer un service
docker compose -f docker-compose.prod.yml up -d --build --force-recreate blindtest-api

# Voir l'utilisation des ressources
docker stats blindtest-api
```

### Nettoyage Docker

```bash
# Nettoyer les images non utilisées
docker image prune -a

# Nettoyer les volumes non utilisés
docker volume prune

# Nettoyer tout (ATTENTION !)
docker system prune -a --volumes
```

### Debugging

```bash
# Accéder au shell d'un container
docker exec -it blindtest-api sh

# Voir les variables d'environnement
docker exec blindtest-api env | grep DB

# Tester la connexion à la base de données
docker exec blindtest-api node -e "
  const mysql = require('mysql2/promise');
  mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  }).then(() => console.log('OK')).catch(err => console.error(err))
"
```

---

## 📊 CHECKLIST DE DÉPLOIEMENT

### Avant le déploiement
- [ ] Backup de la base de données créé
- [ ] Backup des volumes Docker créé
- [ ] Code mis à jour (git pull)
- [ ] Variables d'environnement vérifiées
- [ ] Images Docker buildées

### Pendant le déploiement
- [ ] Migration exécutée avec succès
- [ ] Containers arrêtés proprement
- [ ] Nouveaux containers démarrés
- [ ] Healthchecks passent au vert

### Après le déploiement
- [ ] API accessible (https://blindtest.codeharmony.fr/api/health)
- [ ] Frontend accessible (https://blindtest.codeharmony.fr)
- [ ] Tables créées en BDD
- [ ] Logs sans erreur
- [ ] WebSockets fonctionnent
- [ ] Création d'événement avec tableMode testée
- [ ] Monitoring en place

---

## 🆘 SUPPORT

### En cas de problème :

1. **Vérifier les logs** : `docker logs blindtest-api`
2. **Vérifier la base de données** : Connexion, tables, migrations
3. **Vérifier les variables d'env** : `docker exec blindtest-api env`
4. **Rollback si nécessaire** : Suivre la procédure de rollback ci-dessus

### Contacts
- Documentation technique : [CLAUDE.md](CLAUDE.md)
- Guide de migration standard : [MIGRATION-PRODUCTION-TABLES.md](MIGRATION-PRODUCTION-TABLES.md)

---

## 📚 FICHIERS IMPORTANTS

- Docker Compose : [docker-compose.prod.yml](docker-compose.prod.yml)
- Migration TypeORM : [apps/api/src/db/migrations/1762000000000-AddTableMode.ts](apps/api/src/db/migrations/1762000000000-AddTableMode.ts)
- Tests : [apps/api/test-table-simple.ts](apps/api/test-table-simple.ts)
