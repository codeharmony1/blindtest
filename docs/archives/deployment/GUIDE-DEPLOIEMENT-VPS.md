# 🚀 Guide Déploiement VPS - Blind Test Musical

**Date:** 2025-10-19
**Version:** 1.0
**Temps estimé:** 2-3 heures (première fois)

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration Stripe](#configuration-stripe)
3. [Configuration Email SMTP](#configuration-email-smtp)
4. [Préparation VPS](#préparation-vps)
5. [Configuration Domaine & SSL](#configuration-domaine--ssl)
6. [Déploiement Application](#déploiement-application)
7. [Post-Déploiement](#post-déploiement)
8. [Dépannage](#dépannage)

---

## Prérequis

### Ce dont vous avez besoin

- ✅ **VPS** avec accès SSH root/sudo
  - Min 2GB RAM, 2 CPU cores, 20GB storage
  - Ubuntu 20.04 LTS ou 22.04 LTS recommandé

- ✅ **Domaine** pointant vers votre VPS
  - DNS A record configuré
  - Ex: `blindtest.com` → IP de votre VPS

- ✅ **Compte Stripe** (mode LIVE activé)
  - Vérification business complétée
  - Clés API LIVE disponibles

- ✅ **Email SMTP** fonctionnel
  - Hostinger, Gmail, SendGrid, etc.
  - Credentials disponibles

---

## Configuration Stripe

### Étape 1 : Passer en Mode LIVE

1. Aller sur https://dashboard.stripe.com
2. Désactiver "Mode Test" en haut à droite
3. Compléter la vérification business si nécessaire

### Étape 2 : Créer les Produits & Prix

**Produit 1 : Paiement par Événement**
```
Nom: Paiement par Événement
Description: Paiement unique pour organiser un événement
Prix: 19.00 EUR
Type: One-time payment
```
→ **Copier le Price ID** (commence par `price_...`)
→ Sera utilisé dans `STRIPE_PRICE_PER_EVENT`

**Produit 2 : Plan Mensuel**
```
Nom: Plan Mensuel
Description: Abonnement mensuel pour événements illimités
Prix: 49.00 EUR
Type: Recurring - Monthly
```
→ **Copier le Price ID**
→ Sera utilisé dans `STRIPE_PRICE_MONTHLY`

**Produit 3-5 : Sessions Temporaires**

Répéter pour :
- Session 2 jours (ex: 5 EUR)
- Session 1 semaine (ex: 10 EUR)
- Session 1 mois (ex: 15 EUR)

### Étape 3 : Récupérer les Clés API

1. Aller dans **Developers** → **API Keys**
2. Copier :
   - **Publishable key** (commence par `pk_live_...`)
   - **Secret key** (commence par `sk_live_...`) ⚠️ Ne jamais partager

### Étape 4 : Configurer Webhooks

**⚠️ À faire APRÈS le déploiement (quand l'API est accessible)**

1. Aller dans **Developers** → **Webhooks**
2. Cliquer "Add endpoint"
3. URL : `https://api.votre-domaine.com/api/payments/webhook`
4. Events à sélectionner :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Copier le Signing Secret** (commence par `whsec_...`)

---

## Configuration Email SMTP

### Option 1 : Hostinger (Recommandé)

1. Se connecter à Hostinger
2. Créer adresse email : `support@votre-domaine.com`
3. Noter les credentials :
   ```
   Host: smtp.hostinger.com
   Port: 465
   Secure: SSL/TLS
   User: support@votre-domaine.com
   Password: [votre mot de passe]
   ```

### Option 2 : Gmail

1. Activer authentification 2FA sur votre compte Gmail
2. Créer un "App Password" :
   - https://myaccount.google.com/apppasswords
3. Noter :
   ```
   Host: smtp.gmail.com
   Port: 587
   Secure: STARTTLS
   User: votre-email@gmail.com
   Password: [app password généré]
   ```

### Option 3 : SendGrid

1. Créer compte sur https://sendgrid.com (Free tier : 100 emails/jour)
2. Créer API Key
3. Noter :
   ```
   Host: smtp.sendgrid.net
   Port: 587
   User: apikey
   Password: [votre API key]
   ```

### Tester SMTP (Optionnel)

Créer fichier `test-smtp.js` :
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'support@votre-domaine.com',
    pass: 'votre-mot-de-passe'
  }
});

transporter.sendMail({
  from: 'support@votre-domaine.com',
  to: 'moi@blabla.fr',
  subject: 'Test SMTP',
  text: 'Si vous recevez ceci, SMTP fonctionne !'
}).then(() => console.log('✅ Email envoyé')).catch(console.error);
```

Exécuter : `node test-smtp.js`

---

## Préparation VPS

### Étape 1 : Se Connecter au VPS

```bash
ssh root@votre-ip-vps
# ou
ssh votre-user@votre-ip-vps
```

### Étape 2 : Mise à Jour Système

```bash
sudo apt update
sudo apt upgrade -y
```

### Étape 3 : Installer Docker

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Vérifier installation
docker --version

# Ajouter user au groupe docker (si pas root)
sudo usermod -aG docker $USER
newgrp docker
```

### Étape 4 : Installer Docker Compose

```bash
# Version 2.x
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier
docker-compose --version
```

### Étape 5 : Installer Git

```bash
sudo apt install git -y
git --version
```

### Étape 6 : Configurer Firewall

```bash
# Installer ufw si nécessaire
sudo apt install ufw -y

# Autoriser SSH
sudo ufw allow 22/tcp

# Autoriser HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer firewall
sudo ufw enable

# Vérifier status
sudo ufw status
```

---

## Configuration Domaine & SSL

### Étape 1 : Configuration DNS

Dans votre registrar (ex: OVH, Gandi, Hostinger) :

**Record A principal :**
```
Type: A
Name: @
Value: [IP de votre VPS]
TTL: 3600
```

**Sous-domaines (Optionnel mais recommandé) :**
```
Type: A
Name: api
Value: [IP de votre VPS]
TTL: 3600

Type: A
Name: app
Value: [IP de votre VPS]
TTL: 3600
```

**Vérifier propagation DNS :**
```bash
# Attendre 5-60 minutes
nslookup votre-domaine.com
nslookup api.votre-domaine.com
```

### Étape 2 : SSL avec Let's Encrypt (via Traefik)

Traefik est configuré dans `docker-compose.prod.yml` pour gérer automatiquement SSL.

**Variables nécessaires dans `.env.production` :**
```bash
DOMAIN=votre-domaine.com
LETSENCRYPT_EMAIL=moi@blabla.fr
```

Traefik obtiendra automatiquement les certificats au premier démarrage.

---

## Déploiement Application

### Étape 1 : Cloner le Projet

```bash
# Créer dossier
cd /var/www
sudo mkdir blindtest
sudo chown $USER:$USER blindtest
cd blindtest

# Cloner (remplacer par votre repo)
git clone https://github.com/votre-username/blind-test-musical.git .

# Vérifier
ls -la
```

### Étape 2 : Configurer .env.production

```bash
# Copier le template
cp .env.production .env.production.backup

# Éditer avec nano ou vim
nano .env.production
```

**Remplacer TOUTES les valeurs `CHANGEZ_MOI` :**

```bash
# Base de données
DB_HOST=mariadb  # Nom du service Docker
DB_USER=blindtest_prod
DB_PASS=[générer un mot de passe fort]
DB_NAME=blindtest_production

# JWT (déjà générés, ne pas changer)
JWT_SECRET=2af150f1a52a0bbc8dfca9094bc9ff03db4e2bb404e1ac56da087767dfae0a62ca3b233cacfbff7dfc2fadf2707584370a32ee94fc0e1247f9c653bd92939b9d
JWT_REFRESH_SECRET=c5523c9f5fb95d13207c6ffec06289e75fbfc5d3c3fb0607fffee9a841df20ee6181d7676a5c5f2b0296c17c56c248be65a57dc626dccf5b37806d14fe006232

# Stripe LIVE
STRIPE_SECRET_KEY=sk_live_[votre_clé]
STRIPE_PUBLISHABLE_KEY=pk_live_[votre_clé]
STRIPE_WEBHOOK_SECRET=whsec_[sera configuré après]

# Stripe Price IDs
STRIPE_PRICE_PER_EVENT=price_[votre_id_19_euros]
STRIPE_PRICE_MONTHLY=price_[votre_id_49_euros]
STRIPE_PRICE_2DAYS=price_[votre_id]
STRIPE_PRICE_1WEEK=price_[votre_id]
STRIPE_PRICE_1MONTH=price_[votre_id]

# SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=support@votre-domaine.com
SMTP_PASS=[votre_mot_de_passe_smtp]
EMAIL_FROM=support@votre-domaine.com

# Domaine
CORS_ORIGIN=https://votre-domaine.com
FRONTEND_URL=https://votre-domaine.com
DOMAIN=votre-domaine.com
LETSENCRYPT_EMAIL=moi@blabla.fr
```

**Sauvegarder** : `Ctrl+X` puis `Y` puis `Enter`

### Étape 3 : Vérifier Configuration

```bash
# Rendre le script exécutable
chmod +x check-production-ready.sh

# Exécuter vérification
./check-production-ready.sh
```

**Résultat attendu :** `✅ Tous les checks passent !`

Si erreurs, les corriger avant de continuer.

### Étape 4 : Déployer

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Lancer le déploiement
./deploy.sh production
```

**Le script va :**
1. ✅ Vérifier configuration
2. ✅ Build les images Docker
3. ✅ Démarrer les containers
4. ✅ Exécuter migrations DB
5. ✅ Vérifier health de l'API

**Durée :** 5-10 minutes (premier déploiement)

### Étape 5 : Vérifier Déploiement

```bash
# Voir les containers actifs
docker-compose -f docker-compose.prod.yml ps

# Voir les logs
docker-compose -f docker-compose.prod.yml logs -f api

# Tester health endpoint
curl https://api.votre-domaine.com/api/health
# ou
curl https://votre-domaine.com/api/health
```

**Résultat attendu :**
```json
{
  "ok": true,
  "timestamp": "2025-10-19T...",
  "version": "1.0.0",
  "environment": "production"
}
```

---

## Post-Déploiement

### Étape 1 : Créer Super-Admin

```bash
docker-compose -f docker-compose.prod.yml exec api npm run create:super-admin
```

**Sortie :**
```
✅ Super-admin créé avec succès:
   Email: superadmin@blindtest.fr
   Mot de passe: SuperAdmin2025!
```

**⚠️ Changer immédiatement ce mot de passe via l'interface web**

### Étape 2 : Configurer Webhooks Stripe

Maintenant que l'API est accessible :

1. Retourner sur https://dashboard.stripe.com/webhooks
2. Ajouter endpoint : `https://api.votre-domaine.com/api/payments/webhook`
3. Copier le Signing Secret
4. Mettre à jour `.env.production` :
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_[secret copié]
   ```
5. Redémarrer l'API :
   ```bash
   docker-compose -f docker-compose.prod.yml restart api
   ```

### Étape 3 : Tester l'Application

**Backend :**
```bash
curl https://api.votre-domaine.com/api/health
curl https://api.votre-domaine.com/api/payments/pricing
```

**Frontend :**
- Ouvrir navigateur : `https://votre-domaine.com`
- Vérifier que la page se charge
- Aller sur `/pricing` → Vérifier les plans s'affichent

**Login Super-Admin :**
- Aller sur `/auth/login` ou `/admin`
- Se connecter avec credentials super-admin
- Vérifier accès au dashboard

### Étape 4 : Faire un Test de Paiement

**⚠️ IMPORTANT : Faire un vrai paiement test en LIVE mode**

1. Créer un nouveau tenant (register)
2. Aller sur Pricing
3. Choisir plan "Paiement par Événement" (19€)
4. Utiliser une **vraie carte bancaire** (sera chargée)
5. Vérifier :
   - ✅ Redirection vers page success
   - ✅ Détails paiement affichés
   - ✅ Email de confirmation reçu (si SMTP ok)
   - ✅ Stripe Dashboard montre le paiement
   - ✅ Webhook reçu (voir logs API)

**Annuler le paiement si c'était juste un test :**
- Aller dans Stripe Dashboard → Remboursement

### Étape 5 : Configurer Backups Automatiques

```bash
# Créer script backup
sudo nano /usr/local/bin/backup-blindtest.sh
```

**Contenu :**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/blindtest"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

cd /var/www/blindtest
docker-compose -f docker-compose.prod.yml exec -T mariadb \
  mysqldump -u root -p$DB_PASS blindtest_production > $BACKUP_DIR/db_$DATE.sql

# Garder seulement 30 derniers backups
find $BACKUP_DIR -name "db_*.sql" -mtime +30 -delete

echo "Backup créé: $BACKUP_DIR/db_$DATE.sql"
```

**Rendre exécutable :**
```bash
sudo chmod +x /usr/local/bin/backup-blindtest.sh
```

**Ajouter à crontab (backup quotidien 3h du matin) :**
```bash
sudo crontab -e
```

Ajouter :
```
0 3 * * * /usr/local/bin/backup-blindtest.sh
```

### Étape 6 : Monitoring (Optionnel)

**Logs persistants :**
```bash
# Voir logs en temps réel
docker-compose -f docker-compose.prod.yml logs -f

# Logs API seulement
docker-compose -f docker-compose.prod.yml logs -f api

# Dernières 100 lignes
docker-compose -f docker-compose.prod.yml logs --tail=100 api
```

**Monitoring ressources :**
```bash
# Stats containers
docker stats

# Espace disque
df -h

# Utilisation RAM
free -h
```

---

## Dépannage

### Problème : Containers ne démarrent pas

**Diagnostic :**
```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs
```

**Solutions courantes :**
- Port déjà utilisé → Vérifier avec `netstat -tulpn | grep :80`
- Erreur .env → Vérifier syntaxe `.env.production`
- Espace disque plein → `df -h` et nettoyer

### Problème : Erreur SSL/HTTPS

**Symptôme :** "Your connection is not private"

**Causes :**
1. DNS pas encore propagé → Attendre 1h
2. Let's Encrypt rate limit → Vérifier logs Traefik
3. Port 80/443 bloqués → Vérifier firewall

**Vérifier Traefik :**
```bash
docker-compose -f docker-compose.prod.yml logs traefik | grep -i "certificate"
```

### Problème : API inaccessible

**Vérifier container API :**
```bash
docker-compose -f docker-compose.prod.yml ps api
docker-compose -f docker-compose.prod.yml logs api --tail=50
```

**Tester depuis le VPS :**
```bash
curl http://localhost:3001/api/health
```

Si fonctionne en local mais pas depuis internet → Problème réseau/firewall

### Problème : Base de données

**Erreur "Can't connect to MySQL server" :**
```bash
# Vérifier container DB
docker-compose -f docker-compose.prod.yml ps mariadb

# Voir logs DB
docker-compose -f docker-compose.prod.yml logs mariadb

# Redémarrer DB
docker-compose -f docker-compose.prod.yml restart mariadb
```

### Problème : Emails non reçus

**Vérifier configuration SMTP :**
```bash
# Voir logs API pour erreurs SMTP
docker-compose -f docker-compose.prod.yml logs api | grep -i smtp
```

**Tester SMTP manuellement :**
```bash
docker-compose -f docker-compose.prod.yml exec api node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
transporter.sendMail({
  from: process.env.EMAIL_FROM,
  to: 'moi@blabla.fr',
  subject: 'Test',
  text: 'Test SMTP production'
}).then(() => console.log('OK')).catch(console.error);
"
```

### Problème : Paiements Stripe échouent

**Vérifier :**
1. Clés LIVE utilisées (pas TEST)
2. Webhooks configurés avec bonne URL
3. Signing secret correct dans `.env`

**Voir logs webhooks Stripe :**
- Dashboard Stripe → Developers → Webhooks → Your endpoint → Recent events

**Logs API :**
```bash
docker-compose -f docker-compose.prod.yml logs api | grep -i stripe
```

---

## 📊 Checklist Finale

### Avant Mise en Production

- [ ] Configuration Stripe LIVE complète
- [ ] Tous les Price IDs créés et copiés
- [ ] SMTP configuré et testé
- [ ] `.env.production` rempli à 100%
- [ ] DNS propagé (vérifier avec `nslookup`)
- [ ] Firewall configuré (ports 80, 443, 22)
- [ ] Backups automatiques configurés

### Après Déploiement

- [ ] Health endpoint répond en HTTPS
- [ ] Super-admin créé
- [ ] Login fonctionne
- [ ] Frontend accessible
- [ ] Pricing page affiche les plans
- [ ] Test paiement réel effectué et validé
- [ ] Webhooks Stripe configurés
- [ ] Email reset password testé
- [ ] Monitoring configuré (logs)

### Sécurité

- [ ] Mots de passe DB forts
- [ ] JWT secrets uniques (pas les defaults)
- [ ] Firewall activé
- [ ] SSH avec clés (désactiver password auth)
- [ ] Backups testés
- [ ] Logs monitoring actif

---

## 📞 Support

**Documentation :**
- [DEPLOYMENT.md](DEPLOYMENT.md) - Guide Docker détaillé
- [CHECKLIST-MISE-EN-PRODUCTION.md](CHECKLIST-MISE-EN-PRODUCTION.md) - Checklist complète
- [STRIPE-OPTIMIZATION-COMPLETE.md](STRIPE-OPTIMIZATION-COMPLETE.md) - Config Stripe

**Logs utiles :**
```bash
# Tous les services
docker-compose -f docker-compose.prod.yml logs -f

# API seulement
docker-compose -f docker-compose.prod.yml logs -f api

# Base de données
docker-compose -f docker-compose.prod.yml logs -f mariadb

# Traefik (reverse proxy)
docker-compose -f docker-compose.prod.yml logs -f traefik
```

---

**Auteur:** Claude
**Date:** 2025-10-19
**Version:** 1.0

**Temps total estimé:** 2-3h (première fois), 30min (redéploiements)

---

**🎉 Félicitations ! Votre application Blind Test Musical est maintenant en production !**
