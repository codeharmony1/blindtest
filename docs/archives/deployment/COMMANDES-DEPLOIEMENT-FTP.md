# 🚀 Commandes Déploiement FTP - Résumé Rapide

**Méthode:** Build local → Export .tar → FTP → Load sur VPS

---

## 📦 PARTIE 1 : Sur Votre PC (Windows)

### Build + Export Images (15 min)

```bash
# Se placer dans le projet
cd "d:\Projet\Blind test musical"

# Build images
docker build -t blindtest-api:latest ./apps/api
docker build -t blindtest-web:latest ./apps/web

# Créer dossier export
mkdir docker-images
cd docker-images

# Exporter images en .tar
docker save blindtest-api:latest -o blindtest-api.tar
docker save blindtest-web:latest -o blindtest-web.tar

# Vérifier tailles (300-500 MB chacun)
dir *.tar
```

### Transférer par FTP (10-30 min)

**Via FileZilla/WinSCP :**
- Source : `d:\Projet\Blind test musical\docker-images\`
- Destination VPS : `/root/docker-images/`
- Fichiers : `blindtest-api.tar` + `blindtest-web.tar`

**Via SCP (alternative) :**
```bash
scp blindtest-api.tar root@VOTRE-IP-VPS:/root/docker-images/
scp blindtest-web.tar root@VOTRE-IP-VPS:/root/docker-images/
```

---

## 🖥️ PARTIE 2 : Sur VPS (SSH)

### Connexion

```bash
ssh root@VOTRE-IP-VPS
```

### Préparer Environnement (10 min)

```bash
# Installer Docker si nécessaire
curl -fsSL https://get.docker.com | sh

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Créer dossier application
mkdir -p /var/www/blindtest
cd /var/www/blindtest
```

### Créer .env.production (5 min)

```bash
nano .env.production
```

**Copier/coller depuis le template préparé localement**

**Variables critiques à remplir :**
- `DB_PASS=...`
- `STRIPE_SECRET_KEY=sk_live_...`
- `STRIPE_PUBLISHABLE_KEY=pk_live_...`
- `STRIPE_PRICE_*=price_...` (5 prix)
- `SMTP_USER=...`
- `SMTP_PASS=...`
- `CORS_ORIGIN=https://votre-domaine.com`
- `DOMAIN=votre-domaine.com`
- `LETSENCRYPT_EMAIL=moi@blabla.fr`

**Sauvegarder :** `Ctrl+X` → `Y` → `Enter`

### Créer docker-compose.yml (5 min)

```bash
nano docker-compose.yml
```

**Copier le contenu complet depuis [DEPLOIEMENT-DOCKER-VPS.md](DEPLOIEMENT-DOCKER-VPS.md) section "Étape 5"**

**Points importants :**
- `image: blindtest-api:latest` (sans username Docker Hub)
- `image: blindtest-web:latest` (sans username Docker Hub)

**Sauvegarder :** `Ctrl+X` → `Y` → `Enter`

### Charger Images Docker (5 min)

```bash
# Aller dans dossier avec les .tar
cd /root/docker-images

# Vérifier fichiers
ls -lh

# Charger images
docker load -i blindtest-api.tar
docker load -i blindtest-web.tar

# Vérifier chargement
docker images | grep blindtest
```

**Attendu :**
```
blindtest-api    latest    ...
blindtest-web    latest    ...
```

### Démarrer Application (10 min)

```bash
# Retourner dans dossier app
cd /var/www/blindtest

# Démarrer MariaDB seule d'abord
docker-compose up -d mariadb

# Attendre 30 secondes
sleep 30

# Vérifier MariaDB
docker-compose ps mariadb

# Démarrer tous les services
docker-compose up -d

# Voir logs en temps réel
docker-compose logs -f
```

**Appuyer sur `Ctrl+C` pour sortir des logs**

### Migrations & Super-Admin (3 min)

```bash
# Exécuter migrations
docker-compose exec api npm run migrate:run

# Créer super-admin
docker-compose exec api npm run create:super-admin
```

**Noter credentials affichés**

### Tests (2 min)

```bash
# Test local
curl http://localhost:3001/api/health

# Test public (remplacer domaine)
curl https://votre-domaine.com/api/health
```

**Attendu :** `{"ok":true,...}`

### Configurer Webhooks Stripe (5 min)

1. https://dashboard.stripe.com/webhooks
2. Add endpoint : `https://votre-domaine.com/api/payments/webhook`
3. Events : `checkout.session.completed`, `customer.subscription.*`
4. Copier Signing Secret (whsec_...)

```bash
# Mettre à jour .env
nano .env.production
# Trouver STRIPE_WEBHOOK_SECRET et remplacer
# Sauvegarder

# Redémarrer API
docker-compose restart api
```

---

## ✅ Vérifications Finales

### Status Containers

```bash
docker-compose ps
```

**Attendu :** 4 containers "Up"

### Logs

```bash
# Tous
docker-compose logs

# API seulement
docker-compose logs api | tail -50
```

### Tests Frontend

**Navigateur :**
- https://votre-domaine.com
- https://votre-domaine.com/pricing
- https://votre-domaine.com/auth/login

**Login super-admin :**
- Email : `superadmin@blindtest.fr`
- Password : `SuperAdmin2025!`

---

## 🔄 Mise à Jour Ultérieure

**Sur PC :**
```bash
docker build -t blindtest-api:latest ./apps/api
docker build -t blindtest-web:latest ./apps/web
docker save blindtest-api:latest -o blindtest-api.tar
docker save blindtest-web:latest -o blindtest-web.tar
# Transférer par FTP
```

**Sur VPS :**
```bash
cd /root/docker-images
docker-compose -f /var/www/blindtest/docker-compose.yml down
docker load -i blindtest-api.tar
docker load -i blindtest-web.tar
cd /var/www/blindtest
docker-compose up -d
docker-compose exec api npm run migrate:run
```

---

## 📚 Documentation Complète

**Guide détaillé :**
→ [DEPLOIEMENT-DOCKER-VPS.md](DEPLOIEMENT-DOCKER-VPS.md)

**Dépannage :**
→ Voir section "DÉPANNAGE" dans le guide complet

---

## 🆘 Commandes Utiles

```bash
# Voir logs
docker-compose logs -f api

# Redémarrer
docker-compose restart

# Arrêter tout
docker-compose down

# Démarrer tout
docker-compose up -d

# Status
docker-compose ps

# Shell dans API
docker-compose exec api sh

# MySQL
docker-compose exec mariadb mysql -u root -p
```

---

**Temps total : 1-2h**
**Prêt pour production ! 🚀**
