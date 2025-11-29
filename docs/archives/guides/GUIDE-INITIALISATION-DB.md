# 🗄️ Guide d'initialisation de la base de données

## 📋 Vue d'ensemble

Ce guide explique comment initialiser automatiquement la base de données avec toutes les tables nécessaires.

---

## 🔧 Méthode 1 : En local (développement)

### Prérequis
- MariaDB/MySQL en cours d'exécution
- Base de données créée (`blindtest_production` ou autre)

### Étapes

```bash
# 1. Se placer dans le dossier du projet
cd "d:\Projet\Blind test musical"

# 2. Configurer le fichier .env dans apps/api/.env
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=blindtest_prod
# DB_PASS=VotreMotDePasse
# DB_NAME=blindtest_production

# 3. Installer les dépendances
npm install

# 4. Initialiser la base de données (crée toutes les tables)
npm run init:db -w @blindtest/api
```

**Résultat attendu :**
```
==============================================
  Initialisation de la base de données
==============================================

📦 Base de données: blindtest_production
🔗 Serveur: localhost:3306
👤 Utilisateur: blindtest_prod

⏳ Connexion à la base de données...
✅ Connexion établie

⏳ Création/mise à jour des tables...
✅ Tables créées avec succès!

📋 Tables disponibles:
==============================================
1. answers
2. audit_logs
3. events
4. password_reset_tokens
5. payments
6. players
7. round_songs
8. rounds
9. scores
10. super_admins
11. team
12. tenant_sessions
13. tenant_users
14. tenants
==============================================
```

---

## 🐳 Méthode 2 : Dans le conteneur Docker (production)

### Prérequis
- Conteneur API déployé et en cours d'exécution
- Base de données créée
- Variables d'environnement configurées dans le conteneur

### Étapes sur le serveur

```bash
# 1. Se connecter au serveur
ssh alex@srv506488

# 2. Vérifier que la base de données existe
docker exec -it mariadb mariadb -u blindtest_prod -p
```

Dans MariaDB :
```sql
SHOW DATABASES LIKE 'blindtest%';
-- Si la base n'existe pas :
CREATE DATABASE blindtest_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

```bash
# 3. Exécuter le script d'initialisation dans le conteneur
docker exec blindtest-api node dist/scripts/init-database.js

# 4. Vérifier les tables créées
docker exec -it mariadb mariadb -u blindtest_prod -p blindtest_production
```

Dans MariaDB :
```sql
SHOW TABLES;
DESCRIBE super_admins;
EXIT;
```

---

## 🚀 Méthode 3 : Intégrer au déploiement automatique

### Option A : Script de démarrage

Modifiez le `CMD` du Dockerfile pour exécuter le script d'init au premier démarrage :

```dockerfile
# apps/api/Dockerfile
CMD ["sh", "-c", "node dist/scripts/init-database.js || true && node dist/index.js"]
```

⚠️ **Attention** : Cette approche initialise à chaque démarrage. Mieux vaut l'exécuter manuellement une fois.

### Option B : Script de post-déploiement

Créez un script `deploy.sh` :

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Déploiement Blind Test Musical"

# Build des images
docker compose build blindtest-api blindtest-web

# Démarrer les services
docker compose up -d blindtest-api blindtest-web

# Attendre que l'API soit prête
echo "⏳ Attente du démarrage de l'API..."
sleep 10

# Initialiser la base de données
echo "🗄️ Initialisation de la base de données..."
docker exec blindtest-api node dist/scripts/init-database.js

# Créer le super admin (optionnel)
echo "👤 Création du super admin..."
docker exec blindtest-api node dist/scripts/create-super-admin-test.js

echo "✅ Déploiement terminé !"
```

Rendez-le exécutable :
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🔍 Vérification

### Vérifier que toutes les tables sont créées

```bash
# Méthode 1 : Via Docker
docker exec blindtest-api node -e "
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });
  const [tables] = await conn.query('SHOW TABLES');
  console.log('Tables:', tables.length);
  tables.forEach(t => console.log('-', Object.values(t)[0]));
  await conn.end();
})();
"

# Méthode 2 : Via MariaDB
docker exec -it mariadb mariadb -u blindtest_prod -p blindtest_production -e "SHOW TABLES;"
```

---

## ❌ Résolution des problèmes

### Erreur : "Access denied"

**Cause** : Identifiants de base de données incorrects

**Solution** :
1. Vérifier le fichier `.env` ou les variables d'environnement du conteneur
2. Vérifier que l'utilisateur existe dans MariaDB
3. Vérifier les privilèges de l'utilisateur

### Erreur : "Unknown database"

**Cause** : La base de données n'existe pas

**Solution** :
```sql
CREATE DATABASE blindtest_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Erreur : "Table already exists"

**Cause** : Les tables existent déjà (c'est normal !)

**Solution** : Le script utilise `synchronize()` de TypeORM qui gère automatiquement les tables existantes. Si vous voulez tout recréer :

```sql
DROP DATABASE blindtest_production;
CREATE DATABASE blindtest_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Puis relancez le script d'initialisation.

### Erreur : "Connection refused"

**Cause** : MariaDB n'est pas accessible

**Solution** :
1. Vérifier que MariaDB est démarré : `docker ps | grep mariadb`
2. Vérifier le port : `DB_PORT=3306`
3. Vérifier le host : `DB_HOST=mariadb` (dans Docker) ou `DB_HOST=localhost` (en local)

---

## 📝 Prochaines étapes après initialisation

1. **Créer un super admin** :
   ```bash
   # En local
   npm run create:super-admin:test -w @blindtest/api

   # En production
   docker exec blindtest-api node dist/scripts/create-super-admin-test.js
   ```

2. **Vérifier que l'API fonctionne** :
   ```bash
   curl https://blindtest.codeharmony.fr/api/health
   ```

3. **Accéder à l'interface admin** :
   - URL : https://blindtest.codeharmony.fr
   - Email : admin@blindtest.local
   - Password : SuperAdmin123!

---

## 🔐 Sécurité

- ⚠️ Ne jamais committer le fichier `.env` avec les vraies valeurs
- ⚠️ Changer le mot de passe du super admin de test après le premier login
- ⚠️ Utiliser des mots de passe forts en production
- ⚠️ Sauvegarder régulièrement la base de données

---

## 📚 Fichiers liés

- Script d'initialisation : `apps/api/src/scripts/init-database.ts`
- Configuration DB : `apps/api/src/db/data-source.ts`
- Entités : `apps/api/src/db/entities/*.ts`
- Package.json : `apps/api/package.json` (commande `init:db`)
