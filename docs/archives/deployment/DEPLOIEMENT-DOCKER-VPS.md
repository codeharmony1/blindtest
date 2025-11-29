# 🐳 Guide Déploiement Docker sur VPS

**Date:** 2025-10-19
**Méthode:** Build images en local → Transfert FTP → Load sur VPS

---

## 📋 Vue d'Ensemble des Étapes

1. **Build images Docker localement** (sur votre PC)
2. **Sauvegarder images en fichiers .tar** (sur votre PC)
3. **Transférer fichiers par FTP** (vers VPS)
4. **Préparer VPS** (se connecter, installer Docker)
5. **Charger images Docker** (depuis fichiers .tar)
6. **Configurer fichiers** (.env, docker-compose)
7. **Créer base de données** MariaDB
8. **Lancer l'application** (docker-compose up)
9. **Migrations & Configuration** (super-admin, webhooks)

**Temps total:** 1-2 heures

---

## PARTIE 1 : Sur Votre PC Local

### Étape 1 : Build Images Docker (10 min)

```bash
# Se placer dans le dossier du projet
cd "d:\Projet\Blind test musical"

# Build image API
docker build -t blindtest-api:latest ./apps/api

# Build image Web (Frontend)
docker build -t blindtest-web:latest ./apps/web

# Vérifier les images créées
docker images | grep blindtest
```

**Résultat attendu :**
```
blindtest-api    latest    xxxxx    X minutes ago    XXX MB
blindtest-web    latest    xxxxx    X minutes ago    XXX MB
```

### Étape 2 : Sauvegarder Images en Fichiers .tar (5 min)

```bash
# Créer dossier pour les exports
mkdir docker-images
cd docker-images

# Sauvegarder image API
docker save blindtest-api:latest -o blindtest-api.tar

# Sauvegarder image Web
docker save blindtest-web:latest -o blindtest-web.tar

# Vérifier les fichiers créés
dir
```

**Résultat attendu :**
```
blindtest-api.tar    (environ 300-500 MB)
blindtest-web.tar    (environ 200-300 MB)
```

### Étape 3 : Transférer Fichiers par FTP (10-30 min selon connexion)

**Utiliser votre client FTP préféré (FileZilla, WinSCP, etc.)**

**Connexion FTP :**
- Host : `votre-ip-vps` (ou `ftp.votre-domaine.com`)
- Port : `21` (ou `22` pour SFTP)
- Username : `root` (ou votre user)
- Password : votre mot de passe VPS

**Transférer vers le VPS :**
```
Source locale : d:\Projet\Blind test musical\docker-images\
Destination VPS : /root/docker-images/
(ou /home/votre-user/docker-images/)

Fichiers à transférer :
- blindtest-api.tar
- blindtest-web.tar
```

**Alternative via SCP (si vous préférez ligne de commande) :**
```bash
# Depuis votre PC (PowerShell ou Git Bash)
scp blindtest-api.tar root@votre-ip-vps:/root/docker-images/
scp blindtest-web.tar root@votre-ip-vps:/root/docker-images/
```

**Note :** Le transfert peut prendre 10-30 minutes selon votre connexion internet.

---

## PARTIE 2 : Sur Votre VPS

### Étape 1 : Connexion SSH

```bash
ssh root@votre-ip-vps
# OU
ssh votre-user@votre-ip-vps
```

### Étape 2 : Vérifier/Installer Docker (5 min)

```bash
# Vérifier si Docker est installé
docker --version

# Si pas installé, installer Docker
curl -fsSL https://get.docker.com | sh

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier installations
docker --version
docker-compose --version
```

### Étape 3 : Créer Structure Dossiers (1 min)

```bash
# Créer dossier pour l'application
sudo mkdir -p /var/www/blindtest
cd /var/www/blindtest

# Donner permissions (si pas root)
sudo chown -R $USER:$USER /var/www/blindtest
```

### Étape 4 : Créer fichier .env.production (5 min)

```bash
# Créer le fichier
nano .env.production
```

**Coller ce contenu (adapter avec VOS valeurs) :**

```bash
# ============================================
# PRODUCTION CONFIGURATION
# ============================================

NODE_ENV=production

# ============================================
# DATABASE (MariaDB)
# ============================================
DB_HOST=mariadb
DB_PORT=3306
DB_USER=blindtest_user
DB_PASS=VotreMotDePasseSecurise123!
DB_NAME=blindtest_production

# ============================================
# JWT SECRETS
# ============================================
JWT_SECRET=2af150f1a52a0bbc8dfca9094bc9ff03db4e2bb404e1ac56da087767dfae0a62ca3b233cacfbff7dfc2fadf2707584370a32ee94fc0e1247f9c653bd92939b9d
JWT_REFRESH_SECRET=c5523c9f5fb95d13207c6ffec06289e75fbfc5d3c3fb0607fffee9a841df20ee6181d7676a5c5f2b0296c17c56c248be65a57dc626dccf5b37806d14fe006232
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# STRIPE (LIVE MODE)
# ============================================
STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_ICI
STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE_ICI
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_ICI

# Stripe Price IDs
STRIPE_PRICE_PER_EVENT=price_VOTRE_ID_19_EUROS
STRIPE_PRICE_MONTHLY=price_VOTRE_ID_49_EUROS
STRIPE_PRICE_2DAYS=price_VOTRE_ID
STRIPE_PRICE_1WEEK=price_VOTRE_ID
STRIPE_PRICE_1MONTH=price_VOTRE_ID

# ============================================
# EMAIL SMTP
# ============================================
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=support@votre-domaine.com
SMTP_PASS=VotreMotDePasseSMTP
EMAIL_FROM=support@votre-domaine.com

# ============================================
# API & CORS
# ============================================
API_PORT=3001
API_HOST=0.0.0.0
CORS_ORIGIN=https://votre-domaine.com
FRONTEND_URL=https://votre-domaine.com

# ============================================
# TRAEFIK & SSL
# ============================================
DOMAIN=votre-domaine.com
LETSENCRYPT_EMAIL=moi@blabla.fr
```

**Sauvegarder :** `Ctrl+X` → `Y` → `Enter`

### Étape 5 : Créer docker-compose.yml (5 min)

```bash
# Créer le fichier docker-compose
nano docker-compose.yml
```

**Coller ce contenu :**

```yaml
version: '3.8'

services:
  # ============================================
  # MARIADB
  # ============================================
  mariadb:
    image: mariadb:10.11
    container_name: blindtest_mariadb
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASS}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASS}
    volumes:
      - mariadb_data:/var/lib/mysql
    networks:
      - blindtest_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${DB_PASS}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # API (Backend)
  # ============================================
  api:
    image: blindtest-api:latest
    container_name: blindtest_api
    restart: unless-stopped
    env_file:
      - .env.production
    environment:
      NODE_ENV: production
    depends_on:
      mariadb:
        condition: service_healthy
    networks:
      - blindtest_network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.${DOMAIN}`) || (Host(`${DOMAIN}`) && PathPrefix(`/api`))"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.services.api.loadbalancer.server.port=3001"

  # ============================================
  # WEB (Frontend)
  # ============================================
  web:
    image: blindtest-web:latest
    container_name: blindtest_web
    restart: unless-stopped
    environment:
      NODE_ENV: production
    networks:
      - blindtest_network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.web.entrypoints=websecure"
      - "traefik.http.routers.web.tls.certresolver=letsencrypt"
      - "traefik.http.services.web.loadbalancer.server.port=80"

  # ============================================
  # TRAEFIK (Reverse Proxy + SSL)
  # ============================================
  traefik:
    image: traefik:v2.10
    container_name: blindtest_traefik
    restart: unless-stopped
    command:
      # API & Dashboard
      - "--api.dashboard=true"
      - "--api.insecure=false"

      # Entrypoints
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"

      # HTTP to HTTPS redirect
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"

      # Docker provider
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.docker.network=blindtest_network"

      # Let's Encrypt
      - "--certificatesresolvers.letsencrypt.acme.email=${LETSENCRYPT_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_letsencrypt:/letsencrypt
    networks:
      - blindtest_network

# ============================================
# VOLUMES
# ============================================
volumes:
  mariadb_data:
    driver: local
  traefik_letsencrypt:
    driver: local

# ============================================
# NETWORKS
# ============================================
networks:
  blindtest_network:
    driver: bridge
```

**Sauvegarder :** `Ctrl+X` → `Y` → `Enter`

### Étape 6 : Charger Images Docker depuis Fichiers .tar (5 min)

```bash
# Aller dans le dossier contenant les fichiers .tar
cd /root/docker-images
# (ou cd /home/votre-user/docker-images)

# Vérifier que les fichiers sont bien là
ls -lh

# Charger image API
docker load -i blindtest-api.tar

# Charger image Web
docker load -i blindtest-web.tar

# Vérifier que les images sont chargées
docker images | grep blindtest
```

**Résultat attendu :**
```
blindtest-api    latest    xxxxx    X minutes ago    XXX MB
blindtest-web    latest    xxxxx    X minutes ago    XXX MB
```

### Étape 8 : Démarrer MariaDB Seule (2 min)

```bash
# Démarrer uniquement MariaDB pour créer la base
docker-compose up -d mariadb

# Attendre que MariaDB soit prête (30 secondes)
sleep 30

# Vérifier que MariaDB tourne
docker-compose ps mariadb
```

### Étape 9 : Vérifier Base de Données Créée (1 min)

```bash
# Se connecter à MariaDB
docker-compose exec mariadb mysql -u root -p

# Entrer le mot de passe (DB_PASS défini dans .env.production)
# Exemple: VotreMotDePasseSecurise123!
```

**Dans le prompt MySQL :**

```sql
-- Vérifier que la base existe
SHOW DATABASES;

-- Devrait afficher 'blindtest_production'

-- Vérifier l'utilisateur
SELECT User, Host FROM mysql.user WHERE User='blindtest_user';

-- Sortir
EXIT;
```

**Si la base n'existe pas (ne devrait pas arriver) :**

```sql
CREATE DATABASE IF NOT EXISTS blindtest_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON blindtest_production.* TO 'blindtest_user'@'%';
FLUSH PRIVILEGES;
EXIT;
```

### Étape 10 : Démarrer Tous les Services (2 min)

```bash
# Démarrer tous les containers
docker-compose up -d

# Voir les logs en temps réel
docker-compose logs -f
```

**Attendre que tout démarre (1-2 minutes)**

**Vérifier que tous les containers tournent :**

```bash
docker-compose ps
```

**Attendu :**
```
NAME                   STATUS
blindtest_api          Up
blindtest_web          Up
blindtest_mariadb      Up
blindtest_traefik      Up
```

### Étape 11 : Exécuter Migrations Base de Données (2 min)

```bash
# Exécuter les migrations TypeORM
docker-compose exec api npm run migrate:run

# OU si la commande ci-dessus ne fonctionne pas :
docker-compose exec api npx typeorm-ts-node-commonjs migration:run -d src/db/data-source.ts
```

**Attendu :** Liste des migrations exécutées sans erreur

### Étape 12 : Créer Super-Admin (1 min)

```bash
# Créer le compte super-admin
docker-compose exec api npm run create:super-admin
```

**Sortie attendue :**
```
✅ Super-admin créé avec succès:
   Email: superadmin@blindtest.fr
   Mot de passe: SuperAdmin2025!
   Nom: Super Administrateur
```

**⚠️ Noter ces credentials** (changer mot de passe après premier login)

### Étape 13 : Vérifier Application (2 min)

```bash
# Test health endpoint depuis le VPS
curl http://localhost:3001/api/health

# Devrait retourner : {"ok":true,...}

# Test depuis internet (remplacer par votre domaine)
curl https://api.votre-domaine.com/api/health
# OU
curl https://votre-domaine.com/api/health
```

**Ouvrir navigateur :**
- `https://votre-domaine.com` → Page d'accueil
- `https://votre-domaine.com/pricing` → Plans affichés
- `https://votre-domaine.com/auth/login` → Login page

### Étape 14 : Configurer Webhooks Stripe (5 min)

**⚠️ À faire maintenant que l'API est accessible**

1. Aller sur https://dashboard.stripe.com/webhooks
2. Cliquer **"Add endpoint"**
3. **Endpoint URL :** `https://api.votre-domaine.com/api/payments/webhook`
   (ou `https://votre-domaine.com/api/payments/webhook` selon votre config)
4. **Events à sélectionner :**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Cliquer **"Add endpoint"**
6. **Copier le Signing Secret** (commence par `whsec_...`)

**Mettre à jour .env.production :**

```bash
# Sur le VPS
nano .env.production

# Trouver la ligne STRIPE_WEBHOOK_SECRET
# Remplacer par : STRIPE_WEBHOOK_SECRET=whsec_[votre_secret_copié]

# Sauvegarder : Ctrl+X → Y → Enter
```

**Redémarrer API :**

```bash
docker-compose restart api

# Vérifier logs
docker-compose logs -f api
```

---

## ✅ TESTS DE VALIDATION

### Test Backend

```bash
# Health
curl https://votre-domaine.com/api/health

# Pricing
curl https://votre-domaine.com/api/payments/pricing
```

### Test Frontend (Navigateur)

- ✅ `https://votre-domaine.com` → Page d'accueil
- ✅ `https://votre-domaine.com/pricing` → Plans Stripe
- ✅ `https://votre-domaine.com/auth/login` → Login

### Login Super-Admin

```
URL: https://votre-domaine.com/auth/login
Email: superadmin@blindtest.fr
Password: SuperAdmin2025!
```

**⚠️ Changer ce mot de passe immédiatement après connexion**

### Test Paiement (⚠️ Vraie Carte)

1. Register nouveau compte
2. Aller sur `/pricing`
3. Choisir plan (sera débité réellement)
4. Vérifier :
   - ✅ Page success avec détails
   - ✅ Stripe Dashboard : paiement visible
   - ✅ Logs API : webhook reçu

```bash
# Voir logs webhooks
docker-compose logs api | grep webhook
```

---

## 🔧 COMMANDES UTILES

### Voir Logs

```bash
# Tous les services
docker-compose logs -f

# API seulement
docker-compose logs -f api

# Web seulement
docker-compose logs -f web

# MariaDB seulement
docker-compose logs -f mariadb

# Traefik seulement
docker-compose logs -f traefik
```

### Redémarrer Services

```bash
# Redémarrer tout
docker-compose restart

# Redémarrer API seulement
docker-compose restart api

# Redémarrer Web seulement
docker-compose restart web
```

### Arrêter/Démarrer

```bash
# Arrêter tous les containers
docker-compose down

# Démarrer tous les containers
docker-compose up -d

# Reconstruire et redémarrer (si nouvelle image)
docker-compose up -d --force-recreate
```

### Accéder aux Containers

```bash
# Shell dans container API
docker-compose exec api sh

# Shell dans container Web
docker-compose exec web sh

# MySQL dans MariaDB
docker-compose exec mariadb mysql -u root -p
```

### Backup Base de Données

```bash
# Créer backup
docker-compose exec mariadb mysqldump -u root -p${DB_PASS} blindtest_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurer backup
docker-compose exec -T mariadb mysql -u root -p${DB_PASS} blindtest_production < backup_20251019_120000.sql
```

### Mettre à Jour Application

**Quand vous avez une nouvelle version :**

```bash
# Sur votre PC : Build et sauvegarder nouvelles images
docker build -t blindtest-api:latest ./apps/api
docker build -t blindtest-web:latest ./apps/web

docker save blindtest-api:latest -o blindtest-api.tar
docker save blindtest-web:latest -o blindtest-web.tar

# Transférer par FTP vers VPS

# Sur VPS : Arrêter, charger nouvelles images, redémarrer
cd /root/docker-images
docker-compose -f /var/www/blindtest/docker-compose.yml down

docker load -i blindtest-api.tar
docker load -i blindtest-web.tar

cd /var/www/blindtest
docker-compose up -d
docker-compose exec api npm run migrate:run
```

---

## 🐛 DÉPANNAGE

### Problème : Containers ne démarrent pas

```bash
# Voir les logs
docker-compose logs

# Voir status
docker-compose ps

# Vérifier .env.production
cat .env.production | grep -v "^#" | grep -v "^$"
```

### Problème : API inaccessible

```bash
# Vérifier API tourne
docker-compose ps api

# Voir logs API
docker-compose logs api

# Tester depuis le VPS
curl http://localhost:3001/api/health
```

### Problème : SSL ne fonctionne pas

```bash
# Voir logs Traefik
docker-compose logs traefik | grep -i certificate

# Vérifier DNS
nslookup votre-domaine.com

# Vérifier ports ouverts
sudo ufw status
```

### Problème : Base de données

```bash
# Vérifier MariaDB
docker-compose ps mariadb

# Logs MariaDB
docker-compose logs mariadb

# Se connecter manuellement
docker-compose exec mariadb mysql -u root -p
```

### Problème : Migrations échouent

```bash
# Voir erreur exacte
docker-compose exec api npm run migrate:run

# Vérifier connexion DB depuis API
docker-compose exec api node -e "console.log(process.env.DB_HOST, process.env.DB_NAME)"

# Reset migrations (ATTENTION : perte de données)
docker-compose exec mariadb mysql -u root -p -e "DROP DATABASE blindtest_production; CREATE DATABASE blindtest_production;"
docker-compose exec api npm run migrate:run
```

---

## 📊 CHECKLIST FINALE

### Avant de Démarrer
- [ ] Images Docker buildées localement
- [ ] Images pushées sur Docker Hub
- [ ] Accès SSH au VPS
- [ ] Docker installé sur VPS
- [ ] .env.production préparé avec toutes les valeurs

### Déploiement
- [ ] .env.production créé sur VPS
- [ ] docker-compose.yml créé sur VPS
- [ ] Images pullées depuis Docker Hub
- [ ] MariaDB démarrée
- [ ] Base de données vérifiée
- [ ] Tous les containers démarrés
- [ ] Migrations exécutées
- [ ] Super-admin créé

### Post-Déploiement
- [ ] Webhooks Stripe configurés
- [ ] .env.production mis à jour avec webhook secret
- [ ] API redémarrée
- [ ] Health endpoint répond
- [ ] Frontend accessible
- [ ] Login super-admin fonctionne
- [ ] Test paiement effectué

### Monitoring
- [ ] Logs vérifiés (pas d'erreurs critiques)
- [ ] Backup automatique configuré (optionnel)
- [ ] Monitoring configuré (optionnel)

---

## 🎉 FÉLICITATIONS !

Si tous les tests passent, votre application **Blind Test Musical** est maintenant **EN PRODUCTION** ! 🚀

**URL de l'application :** `https://votre-domaine.com`

**Login super-admin :**
- Email : `superadmin@blindtest.fr`
- Password : `SuperAdmin2025!` (à changer)

---

## 📞 SUPPORT

**Logs :**
```bash
docker-compose logs -f
```

**Redémarrer :**
```bash
docker-compose restart
```

**Documentation complète :**
- [GUIDE-DEPLOIEMENT-VPS.md](GUIDE-DEPLOIEMENT-VPS.md)
- [CHECKLIST-DEPLOIEMENT-FINAL.md](CHECKLIST-DEPLOIEMENT-FINAL.md)

---

**Auteur :** Claude
**Date :** 2025-10-19
**Méthode :** Docker Hub + docker-compose + Traefik

**Bon déploiement ! 🐳**
