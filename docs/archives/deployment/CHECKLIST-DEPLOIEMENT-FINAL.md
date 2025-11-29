# ✅ Checklist Finale - Déploiement Production

**Date:** 2025-10-19
**Application:** Blind Test Musical
**Version:** 1.0

---

## 📋 Avant de Commencer le Déploiement

### Configuration Services Externes

#### Stripe (30-45 min)

- [ ] Compte Stripe vérifié (business verification complétée)
- [ ] Mode LIVE activé
- [ ] **Produit "Paiement par Événement"** créé (19€ one-time)
  - [ ] Price ID copié → `STRIPE_PRICE_PER_EVENT`
- [ ] **Produit "Plan Mensuel"** créé (49€/mois recurring)
  - [ ] Price ID copié → `STRIPE_PRICE_MONTHLY`
- [ ] **Produit "Session 2 jours"** créé
  - [ ] Price ID copié → `STRIPE_PRICE_2DAYS`
- [ ] **Produit "Session 1 semaine"** créé
  - [ ] Price ID copié → `STRIPE_PRICE_1WEEK`
- [ ] **Produit "Session 1 mois"** créé
  - [ ] Price ID copié → `STRIPE_PRICE_1MONTH`
- [ ] Clés API LIVE copiées :
  - [ ] `STRIPE_SECRET_KEY` (sk_live_...)
  - [ ] `STRIPE_PUBLISHABLE_KEY` (pk_live_...)
- [ ] **Webhooks** (à configurer après déploiement)

#### Email SMTP (15 min)

- [ ] Service SMTP choisi (Hostinger / Gmail / SendGrid)
- [ ] Compte email créé : `support@votre-domaine.com`
- [ ] Credentials SMTP notés :
  - [ ] Host
  - [ ] Port
  - [ ] User
  - [ ] Password
- [ ] Test envoi email effectué (optionnel)

#### Domaine & DNS (5-60 min selon propagation)

- [ ] Domaine acheté
- [ ] DNS A record configuré : `@ → IP VPS`
- [ ] DNS A record pour API : `api → IP VPS` (optionnel)
- [ ] DNS A record pour App : `app → IP VPS` (optionnel)
- [ ] Propagation DNS vérifiée : `nslookup votre-domaine.com`

---

## 🖥️ Préparation VPS

### Installation Logiciels (20 min)

- [ ] Accès SSH fonctionnel
- [ ] Système à jour : `sudo apt update && sudo apt upgrade`
- [ ] Docker installé : `docker --version`
- [ ] Docker Compose installé : `docker-compose --version`
- [ ] Git installé : `git --version`

### Sécurité VPS

- [ ] Firewall configuré (ufw)
  - [ ] Port 22 (SSH) autorisé
  - [ ] Port 80 (HTTP) autorisé
  - [ ] Port 443 (HTTPS) autorisé
  - [ ] Firewall activé : `sudo ufw enable`
- [ ] SSH avec clés (recommandé, pas obligatoire)
- [ ] User non-root créé (recommandé)

### Ressources VPS

- [ ] Min 2GB RAM disponible
- [ ] Min 20GB storage disponible
- [ ] Espace disque < 80% utilisé

---

## 📁 Configuration Fichiers

### Fichier .env.production

- [ ] Fichier créé à la racine du projet
- [ ] **Base de données :**
  - [ ] `DB_HOST=mariadb` (si Docker) ou IP
  - [ ] `DB_PORT=3306`
  - [ ] `DB_USER=blindtest_prod`
  - [ ] `DB_PASS` = mot de passe fort généré
  - [ ] `DB_NAME=blindtest_production`

- [ ] **JWT Secrets :**
  - [ ] `JWT_SECRET` = secret 128 caractères (fourni)
  - [ ] `JWT_REFRESH_SECRET` = secret 128 caractères (fourni)
  - [ ] `JWT_ACCESS_EXPIRES_IN=15m`
  - [ ] `JWT_REFRESH_EXPIRES_IN=7d`

- [ ] **Stripe :**
  - [ ] `STRIPE_SECRET_KEY=sk_live_...`
  - [ ] `STRIPE_PUBLISHABLE_KEY=pk_live_...`
  - [ ] `STRIPE_WEBHOOK_SECRET=whsec_...` (remplir après)
  - [ ] `STRIPE_PRICE_PER_EVENT=price_...`
  - [ ] `STRIPE_PRICE_MONTHLY=price_...`
  - [ ] `STRIPE_PRICE_2DAYS=price_...`
  - [ ] `STRIPE_PRICE_1WEEK=price_...`
  - [ ] `STRIPE_PRICE_1MONTH=price_...`

- [ ] **SMTP :**
  - [ ] `SMTP_HOST` renseigné
  - [ ] `SMTP_PORT` renseigné
  - [ ] `SMTP_SECURE=true` (si port 465)
  - [ ] `SMTP_USER` renseigné
  - [ ] `SMTP_PASS` renseigné
  - [ ] `EMAIL_FROM` renseigné

- [ ] **API :**
  - [ ] `NODE_ENV=production`
  - [ ] `API_PORT=3001`
  - [ ] `API_HOST=0.0.0.0`
  - [ ] `CORS_ORIGIN=https://votre-domaine.com`
  - [ ] `FRONTEND_URL=https://votre-domaine.com`

- [ ] **SSL/Domaine :**
  - [ ] `DOMAIN=votre-domaine.com`
  - [ ] `LETSENCRYPT_EMAIL=moi@blabla.fr`

### Vérification Configuration

- [ ] Script exécutable : `chmod +x check-production-ready.sh`
- [ ] Vérification lancée : `./check-production-ready.sh`
- [ ] **Résultat : ✅ Tous les checks passent**

---

## 🚀 Déploiement

### Sur le VPS

- [ ] Code cloné : `git clone <repo>`
- [ ] Dans le bon dossier : `cd blind-test-musical`
- [ ] `.env.production` copié/édité sur le VPS
- [ ] Script exécutable : `chmod +x deploy.sh`
- [ ] Déploiement lancé : `./deploy.sh production`

### Vérifications Déploiement

- [ ] Tous les containers démarrés :
  ```bash
  docker-compose -f docker-compose.prod.yml ps
  ```
  - [ ] `api` → Up
  - [ ] `web` → Up
  - [ ] `mariadb` → Up
  - [ ] `traefik` → Up (si utilisé)

- [ ] Migrations DB exécutées sans erreur
- [ ] Aucune erreur critique dans les logs :
  ```bash
  docker-compose -f docker-compose.prod.yml logs
  ```

### Test Health Endpoint

- [ ] Depuis le VPS :
  ```bash
  curl http://localhost:3001/api/health
  ```
  Résultat : `{"ok":true,...}`

- [ ] Depuis internet :
  ```bash
  curl https://api.votre-domaine.com/api/health
  # ou
  curl https://votre-domaine.com/api/health
  ```
  Résultat : `{"ok":true,...}`

---

## 🔧 Configuration Post-Déploiement

### Super-Admin

- [ ] Super-admin créé :
  ```bash
  docker-compose -f docker-compose.prod.yml exec api npm run create:super-admin
  ```
- [ ] Credentials notés (changer après premier login)

### Webhooks Stripe

- [ ] Endpoint ajouté dans Stripe Dashboard
  - URL : `https://api.votre-domaine.com/api/payments/webhook`
- [ ] Events sélectionnés :
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
- [ ] Signing Secret copié
- [ ] `.env.production` mis à jour avec `STRIPE_WEBHOOK_SECRET`
- [ ] API redémarrée :
  ```bash
  docker-compose -f docker-compose.prod.yml restart api
  ```

### Backups

- [ ] Script backup créé : `/usr/local/bin/backup-blindtest.sh`
- [ ] Script rendu exécutable
- [ ] Crontab configuré (backup quotidien)
- [ ] Premier backup testé manuellement

---

## ✅ Tests de Validation Production

### Tests Backend

- [ ] **Health endpoint** répond en HTTPS
- [ ] **GET /api/payments/pricing** retourne 3 plans
- [ ] **POST /api/auth/register** fonctionne
- [ ] **POST /api/backstage/auth/login** fonctionne avec super-admin
- [ ] Logs API propres (pas d'erreurs critiques)

### Tests Frontend

- [ ] **Page d'accueil** se charge : `https://votre-domaine.com`
- [ ] **Page Pricing** affiche les plans : `/pricing`
- [ ] **Page Login** accessible : `/auth/login`
- [ ] **Dashboard Admin** accessible après login
- [ ] Aucune erreur console JavaScript

### Test Complet : Paiement Stripe

**⚠️ CE TEST DÉBITERA RÉELLEMENT VOTRE CARTE**

- [ ] Créer un nouveau compte tenant (register)
- [ ] Se connecter
- [ ] Aller sur `/pricing`
- [ ] Cliquer "Choisir ce plan" (Paiement par Événement - 19€)
- [ ] Remplir formulaire Stripe avec **vraie carte**
- [ ] Paiement validé
- [ ] **Redirection vers page success** avec détails paiement affichés
- [ ] Email de confirmation reçu (vérifier spam si absent)
- [ ] Dans **Stripe Dashboard** : paiement visible
- [ ] Dans **logs API** : webhook reçu
  ```bash
  docker-compose -f docker-compose.prod.yml logs api | grep webhook
  ```
- [ ] Dans **Stripe Dashboard → Webhooks** : événement reçu avec succès

**Optionnel :** Rembourser ce paiement test depuis Stripe Dashboard

### Test Flow Reset Password

- [ ] Aller sur `/auth/forgot-password`
- [ ] Entrer email existant
- [ ] Email reçu avec lien reset
- [ ] Cliquer lien → Page reset password
- [ ] Entrer nouveau mot de passe
- [ ] Validation OK
- [ ] Login avec nouveau mot de passe fonctionne

### Test Création Événement

- [ ] Login en tant que tenant
- [ ] Créer un événement
- [ ] Ajouter des rounds
- [ ] Ajouter des chansons
- [ ] Accéder à l'interface DJ : `/dj/[event-code]`
- [ ] Interface DJ s'affiche correctement

---

## 🔒 Vérifications Sécurité

### Configuration

- [ ] `.env.production` **NON commité** dans Git
- [ ] `.gitignore` contient `.env.production`
- [ ] Mots de passe DB forts (20+ caractères)
- [ ] JWT secrets uniques (128 caractères)
- [ ] Clés Stripe LIVE sécurisées (jamais partagées)

### Accès

- [ ] SSH sécurisé (port non-standard recommandé)
- [ ] Firewall actif
- [ ] Pas de ports inutiles ouverts
- [ ] Docker containers n'exposent que ports nécessaires

### SSL/TLS

- [ ] Certificat SSL actif (cadenas vert navigateur)
- [ ] HTTPS force redirect (pas de HTTP en production)
- [ ] Certificat valide (pas d'avertissement navigateur)

---

## 📊 Monitoring & Maintenance

### Logs

- [ ] Accès logs API :
  ```bash
  docker-compose -f docker-compose.prod.yml logs -f api
  ```
- [ ] Logs rotatifs configurés (pas de remplissage disque)
- [ ] Alerte email sur erreurs critiques (optionnel)

### Backups

- [ ] Backup DB quotidien actif
- [ ] Dernier backup testé (restauration)
- [ ] Rétention 30 jours configurée
- [ ] Backups hors VPS (S3/Drive) recommandé

### Performance

- [ ] Temps réponse API < 500ms
- [ ] Frontend charge < 3s
- [ ] Utilisation RAM < 80%
- [ ] Utilisation CPU normale (< 50% idle)
- [ ] Espace disque < 80%

---

## 📞 Contacts & Documentation

### Documentation Créée

- [ ] [.env.production](.env.production) - Configuration complète
- [ ] [deploy.sh](deploy.sh) - Script déploiement auto
- [ ] [check-production-ready.sh](check-production-ready.sh) - Vérification config
- [ ] [GUIDE-DEPLOIEMENT-VPS.md](GUIDE-DEPLOIEMENT-VPS.md) - Guide pas-à-pas complet
- [ ] [CHECKLIST-DEPLOIEMENT-FINAL.md](CHECKLIST-DEPLOIEMENT-FINAL.md) - Cette checklist

### Contacts Support

- **Stripe Support :** https://support.stripe.com
- **VPS Provider :** [support de votre hébergeur]
- **Email :** support@votre-domaine.com

### URLs Importantes

- **Application :** https://votre-domaine.com
- **API :** https://api.votre-domaine.com
- **Stripe Dashboard :** https://dashboard.stripe.com
- **Stripe Webhooks :** https://dashboard.stripe.com/webhooks

---

## 🎉 Validation Finale

### Checklist Globale

- [ ] **Configuration complète** (services externes)
- [ ] **VPS préparé** (Docker, firewall, domaine)
- [ ] **Déploiement réussi** (containers actifs)
- [ ] **Post-config effectuée** (super-admin, webhooks, backups)
- [ ] **Tests passent** (backend, frontend, paiement)
- [ ] **Sécurité validée** (SSL, secrets, firewall)
- [ ] **Monitoring actif** (logs, backups, performance)

### Si TOUS les points sont cochés :

# ✅ APPLICATION EN PRODUCTION - OPÉRATIONNELLE

**Félicitations ! Votre Blind Test Musical est maintenant déployé en production.**

### Prochaines Étapes

1. **Communiquer l'URL** à vos premiers utilisateurs
2. **Monitorer les logs** pendant les 48 premières heures
3. **Faire un backup manuel** après premiers vrais événements
4. **Configurer monitoring avancé** (Sentry, Datadog, etc.)
5. **Préparer documentation utilisateur** si nécessaire

---

## 🐛 En Cas de Problème

**Voir guide dépannage complet :**
- [GUIDE-DEPLOIEMENT-VPS.md](GUIDE-DEPLOIEMENT-VPS.md) - Section Dépannage

**Commandes utiles :**
```bash
# Voir tous les logs
docker-compose -f docker-compose.prod.yml logs -f

# Redémarrer un service
docker-compose -f docker-compose.prod.yml restart api

# Redémarrer tout
docker-compose -f docker-compose.prod.yml restart

# Voir status containers
docker-compose -f docker-compose.prod.yml ps

# Voir utilisation ressources
docker stats
```

**Logs spécifiques :**
```bash
# API
docker-compose -f docker-compose.prod.yml logs -f api

# Base de données
docker-compose -f docker-compose.prod.yml logs -f mariadb

# Reverse proxy
docker-compose -f docker-compose.prod.yml logs -f traefik
```

---

**Auteur:** Claude
**Date:** 2025-10-19
**Version:** 1.0

**Document maintenu par:** [Votre Nom]
**Dernière validation:** [Date]

---

**📋 Imprimer cette checklist et la remplir durant le déploiement pour ne rien oublier !**
