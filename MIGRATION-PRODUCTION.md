# Migration Production - Système d'Authentification Unifié

## 📋 Vue d'ensemble

Ce document décrit la migration vers le système d'authentification unifié basé sur **TenantUser** (multi-tenant).

### Changements principaux

- ✅ **Authentification unifiée** : Utilisation exclusive de `TenantUser` (table `tenant_users`)
- ✅ **Réinitialisation de mot de passe** : Corrigée pour fonctionner avec le système multi-tenant
- ✅ **URL de reset** : Corrigée de `/reset-password` vers `/auth/reset-password`
- ⚠️  **Ancien système** : La table `organizers` est maintenant obsolète

## 🚀 Déploiement en Production

### Étape 1 : Préparer les images Docker

Sur votre machine locale :

```bash
# Build l'API
cd apps/api
docker build -t blindtest-api:latest .

# Build le frontend
cd ../web
docker build -t blindtest-web:latest .

# Sauvegarder les images
cd ../..
docker save blindtest-api:latest > blindtest-api.tar
docker save blindtest-web:latest > blindtest-web.tar
```

### Étape 2 : Transférer sur le serveur

```bash
# Transférer les images sur votre serveur
scp blindtest-api.tar user@your-server:/path/to/app/
scp blindtest-web.tar user@your-server:/path/to/app/
```

### Étape 3 : Sur le serveur - Charger les images

```bash
# Se connecter au serveur
ssh user@your-server

# Charger les images Docker
docker load < blindtest-api.tar
docker load < blindtest-web.tar

# Vérifier que les images sont chargées
docker images | grep blindtest
```

### Étape 4 : Arrêter l'ancienne version

```bash
# Arrêter les conteneurs actuels
docker-compose down

# ⚠️  OPTIONNEL : Sauvegarder la base de données actuelle
docker exec mysql-container mysqldump -u root -p blindtest > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Étape 5 : Nettoyer les anciennes données de test

Si vous voulez repartir de zéro (ATTENTION : cela supprime TOUTES les données) :

```bash
# Option 1 : Supprimer toutes les tables
docker exec -it mysql-container mysql -u root -p -e "DROP DATABASE IF EXISTS blindtest; CREATE DATABASE blindtest;"

# Option 2 : Supprimer uniquement les tables d'authentification
docker exec -it mysql-container mysql -u root -p blindtest -e "
  DELETE FROM tenant_users;
  DELETE FROM tenants;
  DELETE FROM password_reset_tokens;
"
```

### Étape 6 : Démarrer la nouvelle version

```bash
# Démarrer les nouveaux conteneurs
docker-compose up -d

# Vérifier que tout démarre correctement
docker-compose logs -f api
```

### Étape 7 : Exécuter les migrations

```bash
# Exécuter les migrations de base de données
docker exec -it blindtest-api npm run migrate:run
```

### Étape 8 : Initialiser le compte admin

```bash
# Créer le tenant par défaut et le compte admin
docker exec -it blindtest-api npx ts-node apps/api/init-production.ts \
  votre@email.com \
  VotreMotDePasseSecurise123 \
  "Votre Nom"
```

**Exemple :**
```bash
docker exec -it blindtest-api npx ts-node apps/api/init-production.ts \
  admin@blindtest.fr \
  MySecureP@ssw0rd \
  "Administrateur Principal"
```

### Étape 9 : Tester la connexion

1. Ouvrir https://blindtest.codeharmony.fr/auth/login
2. Se connecter avec les identifiants créés
3. Vérifier que le dashboard s'affiche correctement

## 🔧 Commandes utiles

### Lister les utilisateurs

```bash
docker exec -it blindtest-api npx ts-node apps/api/list-all-users.ts
```

### Réinitialiser un mot de passe

```bash
docker exec -it blindtest-api npx ts-node apps/api/reset-user-password.ts \
  email@example.com \
  NouveauMotDePasse123
```

### Vérifier les logs

```bash
# Logs de l'API
docker-compose logs -f api

# Logs du frontend
docker-compose logs -f web

# Logs de la base de données
docker-compose logs -f db
```

### Accéder à la base de données

```bash
docker exec -it mysql-container mysql -u root -p blindtest
```

Requêtes utiles :
```sql
-- Lister les tenants
SELECT * FROM tenants;

-- Lister les utilisateurs
SELECT
  tu.id,
  tu.email,
  tu.role,
  tu.display_name,
  t.name as tenant_name,
  t.slug as tenant_slug
FROM tenant_users tu
JOIN tenants t ON tu.tenant_id = t.id;

-- Compter les événements par tenant
SELECT
  t.name,
  COUNT(e.id) as event_count
FROM tenants t
LEFT JOIN events e ON e.tenant_id = t.id
GROUP BY t.id;
```

## 🔐 Sécurité

### Recommandations

1. **Mots de passe** :
   - Minimum 12 caractères
   - Mélange de majuscules, minuscules, chiffres et symboles
   - Ne jamais partager les identifiants

2. **Variables d'environnement** :
   - Vérifier que `JWT_SECRET` est unique et complexe
   - Vérifier que `DB_PASS` est fort
   - Ne jamais commit les fichiers `.env` dans git

3. **HTTPS** :
   - Vérifier que le site est accessible uniquement en HTTPS
   - Vérifier les certificats SSL

4. **Firewall** :
   - Port 3306 (MySQL) doit être fermé au public
   - Seuls les ports 80 et 443 doivent être ouverts

### Changer le mot de passe admin après déploiement

```bash
docker exec -it blindtest-api npx ts-node apps/api/reset-user-password.ts \
  admin@blindtest.fr \
  UnNouveauMotDePasseEncore PlusSecurise456!
```

## 🐛 Dépannage

### L'API ne démarre pas

```bash
# Vérifier les logs
docker-compose logs api

# Vérifier la configuration de la base de données
docker exec -it blindtest-api env | grep DB_
```

### Impossible de se connecter

1. Vérifier que l'utilisateur existe :
```bash
docker exec -it blindtest-api npx ts-node apps/api/list-all-users.ts
```

2. Vérifier que le tenant 'default' existe :
```bash
docker exec -it mysql-container mysql -u root -p blindtest -e "SELECT * FROM tenants WHERE slug='default';"
```

3. Réinitialiser le mot de passe :
```bash
docker exec -it blindtest-api npx ts-node apps/api/reset-user-password.ts votre@email.com NouveauMotDePasse
```

### Erreur "INVALID_CREDENTIALS"

- Vérifier que vous utilisez le bon email
- Vérifier que le mot de passe est correct
- Essayer de réinitialiser le mot de passe via "Mot de passe oublié"

### Erreur "TENANT_NOT_FOUND"

```bash
# Recréer le tenant par défaut
docker exec -it blindtest-api npx ts-node apps/api/init-production.ts \
  votre@email.com \
  VotreMotDePasse123 \
  "Votre Nom"
```

## 📊 Vérification post-déploiement

Checklist :

- [ ] L'API répond sur `/api/health`
- [ ] Le frontend est accessible
- [ ] La page de login s'affiche correctement
- [ ] La connexion fonctionne
- [ ] Le dashboard admin s'affiche
- [ ] Création d'événement fonctionne
- [ ] "Mot de passe oublié" fonctionne
- [ ] Reset de mot de passe par email fonctionne

## 🔄 Rollback

Si quelque chose ne va pas, vous pouvez revenir à l'ancienne version :

```bash
# Arrêter les nouveaux conteneurs
docker-compose down

# Restaurer la sauvegarde de base de données
docker exec -i mysql-container mysql -u root -p blindtest < backup_YYYYMMDD_HHMMSS.sql

# Redémarrer avec les anciennes images
docker-compose up -d
```

## 📞 Support

En cas de problème, vérifiez :
1. Les logs Docker : `docker-compose logs -f`
2. Les variables d'environnement : vérifier `.env` et `.env.production`
3. La connectivité base de données
4. Les certificats SSL

---

**Date de création** : $(date)
**Version** : 2.0.0 - Système d'authentification unifié
