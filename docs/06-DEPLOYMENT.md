# 🚀 Guide de Déploiement

Guide complet pour déployer l'application Blind Test Musical en production.

## 📋 Table des Matières

- [Prérequis](#prérequis)
- [Environnement de Production](#environnement-de-production)
- [Procédure de Déploiement](#procédure-de-déploiement)
- [Vérifications Post-Déploiement](#vérifications-post-déploiement)
- [Rollback](#rollback)

## Prérequis

### Logiciels Requis

- **Docker** : v20.10+
- **Docker Compose** : v2.0+
- **Git** : v2.30+
- **Node.js** : v20+ (pour le build local)

### Accès Requis

- Accès SSH au serveur VPS
- Droits sudo sur le serveur
- Accès à la base de données MariaDB
- Clés API configurées (Stripe, SMTP, etc.)

## Environnement de Production

### Serveur

- **OS** : Ubuntu 22.04 LTS
- **Domaine** : blindtest.codeharmony.fr
- **Reverse Proxy** : Traefik v3
- **Base de données** : MariaDB
- **Cache** : Redis

### Variables d'Environnement

Créer/vérifier le fichier `.env` :

```bash
# Database
DB_USER=blindtest_prod
DB_PASS=<strong_password>
DB_NAME=blindtest_production

# JWT
JWT_SECRET=<random_secret_64_chars>

# Stripe
STRIPE_SECRET_KEY=<stripe_secret_key>
STRIPE_PUBLISHABLE_KEY=<stripe_public_key>
STRIPE_WEBHOOK_SECRET=<webhook_secret>

# Email (SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=alexandre.desire@codeharmony.fr
SMTP_PASS=<smtp_password>
EMAIL_FROM=support@codeharmony.fr

# Redis
REDIS_PASSWORD=<redis_password>

# Admin
SUPER_ADMIN_EMAIL=admin@codeharmony.fr
SUPER_ADMIN_PASSWORD=<admin_password>
```

## Procédure de Déploiement

### Étape 1 : Build Local (Machine Windows)

```powershell
# 1. Se positionner dans le projet
cd "D:\Projet\Blind test musical"

# 2. Vérifier que tout est à jour
git status
git pull origin main

# 3. Build de l'API
docker build -f apps/api/Dockerfile -t blindtest-api:latest .

# 4. Build du Web
docker build -f apps/web/Dockerfile -t blindtest-web:latest .

# 5. Sauvegarder les images
docker save blindtest-api:latest -o blindtest-api.tar
docker save blindtest-web:latest -o blindtest-web.tar

# 6. Vérifier les fichiers
dir *.tar
```

### Étape 2 : Transfert vers le Serveur

**Option A : Avec SCP**
```powershell
scp blindtest-api.tar alex@srv506488:/home/alex/
scp blindtest-web.tar alex@srv506488:/home/alex/
```

**Option B : Avec WinSCP/FileZilla**
1. Ouvrir WinSCP
2. Se connecter au serveur
3. Transférer les fichiers `.tar` vers `/home/alex/`

### Étape 3 : Déploiement sur le Serveur

```bash
# 1. Se connecter au serveur
ssh alex@srv506488

# 2. Sauvegarder la base de données AVANT TOUT
cd ~
mysqldump -u root -p blindtest_production > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Charger les nouvelles images
docker load -i blindtest-api.tar
docker load -i blindtest-web.tar

# 4. Vérifier les images
docker images | grep blindtest

# 5. Aller dans le dossier docker-compose
cd ~/docker-services

# 6. Arrêter les conteneurs actuels
docker-compose stop blindtest-api blindtest-web

# 7. Supprimer les anciens conteneurs
docker-compose rm -f blindtest-api blindtest-web

# 8. Démarrer les nouveaux conteneurs
docker-compose up -d blindtest-api blindtest-web

# 9. Vérifier les logs
docker logs blindtest-api --tail 50
docker logs blindtest-web --tail 20
```

### Étape 4 : Exécuter les Migrations

```bash
# Option 1 : Migration SQL manuelle (RECOMMANDÉ pour la production)
docker exec -it mariadb mysql -u blindtest_prod -p blindtest_production

# Puis dans MySQL, coller les migrations nécessaires
# Voir docs/07-MIGRATIONS.md pour la liste complète

# Option 2 : Migration TypeORM (si disponible)
docker exec -it blindtest-api npm run migrate:run
```

## Vérifications Post-Déploiement

### 1. Vérifier les Conteneurs

```bash
# Statut des conteneurs
docker ps | grep blindtest

# Vérifier la santé (healthy)
docker ps --format "table {{.Names}}\t{{.Status}}" | grep blindtest
```

### 2. Tester l'API

```bash
# Health check
curl https://blindtest.codeharmony.fr/api/health

# Devrait retourner :
# {"ok":true,"timestamp":"...","version":"1.0.0","environment":"production"}
```

### 3. Tester le Frontend

```bash
# Vérifier que le site charge
curl -I https://blindtest.codeharmony.fr

# Devrait retourner : HTTP/2 200
```

### 4. Vérifier la Base de Données

```bash
# Se connecter
docker exec -it mariadb mysql -u blindtest_prod -p blindtest_production

# Vérifier les tables
SHOW TABLES;

# Vérifier une table spécifique
DESCRIBE round_songs;
```

### 5. Tester une Fonctionnalité Complète

1. **Inscription** : https://blindtest.codeharmony.fr/auth/register
   - ✅ Formulaire s'affiche correctement
   - ✅ Pas de champ "custom_domain"
   - ✅ Champ "organisation" marqué optionnel
   - ✅ Sélecteur de plan lisible

2. **Créer un compte test**
   - ✅ Inscription réussie
   - ✅ Email de confirmation reçu

3. **Interface DJ**
   - ✅ Créer un événement
   - ✅ Créer un round
   - ✅ Ajouter une chanson
   - ✅ Le guide rapide scrolle avec le contenu

## Rollback

### En cas de problème critique

```bash
# 1. Arrêter les nouveaux conteneurs
docker-compose stop blindtest-api blindtest-web
docker-compose rm -f blindtest-api blindtest-web

# 2. Restaurer la base de données
mysql -u blindtest_prod -p blindtest_production < backup_YYYYMMDD_HHMMSS.sql

# 3. Charger les anciennes images
docker tag blindtest-api:latest blindtest-api:broken
docker tag blindtest-web:latest blindtest-web:broken
docker load -i /path/to/old/blindtest-api.tar
docker load -i /path/to/old/blindtest-web.tar

# 4. Redémarrer
docker-compose up -d blindtest-api blindtest-web

# 5. Vérifier
docker logs blindtest-api
curl https://blindtest.codeharmony.fr/api/health
```

## Checklist de Déploiement

Utilisez cette checklist pour chaque déploiement :

### Pré-Déploiement
- [ ] Code testé en local
- [ ] Migrations SQL préparées
- [ ] Variables d'environnement vérifiées
- [ ] Images Docker buildées
- [ ] Images transférées sur le serveur

### Déploiement
- [ ] Sauvegarde DB créée
- [ ] Images chargées
- [ ] Conteneurs arrêtés
- [ ] Nouveaux conteneurs démarrés
- [ ] Migrations exécutées

### Post-Déploiement
- [ ] Conteneurs en état "healthy"
- [ ] API répond correctement
- [ ] Frontend accessible
- [ ] Logs sans erreurs critiques
- [ ] Test fonctionnel complet réussi
- [ ] Email de confirmation fonctionne

### En cas de problème
- [ ] Logs consultés et analysés
- [ ] Problème identifié et documenté
- [ ] Décision : correction rapide ou rollback
- [ ] Actions exécutées
- [ ] Système stable vérifié

## Monitoring Post-Déploiement

### Première heure
```bash
# Suivre les logs en temps réel
docker logs -f blindtest-api

# Vérifier les erreurs
docker logs blindtest-api | grep -i error
```

### Premières 24h
- Vérifier les logs toutes les 2-3 heures
- Monitorer les performances
- Vérifier les emails de confirmation
- Tester les inscriptions

### Commandes Utiles

```bash
# Voir l'utilisation des ressources
docker stats blindtest-api blindtest-web

# Voir les connexions actives
docker exec -it mariadb mysql -u blindtest_prod -p -e "SHOW PROCESSLIST;"

# Redémarrer un conteneur spécifique
docker-compose restart blindtest-api

# Voir les dernières lignes des logs avec timestamp
docker logs blindtest-api --tail 100 --timestamps
```

## Contact et Support

En cas de problème lors du déploiement :

1. Consulter [Troubleshooting](./09-TROUBLESHOOTING.md)
2. Vérifier les logs : `docker logs blindtest-api`
3. Vérifier le [Changelog](./10-CHANGELOG.md) pour les breaking changes

---

**Dernière mise à jour** : 2025-10-29
**Version** : 1.0.0
**Auteur** : Alexandre Désiré
