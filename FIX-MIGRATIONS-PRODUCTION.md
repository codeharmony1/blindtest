# 🔧 Fix Migrations en Production

## 🎯 Problème

```
Error: Duplicate column name 'max_songs_per_event'
Migration "UpdateSubscriptionPlans1728030000000" failed
```

**Cause** : La base de données a déjà certaines colonnes mais les migrations ne sont pas enregistrées dans la table `migrations`.

---

## ✅ Solution Rapide

### Étape 1 : Vérifier l'état de la base

```bash
docker exec -it blindtest-api npx ts-node apps/api/check-db-schema.ts
```

Ce script affiche :
- ✅ Les migrations enregistrées
- ✅ Les colonnes existantes dans la table `tenants`
- ✅ Les tables présentes
- 💡 Des recommandations

### Étape 2 : Corriger les migrations

```bash
docker exec -it blindtest-api npx ts-node apps/api/fix-migrations.ts
```

Ce script :
- ✅ Vérifie la table `migrations`
- ✅ Détecte les migrations déjà appliquées au schéma
- ✅ Marque ces migrations comme exécutées
- ✅ Évite les doublons

**Le script attendra 5 secondes avant d'agir** - Ctrl+C pour annuler.

### Étape 3 : Créer le compte admin

```bash
docker exec -it blindtest-api npx ts-node apps/api/init-production.ts \
  votre@email.com \
  VotreMotDePasseSecurise123 \
  "Votre Nom"
```

---

## 🔄 Rebuild et Redéployer (Si besoin)

Si vous voulez transférer ces nouveaux scripts sur le serveur :

### Sur votre machine locale

```bash
# 1. Rebuild avec les nouveaux scripts
docker build -t blindtest-api:latest -f apps/api/Dockerfile .

# 2. Sauvegarder
docker save blindtest-api:latest -o blindtest-api.tar

# 3. Transférer
scp blindtest-api.tar alex@srv506488.hstgr.cloud:~/docker-services/
```

### Sur le serveur

```bash
# 1. Charger la nouvelle image
docker load -i blindtest-api.tar

# 2. Redémarrer
docker-compose down
docker-compose up -d

# 3. Vérifier et corriger
docker exec -it blindtest-api npx ts-node apps/api/check-db-schema.ts
docker exec -it blindtest-api npx ts-node apps/api/fix-migrations.ts

# 4. Créer le compte admin
docker exec -it blindtest-api npx ts-node apps/api/init-production.ts \
  email@example.com \
  password123 \
  "Admin Name"
```

---

## 🗑️ Option Alternative : Reset Complet (DANGER)

**⚠️ ATTENTION : Cette option supprime TOUTES les données !**

Si vous voulez repartir de zéro :

```bash
# 1. Supprimer toutes les tables
docker exec -it mariadb mysql -u root -p blindtest_production -e "
  SET FOREIGN_KEY_CHECKS = 0;
  DROP TABLE IF EXISTS migrations;
  DROP TABLE IF EXISTS tenants;
  DROP TABLE IF EXISTS tenant_users;
  DROP TABLE IF EXISTS password_reset_tokens;
  DROP TABLE IF EXISTS events;
  DROP TABLE IF EXISTS teams;
  DROP TABLE IF EXISTS players;
  DROP TABLE IF EXISTS rounds;
  DROP TABLE IF EXISTS round_songs;
  DROP TABLE IF EXISTS answers;
  DROP TABLE IF EXISTS scores;
  DROP TABLE IF EXISTS event_staff;
  DROP TABLE IF EXISTS organizers;
  DROP TABLE IF EXISTS super_admins;
  DROP TABLE IF EXISTS payments;
  DROP TABLE IF EXISTS audit_logs;
  DROP TABLE IF EXISTS tenant_sessions;
  SET FOREIGN_KEY_CHECKS = 1;
"

# 2. Exécuter les migrations
docker exec -it blindtest-api npm run migrate:run

# 3. Créer le compte admin
docker exec -it blindtest-api npx ts-node apps/api/init-production.ts \
  email@example.com \
  password123 \
  "Admin Name"
```

---

## 📊 Commandes de Diagnostic

### Voir les migrations enregistrées

```bash
docker exec -it mariadb mysql -u root -p blindtest_production -e "
  SELECT * FROM migrations ORDER BY timestamp;
"
```

### Voir les colonnes de la table tenants

```bash
docker exec -it mariadb mysql -u root -p blindtest_production -e "
  DESCRIBE tenants;
"
```

### Voir toutes les tables

```bash
docker exec -it mariadb mysql -u root -p blindtest_production -e "
  SHOW TABLES;
"
```

---

## ✅ Vérification Finale

Après la correction, testez :

```bash
# 1. Santé de l'API
curl https://blindtest.codeharmony.fr/api/health

# 2. Lister les utilisateurs
docker exec -it blindtest-api npx ts-node apps/api/list-all-users.ts

# 3. Connexion web
# Ouvrir https://blindtest.codeharmony.fr/auth/login
# Se connecter avec les identifiants créés
```

---

## 🎯 Résumé des Commandes

```bash
# Vérifier
docker exec -it blindtest-api npx ts-node apps/api/check-db-schema.ts

# Corriger
docker exec -it blindtest-api npx ts-node apps/api/fix-migrations.ts

# Initialiser
docker exec -it blindtest-api npx ts-node apps/api/init-production.ts email@example.com password "Name"

# Tester
docker exec -it blindtest-api npx ts-node apps/api/list-all-users.ts
curl https://blindtest.codeharmony.fr/api/health
```

---

**Date** : 2025-01-02
**Problème** : Migrations en conflit avec schéma existant
**Solution** : Scripts `check-db-schema.ts` et `fix-migrations.ts`
