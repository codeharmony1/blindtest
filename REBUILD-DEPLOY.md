# 🔄 Rebuild et Redéploiement - Guide Rapide

## ⚠️ Problème Corrigé

Le Dockerfile a été corrigé pour inclure :
- ✅ Les dépendances de développement (TypeORM CLI, ts-node)
- ✅ Les fichiers source TypeScript
- ✅ Configuration TypeScript (tsconfig.json)

## 🚀 Étapes de Rebuild et Redéploiement

### 1. Build la nouvelle image localement

```bash
cd "d:\Projet\Blind test musical"

# Build l'image API
docker build -t blindtest-api:latest -f apps/api/Dockerfile .

# Optionnel : Build l'image Web si modifiée
docker build -t blindtest-web:latest -f apps/web/Dockerfile .
```

### 2. Sauvegarder l'image

```bash
# Sauvegarder l'API
docker save blindtest-api:latest -o blindtest-api.tar

# Optionnel : Sauvegarder le Web
docker save blindtest-web:latest -o blindtest-web.tar
```

### 3. Transférer sur le serveur

```bash
# Remplacez par vos informations de serveur
scp blindtest-api.tar alex@srv506488.hstgr.cloud:~/docker-services/
```

### 4. Sur le serveur - Charger et déployer

```bash
# Se connecter au serveur
ssh alex@srv506488.hstgr.cloud
cd ~/docker-services

# Charger la nouvelle image
docker load -i blindtest-api.tar

# Arrêter et supprimer l'ancien conteneur
docker-compose down

# Démarrer avec la nouvelle image
docker-compose up -d

# Vérifier que ça démarre
docker-compose logs -f api
```

### 5. Exécuter les migrations

```bash
# Maintenant ça devrait fonctionner !
docker exec -it blindtest-api npm run migrate:run
```

### 6. Initialiser le compte admin

```bash
# Créer le tenant et le compte admin
docker exec -it blindtest-api npx ts-node apps/api/init-production.ts \
  votre@email.com \
  VotreMotDePasseSecurise123 \
  "Votre Nom"
```

## ✅ Vérification

```bash
# Santé de l'API
curl https://blindtest.codeharmony.fr/api/health

# Voir les logs
docker-compose logs -f api

# Lister les utilisateurs
docker exec -it blindtest-api npx ts-node apps/api/list-all-users.ts
```

## 🧪 Test Complet

1. ✅ Ouvrir https://blindtest.codeharmony.fr/auth/login
2. ✅ Se connecter avec les identifiants créés
3. ✅ Vérifier le dashboard
4. ✅ Tester "Mot de passe oublié"
5. ✅ Recevoir l'email
6. ✅ Cliquer sur le lien et réinitialiser
7. ✅ Se reconnecter avec le nouveau mot de passe

## 🐛 Dépannage

### L'API ne démarre pas

```bash
# Voir les logs détaillés
docker-compose logs api

# Vérifier les variables d'environnement
docker exec -it blindtest-api env | grep -E "DB_|NODE_"
```

### Les migrations échouent

```bash
# Vérifier la connexion à la base de données
docker exec -it blindtest-api node -e "const mysql = require('mysql2/promise'); mysql.createConnection({host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME}).then(() => console.log('DB OK')).catch(e => console.error('DB ERROR:', e.message))"

# Vérifier que les tables existent
docker exec -it mariadb mysql -u root -p blindtest -e "SHOW TABLES;"
```

### TypeORM toujours introuvable

```bash
# Vérifier que typeorm est installé
docker exec -it blindtest-api npm list typeorm

# Vérifier que ts-node est installé
docker exec -it blindtest-api npm list ts-node

# Vérifier la structure des fichiers
docker exec -it blindtest-api ls -la apps/api/
```

## 📋 Checklist de Redéploiement

- [ ] Build de la nouvelle image en local
- [ ] Sauvegarde de l'image en .tar
- [ ] Transfert sur le serveur
- [ ] Chargement de l'image sur le serveur
- [ ] Arrêt de l'ancien conteneur
- [ ] Démarrage du nouveau conteneur
- [ ] Vérification des logs (pas d'erreurs)
- [ ] Exécution des migrations
- [ ] Initialisation du compte admin
- [ ] Test de connexion
- [ ] Test de réinitialisation de mot de passe

---

**Date** : $(date)
**Version** : 2.0.1 - Dockerfile corrigé pour TypeORM
