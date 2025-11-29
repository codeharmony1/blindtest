# 🚀 Guide de Déploiement Rapide

Guide concis pour déployer rapidement la nouvelle version en production.

## ⚡ Prérequis

- Docker et docker-compose installés sur le serveur
- Accès SSH au serveur
- Base de données MariaDB configurée

## 📝 Étapes de Déploiement

### 1. Build local des images Docker

```bash
# API
cd apps/api
docker build -t blindtest-api:latest .

# Web
cd ../web
docker build -t blindtest-web:latest .

# Sauvegarder
cd ../..
docker save blindtest-api:latest > blindtest-api.tar
docker save blindtest-web:latest > blindtest-web.tar
```

### 2. Transfert sur le serveur

```bash
scp blindtest-*.tar user@server:/path/to/app/
```

### 3. Sur le serveur

```bash
# Charger les images
docker load < blindtest-api.tar
docker load < blindtest-web.tar

# Redémarrer
docker-compose down
docker-compose up -d

# Migrations
docker exec -it blindtest-api npm run migrate:run

# Initialiser le compte admin
docker exec -it blindtest-api npx ts-node apps/api/init-production.ts \
  votre@email.com \
  VotreMotDePasseSecurise123 \
  "Votre Nom"
```

### 4. Vérification

- ✅ Ouvrir https://blindtest.codeharmony.fr/auth/login
- ✅ Se connecter avec les identifiants créés
- ✅ Vérifier le dashboard
- ✅ Tester "Mot de passe oublié"

## 🔧 Commandes Utiles

```bash
# Lister les utilisateurs
docker exec -it blindtest-api npx ts-node apps/api/list-all-users.ts

# Réinitialiser un mot de passe
docker exec -it blindtest-api npx ts-node apps/api/reset-user-password.ts email@example.com NouveauMotDePasse

# Logs
docker-compose logs -f api

# Santé de l'API
curl https://blindtest.codeharmony.fr/api/health
```

## 🐛 Dépannage Rapide

**Impossible de se connecter ?**
```bash
docker exec -it blindtest-api npx ts-node apps/api/list-all-users.ts
docker exec -it blindtest-api npx ts-node apps/api/reset-user-password.ts votre@email.com NouveauMotDePasse
```

**L'API ne démarre pas ?**
```bash
docker-compose logs api
docker exec -it blindtest-api env | grep DB_
```

**Reset complet (⚠️ DANGER - supprime tout) ?**
```bash
docker exec -it mysql-container mysql -u root -p -e "DROP DATABASE IF EXISTS blindtest; CREATE DATABASE blindtest;"
docker exec -it blindtest-api npm run migrate:run
docker exec -it blindtest-api npx ts-node apps/api/init-production.ts email@example.com password123 "Admin"
```

---

📖 **Documentation complète** : [MIGRATION-PRODUCTION.md](MIGRATION-PRODUCTION.md)
