# Guide de Déploiement - Blind Test Musical

## 📋 Pré-requis

- Docker et Docker Compose installés
- Accès SSH au serveur
- MariaDB/MySQL configuré
- Nom de domaine configuré avec SSL (Let's Encrypt recommandé)

## 🚀 Déploiement sur un nouveau serveur

### Étape 1 : Préparation de l'environnement

1. **Cloner le repository ou transférer les images Docker**

```bash
# Option A : Cloner depuis Git
git clone <votre-repo>
cd blind-test-musical

# Option B : Charger les images Docker pré-construites
docker load < blindtest-api.tar
docker load < blindtest-web.tar
```

2. **Configurer les variables d'environnement**

Créez un fichier `.env.production` à la racine :

```env
# Environment
NODE_ENV=production

# API Configuration
API_PORT=3001
API_HOST=0.0.0.0

# Database Configuration
DB_HOST=mariadb
DB_PORT=3306
DB_USER=blindtest_prod
DB_PASS=VOTRE_MOT_DE_PASSE_SECURISE
DB_NAME=blindtest_production

# Security
JWT_SECRET=VOTRE_CLE_SECRETE_JWT_LONGUE_ET_COMPLEXE

# CORS
CORS_ORIGIN=https://votre-domaine.com

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_VOTRE_CLE
STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET

# Multi-tenant Configuration
APP_BASE_URL=https://votre-domaine.com
SUPER_ADMIN_EMAIL=admin@votre-domaine.com
SUPER_ADMIN_PASSWORD=MOT_DE_PASSE_ADMIN_SECURISE

# Email Configuration (SMTP)
SMTP_HOST=smtp.votre-fournisseur.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=votre-email@domaine.com
SMTP_PASS=VOTRE_MOT_DE_PASSE_EMAIL
EMAIL_FROM=noreply@votre-domaine.com
EMAIL_FROM_NAME=Blind Test Musical
```

### Étape 2 : Démarrage des conteneurs

1. **Démarrer les services**

```bash
# Avec docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Vérifier que les conteneurs sont en cours d'exécution
docker ps
```

Vous devriez voir :
- `blindtest-api` (API Node.js)
- `blindtest-web` (Frontend Angular)
- `blindtest-redis` (Cache Redis)
- `mariadb` (Base de données)

### Étape 3 : ⚠️ IMPORTANT - Exécuter les migrations de base de données

**CETTE ÉTAPE EST OBLIGATOIRE** pour que l'application fonctionne correctement.

```bash
# Exécuter les migrations
docker exec blindtest-api npm run migrate:run
```

Si les migrations échouent avec des erreurs de colonnes dupliquées (cas d'une base de données partiellement migrée), vous devrez peut-être appliquer les migrations manuellement.

#### En cas d'erreur de migration

Si vous obtenez des erreurs comme `Duplicate column name`, cela signifie que certaines migrations ont été partiellement appliquées. Dans ce cas :

1. **Vérifier quelles colonnes manquent** :

```bash
docker exec -i CONTAINER_ID_MARIADB mariadb -u blindtest_prod -p'VOTRE_MOT_DE_PASSE' blindtest_production -e "DESCRIBE events;"
docker exec -i CONTAINER_ID_MARIADB mariadb -u blindtest_prod -p'VOTRE_MOT_DE_PASSE' blindtest_production -e "DESCRIBE teams;"
docker exec -i CONTAINER_ID_MARIADB mariadb -u blindtest_prod -p'VOTRE_MOT_DE_PASSE' blindtest_production -e "SHOW TABLES;"
```

2. **Appliquer le script de correction** :

```bash
# Créer un script de correction
cat > /tmp/fix-schema.sql << 'EOF'
-- Vérifier et créer la table tables si elle n'existe pas
CREATE TABLE IF NOT EXISTS `tables` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint(20) unsigned NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_table_name_per_event` (`event_id`, `name`),
  KEY `idx_table_tenant` (`tenant_id`, `event_id`),
  KEY `IDX_tenant_id` (`tenant_id`),
  CONSTRAINT `FK_tables_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter les colonnes manquantes à events (si elles n'existent pas)
ALTER TABLE `events` ADD COLUMN IF NOT EXISTS `table_mode` tinyint NOT NULL DEFAULT 0;
ALTER TABLE `events` ADD COLUMN IF NOT EXISTS `tenant_id` varchar(36) DEFAULT NULL;
ALTER TABLE `events` ADD COLUMN IF NOT EXISTS `game_mode` enum('TEAM', 'SOLO') NOT NULL DEFAULT 'TEAM';

-- Ajouter les colonnes manquantes à teams
ALTER TABLE `teams` ADD COLUMN IF NOT EXISTS `table_id` bigint(20) unsigned DEFAULT NULL;
ALTER TABLE `teams` ADD COLUMN IF NOT EXISTS `manual_participants_count` int(11) DEFAULT NULL;
ALTER TABLE `teams` ADD COLUMN IF NOT EXISTS `captain_player_id` bigint(20) unsigned DEFAULT NULL;
ALTER TABLE `teams` ADD COLUMN IF NOT EXISTS `tenant_id` varchar(36) DEFAULT NULL;
EOF

# Appliquer le script
docker exec -i CONTAINER_ID_MARIADB mariadb -u blindtest_prod -p'VOTRE_MOT_DE_PASSE' blindtest_production < /tmp/fix-schema.sql
```

### Étape 4 : Vérification

1. **Vérifier les logs**

```bash
# Logs API
docker logs blindtest-api --tail 50

# Logs Web
docker logs blindtest-web --tail 50
```

2. **Tester l'application**

- Ouvrir `https://votre-domaine.com`
- Se connecter avec les credentials super admin
- Créer un événement test
- Vérifier que tout fonctionne

### Étape 5 : Configuration du reverse proxy (Nginx/Traefik)

Exemple de configuration Nginx :

```nginx
server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:4200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔄 Mise à jour d'un déploiement existant

### Méthode 1 : Avec les nouvelles images Docker

```bash
# Arrêter les conteneurs
docker-compose -f docker-compose.prod.yml down

# Charger les nouvelles images
docker load < blindtest-api-new.tar
docker load < blindtest-web-new.tar

# Redémarrer
docker-compose -f docker-compose.prod.yml up -d

# Exécuter les migrations
docker exec blindtest-api npm run migrate:run
```

### Méthode 2 : Rebuild depuis le code source

```bash
# Pull les derniers changements
git pull origin main

# Rebuild les images
docker-compose -f docker-compose.prod.yml build

# Redémarrer
docker-compose -f docker-compose.prod.yml up -d

# Exécuter les migrations
docker exec blindtest-api npm run migrate:run
```

## 📊 Vérification de la santé du système

```bash
# Vérifier l'état des conteneurs
docker ps

# Vérifier la santé de l'API
curl http://localhost:3001/api/health

# Vérifier les logs en temps réel
docker logs blindtest-api -f
```

## 🐛 Dépannage

### Erreur : "Unknown column 'table_mode'"

**Cause** : Les migrations n'ont pas été exécutées.

**Solution** : Exécuter `docker exec blindtest-api npm run migrate:run`

### Erreur : "Table 'tables' doesn't exist"

**Cause** : Migration manquante ou partiellement appliquée.

**Solution** : Appliquer le script de correction SQL (voir Étape 3 ci-dessus)

### L'API ne démarre pas

**Vérifier** :
1. Les logs : `docker logs blindtest-api`
2. La connexion à la base de données (credentials corrects dans `.env`)
3. Que MariaDB est bien démarré : `docker ps | grep mariadb`

### Erreur SMTP

Si vous voyez des erreurs SMTP au démarrage mais que l'API fonctionne, c'est normal en développement. En production, configurez correctement les variables SMTP ou l'API affichera juste un warning.

## 📝 Checklist de déploiement

- [ ] Variables d'environnement configurées dans `.env.production`
- [ ] Base de données MariaDB démarrée
- [ ] Images Docker chargées ou code source cloné
- [ ] Conteneurs démarrés (`docker ps` montre tous les services)
- [ ] **Migrations exécutées** (`npm run migrate:run`)
- [ ] API accessible sur port 3001 (`/api/health` retourne 200)
- [ ] Frontend accessible sur port 4200
- [ ] Reverse proxy configuré (Nginx/Traefik)
- [ ] SSL/TLS configuré (Let's Encrypt)
- [ ] WebSocket fonctionne (testez en créant un événement)
- [ ] Compte super admin créé et accessible

## 🔐 Sécurité

**IMPORTANT** : Avant de déployer en production :

1. Changez tous les mots de passe par défaut
2. Utilisez des secrets longs et complexes pour JWT_SECRET
3. Configurez un pare-feu (UFW, iptables)
4. Activez les mises à jour automatiques de sécurité
5. Configurez des sauvegardes automatiques de la base de données
6. Utilisez HTTPS partout (Let's Encrypt)
7. Limitez l'accès SSH (clés uniquement, pas de mot de passe)

## 📞 Support

En cas de problème, vérifiez :
- Les logs Docker : `docker logs <container-name>`
- L'état de la base de données
- Les variables d'environnement
- Que toutes les migrations sont appliquées
