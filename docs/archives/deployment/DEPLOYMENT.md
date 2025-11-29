# 🚀 GUIDE DE DÉPLOIEMENT - BLIND TEST MUSICAL

Guide complet pour déployer Blind Test Musical en production sur votre serveur avec Traefik.

---

## 📋 PRÉ-REQUIS

### Sur le serveur
- ✅ Docker et Docker Compose installés
- ✅ Traefik configuré et fonctionnel
- ✅ MariaDB en container (partage avec WordPress/Matomo)
- ✅ Réseaux Docker `proxy` et `backend` créés
- ✅ DNS configuré pour `blindtest.codeharmony.fr` et `api.blindtest.codeharmony.fr`

### Comptes et services
- [ ] Compte Stripe créé (mode test puis production)
- [ ] Mot de passe email SMTP disponible (support@codeharmony.com)

---

## 🔧 ÉTAPE 1 : PRÉPARER LE SERVEUR

### 1.1 Créer la base de données MariaDB

```bash
# Se connecter au container MariaDB
docker exec -it mariadb mysql -u root -p

# Entrer le mot de passe root MariaDB
# Puis exécuter :
```

```sql
CREATE DATABASE blindtest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'blindtest_user'@'%' IDENTIFIED BY 'CHOISIR_UN_MOT_DE_PASSE_FORT';
GRANT ALL PRIVILEGES ON blindtest.* TO 'blindtest_user'@'%';
FLUSH PRIVILEGES;
EXIT;
```

### 1.2 Vérifier les réseaux Docker

```bash
# Vérifier que les réseaux existent
docker network ls | grep proxy
docker network ls | grep backend

# Si le réseau backend n'existe pas, le créer :
docker network create backend --internal
```

### 1.3 Configurer les DNS

Dans votre gestionnaire de domaine (ex: OVH, Gandi, etc.), ajouter :

```
Type A    blindtest.codeharmony.fr         → IP_DE_VOTRE_SERVEUR
Type A    api.blindtest.codeharmony.fr     → IP_DE_VOTRE_SERVEUR
```

Attendre la propagation DNS (5-30 minutes).

---

## 📦 ÉTAPE 2 : PRÉPARER LES FICHIERS

### 2.1 Transférer le code sur le serveur

```bash
# Option A : Clone depuis Git (recommandé)
cd /path/to/your/projects
git clone https://github.com/votre-repo/blind-test-musical.git
cd blind-test-musical

# Option B : SCP/SFTP depuis votre machine locale
# scp -r ./blind-test-musical user@server:/path/to/projects/
```

### 2.2 Créer le fichier .env.production

```bash
# Copier l'example
cp .env.production.example .env.production

# Éditer avec vos vraies valeurs
nano .env.production
```

**Variables à remplir dans `.env.production` :**

```env
# Base de données
BLINDTEST_DB_USER=blindtest_user
BLINDTEST_DB_PASSWORD=le_mot_de_passe_choisi_en_1.1

# JWT Secret (générer avec: openssl rand -base64 64)
BLINDTEST_JWT_SECRET=votre_secret_jwt_genere

# Super Admin
BLINDTEST_SUPER_ADMIN_EMAIL=admin@blindtest.codeharmony.fr
BLINDTEST_SUPER_ADMIN_PASSWORD=choisir_un_mot_de_passe_fort

# Email SMTP
BLINDTEST_SMTP_PASSWORD=mot_de_passe_email_support

# Stripe (commencer en mode test)
BLINDTEST_STRIPE_SECRET_KEY=sk_test_...
BLINDTEST_STRIPE_PUBLISHABLE_KEY=pk_test_...
BLINDTEST_STRIPE_WEBHOOK_SECRET=whsec_...

# Redis
REDIS_PASSWORD=choisir_un_mot_de_passe_redis
```

### 2.3 Intégrer dans docker-compose.yml principal

**Option A : Fusionner les fichiers (recommandé)**

Copier le contenu de `docker-compose.prod.yml` dans votre `docker-compose.yml` existant :

```bash
# Éditer votre docker-compose.yml principal
nano /path/to/serveur/docker-compose.yml

# Ajouter les services blindtest-api, blindtest-web et redis
# Ajouter les volumes blindtest_api_logs et redis_data
```

**Option B : Utiliser un fichier séparé**

```bash
# Copier docker-compose.prod.yml vers le serveur
cp docker-compose.prod.yml /path/to/serveur/docker-compose.blindtest.yml

# Déployer avec :
# docker-compose -f docker-compose.yml -f docker-compose.blindtest.yml up -d
```

---

## 🏗️ ÉTAPE 3 : CONSTRUIRE ET DÉPLOYER

### 3.1 Construire les images Docker

```bash
# Construire l'API
docker-compose build blindtest-api

# Construire le Web
docker-compose build blindtest-web
```

### 3.2 Démarrer les services

```bash
# Démarrer Redis d'abord
docker-compose up -d redis

# Puis l'API
docker-compose up -d blindtest-api

# Puis le Web
docker-compose up -d blindtest-web

# Vérifier que tout fonctionne
docker-compose ps | grep blindtest
```

### 3.3 Exécuter les migrations de base de données

```bash
# Exécuter les migrations
docker exec -it blindtest-api npm run migrate:run

# Vérifier les logs
docker logs blindtest-api
```

---

## ✅ ÉTAPE 4 : VÉRIFICATIONS

### 4.1 Vérifier les services

```bash
# API Health Check
curl https://api.blindtest.codeharmony.fr/api/health

# Doit retourner:
# {"ok":true,"timestamp":"2025-XX-XXTXX:XX:XX.XXXZ","version":"1.0.0","environment":"production"}

# Web
curl -I https://blindtest.codeharmony.fr
# Doit retourner: 200 OK
```

### 4.2 Vérifier les logs

```bash
# Logs API
docker logs -f blindtest-api

# Logs Web
docker logs -f blindtest-web

# Logs Redis
docker logs -f blindtest-redis
```

### 4.3 Tester l'application

1. Ouvrir https://blindtest.codeharmony.fr dans le navigateur
2. Créer un compte organisateur
3. Se connecter
4. Créer un événement de test

---

## 💳 ÉTAPE 5 : CONFIGURER STRIPE

### 5.1 Créer un compte Stripe

1. Aller sur https://stripe.com
2. Créer un compte
3. Compléter les informations légales (SIRET, etc.)

### 5.2 Configurer le webhook

Dans le dashboard Stripe :

1. Aller dans **Développeurs** → **Webhooks**
2. Cliquer **Ajouter un point de terminaison**
3. URL du webhook : `https://api.blindtest.codeharmony.fr/api/payments/webhooks/stripe`
4. Sélectionner les événements :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copier le **signing secret** (commence par `whsec_...`)
6. Mettre à jour `.env.production` avec ce secret
7. Redémarrer l'API : `docker-compose restart blindtest-api`

### 5.3 Tester les paiements (mode test)

1. Utiliser une carte de test : `4242 4242 4242 4242`
2. Date d'expiration future : `12/34`
3. CVC : `123`
4. Vérifier que le paiement fonctionne
5. Vérifier réception du webhook dans Stripe dashboard

### 5.4 Passer en production

Quand tout fonctionne en mode test :

1. Dans Stripe, activer le mode production
2. Copier les clés de production (`sk_live_...` et `pk_live_...`)
3. Mettre à jour `.env.production`
4. Redémarrer l'API

---

## 📧 ÉTAPE 6 : TESTER LES EMAILS

### 6.1 Tester l'envoi d'email

```bash
# Se connecter au container API
docker exec -it blindtest-api sh

# Lancer un test Node.js
node -e "
const { emailService } = require('./dist/services/email.service');
emailService.sendWelcomeEmail('votre-email@test.com', 'Test User')
  .then(() => console.log('Email envoyé !'))
  .catch(err => console.error('Erreur:', err));
"
```

### 6.2 Vérifier la délivrabilité

1. Vérifier que l'email arrive (vérifier spam aussi)
2. Si problèmes, vérifier les enregistrements DNS SPF/DKIM de codeharmony.com
3. Vérifier logs : `docker logs blindtest-api | grep "Email"`

---

## 🔐 ÉTAPE 7 : SÉCURITÉ

### 7.1 Vérifier les headers de sécurité

```bash
curl -I https://blindtest.codeharmony.fr

# Devrait afficher :
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
```

### 7.2 Tester le reset password

1. Créer un compte
2. Utiliser "Mot de passe oublié"
3. Vérifier réception email
4. Réinitialiser le mot de passe
5. Se reconnecter

### 7.3 Tester les refresh tokens

1. Se connecter
2. Attendre expiration du token (15 min par défaut)
3. Vérifier que le refresh fonctionne automatiquement

---

## 📊 ÉTAPE 8 : MONITORING

### 8.1 Configurer les sauvegardes

```bash
# Script de backup base de données (à mettre dans cron)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec mariadb mysqldump -u root -p${MARIADB_ROOT_PASSWORD} blindtest | gzip > /backups/blindtest_$DATE.sql.gz

# Garder seulement les 7 derniers jours
find /backups -name "blindtest_*.sql.gz" -mtime +7 -delete
```

```bash
# Ajouter au crontab (backup quotidien à 2h du matin)
crontab -e

# Ajouter:
0 2 * * * /path/to/backup-blindtest.sh
```

### 8.2 Surveiller les logs

```bash
# Créer un script de monitoring
#!/bin/bash
docker logs --since 1h blindtest-api | grep -i error
docker logs --since 1h blindtest-api | grep -i exception
```

### 8.3 Surveiller les ressources

```bash
# Utilisation CPU/RAM
docker stats blindtest-api blindtest-web blindtest-redis
```

---

## 🔄 MAINTENANCE

### Mise à jour de l'application

```bash
# 1. Récupérer les dernières modifications
git pull origin main

# 2. Reconstruire les images
docker-compose build blindtest-api blindtest-web

# 3. Redémarrer les services (downtime minimal)
docker-compose up -d --force-recreate blindtest-api blindtest-web

# 4. Exécuter les nouvelles migrations si nécessaire
docker exec -it blindtest-api npm run migrate:run

# 5. Vérifier que tout fonctionne
docker logs -f blindtest-api
```

### Rotation des secrets

```bash
# Générer un nouveau JWT secret (à faire tous les 6 mois)
openssl rand -base64 64

# Mettre à jour .env.production
# Redémarrer l'API
docker-compose restart blindtest-api
```

---

## 🐛 TROUBLESHOOTING

### Problème : L'API ne démarre pas

```bash
# Vérifier les logs
docker logs blindtest-api

# Erreur commune : connexion base de données
# → Vérifier que MariaDB est accessible
docker exec -it blindtest-api sh
nc -zv mariadb 3306
```

### Problème : Certificat SSL non généré

```bash
# Vérifier les logs Traefik
docker logs traefik

# Vérifier DNS
nslookup blindtest.codeharmony.fr

# Forcer renouvellement
docker restart traefik
```

### Problème : Emails non envoyés

```bash
# Vérifier les logs
docker logs blindtest-api | grep "Email"

# Tester connexion SMTP
docker exec -it blindtest-api sh
telnet smtp.hostinger.com 465
```

### Problème : WebSocket ne fonctionne pas

```bash
# Vérifier les headers Traefik
# Ajouter dans les labels du service blindtest-api:
- "traefik.http.routers.blindtest-api.middlewares=websocket-headers"
- "traefik.http.middlewares.websocket-headers.headers.customrequestheaders.Upgrade=websocket"
- "traefik.http.middlewares.websocket-headers.headers.customrequestheaders.Connection=upgrade"
```

---

## 📞 SUPPORT

En cas de problème :
1. Vérifier les logs : `docker logs blindtest-api`
2. Vérifier la checklist : [CHECKLIST-MISE-EN-PRODUCTION.md](./CHECKLIST-MISE-EN-PRODUCTION.md)
3. Contacter le support : support@codeharmony.com

---

**Version:** 1.0
**Date:** 2025-10-18
**Auteur:** Claude Code + Blind Test Team
