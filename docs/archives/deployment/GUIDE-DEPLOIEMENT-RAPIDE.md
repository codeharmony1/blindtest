# 🚀 Guide de déploiement rapide - Blind Test Musical

## ✅ Prérequis sur le serveur

- Docker et Docker Compose installés
- Traefik configuré avec Let's Encrypt
- Réseau Docker `proxy` créé
- MariaDB en cours d'exécution
- DNS `blindtest.codeharmony.fr` pointant vers le serveur

---

## 📦 Étape 1 : Préparer les fichiers

### Sur votre machine locale :

```bash
# Build des images Docker
cd "d:\Projet\Blind test musical"
docker build -t blindtest-api:latest ./apps/api
docker build -t blindtest-web:latest ./apps/web

# Sauvegarder les images
docker save blindtest-api:latest | gzip > blindtest-api.tar.gz
docker save blindtest-web:latest | gzip > blindtest-web.tar.gz

# Transférer vers le serveur
scp blindtest-api.tar.gz alex@srv506488:~/
scp blindtest-web.tar.gz alex@srv506488:~/
scp docker-compose.prod.yml alex@srv506488:~/docker-services/docker-compose-blindtest.yml
```

---

## 🔧 Étape 2 : Configuration sur le serveur

### 1. Charger les images Docker

```bash
ssh alex@srv506488

# Charger les images
docker load < ~/blindtest-api.tar.gz
docker load < ~/blindtest-web.tar.gz

# Vérifier
docker images | grep blindtest
```

### 2. Créer/Modifier le fichier .env

```bash
cd ~/docker-services
nano .env
```

Ajouter à la fin du fichier (ou remplacer les valeurs existantes) :

```bash
# ============================================
# BLIND TEST MUSICAL
# ============================================

# Database
BLINDTEST_DB_USER=blindtest_prod
BLINDTEST_DB_PASSWORD=VotreMotDePasseSecurise123!
BLINDTEST_DB_NAME=blindtest_production

# JWT Secrets
BLINDTEST_JWT_SECRET=GENERER_AVEC_COMMANDE_CI_DESSOUS
BLINDTEST_JWT_REFRESH_SECRET=GENERER_AVEC_COMMANDE_CI_DESSOUS

# Email SMTP (ATTENTION: guillemets simples pour caractères spéciaux)
BLINDTEST_SMTP_PASSWORD='VotreMotDePasseEmail'

# Super Admin
BLINDTEST_SUPER_ADMIN_EMAIL=admin@blindtest.local
BLINDTEST_SUPER_ADMIN_PASSWORD=AdminSecure2025!

# Redis
REDIS_PASSWORD=RedisSecure2025!

# Stripe (mode test)
BLINDTEST_STRIPE_SECRET_KEY=sk_test_VOTRE_CLE
BLINDTEST_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE
BLINDTEST_STRIPE_WEBHOOK_SECRET=
```

**Générer les JWT secrets :**

```bash
node -e "const crypto = require('crypto'); console.log('BLINDTEST_JWT_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('BLINDTEST_JWT_REFRESH_SECRET=' + crypto.randomBytes(64).toString('hex'));"
```

Copier-coller les valeurs générées dans le .env

### 3. Fusionner la configuration Docker Compose

```bash
# Option A : Fusionner dans le docker-compose.yml principal
nano ~/docker-services/docker-compose.yml

# Copier les services blindtest-api, blindtest-web, et redis
# depuis docker-compose-blindtest.yml

# Option B : Utiliser un fichier séparé
# Pas de modification nécessaire
```

### 4. Créer la base de données

```bash
docker exec -it mariadb mariadb -u root -p
```

Dans MariaDB :

```sql
CREATE DATABASE IF NOT EXISTS blindtest_production
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'blindtest_prod'@'%'
  IDENTIFIED BY 'VotreMotDePasseSecurise123!';

GRANT ALL PRIVILEGES ON blindtest_production.* TO 'blindtest_prod'@'%';
FLUSH PRIVILEGES;

EXIT;
```

---

## 🚀 Étape 3 : Démarrer les services

```bash
cd ~/docker-services

# Démarrer les conteneurs
docker compose up -d blindtest-api blindtest-web redis

# Ou si fichier séparé :
docker compose -f docker-compose.yml -f docker-compose-blindtest.yml up -d
```

---

## 🔍 Étape 4 : Vérification

```bash
# 1. Vérifier que les conteneurs sont healthy
docker ps | grep blindtest

# 2. Vérifier les logs
docker logs blindtest-api | tail -30
docker logs blindtest-web | tail -10

# 3. Tester l'API
curl https://blindtest.codeharmony.fr/api/health

# 4. Tester le frontend
curl https://blindtest.codeharmony.fr/ | head -10

# 5. Vérifier le certificat SSL
curl -vI https://blindtest.codeharmony.fr/ 2>&1 | grep "SSL certificate"
```

**Résultats attendus :**

- ✅ Tous les conteneurs avec status `(healthy)`
- ✅ API retourne `{"ok":true,...}`
- ✅ Frontend retourne HTML avec `<title>Blind Test Musical</title>`
- ✅ SSL certificate verify OK

---

## 📊 Étape 5 : Migrations de base de données

```bash
# Les migrations doivent être exécutées depuis votre machine locale
# Car typeorm-ts-node-commonjs n'est pas disponible en production

# Sur votre machine locale :
cd "d:\Projet\Blind test musical\apps\api"

# Créer un .env temporaire pointant vers la prod
cat > .env.temp <<EOF
DB_HOST=IP_DU_SERVEUR
DB_PORT=3306
DB_USER=blindtest_prod
DB_PASS=VotreMotDePasseSecurise123!
DB_NAME=blindtest_production
EOF

# Lancer les migrations
npm run migrate:run
```

---

## 🎯 Étape 6 : Accéder à l'application

Ouvrir dans un navigateur : **https://blindtest.codeharmony.fr**

---

## 🔧 Commandes utiles

```bash
# Redémarrer un service
docker compose restart blindtest-api

# Voir les logs en temps réel
docker compose logs -f blindtest-api

# Arrêter tous les services blindtest
docker compose stop blindtest-api blindtest-web redis

# Supprimer les conteneurs (données conservées)
docker compose down

# Rebuild après modification du code
docker compose build blindtest-api blindtest-web
docker compose up -d blindtest-api blindtest-web
```

---

## ⚠️ Troubleshooting

### Problème : Certificat SSL non généré

```bash
# Vérifier les logs Traefik
docker logs traefik | grep blindtest | grep -i error

# Solution : Vérifier que le DNS pointe bien vers le serveur
nslookup blindtest.codeharmony.fr
```

### Problème : API ne démarre pas

```bash
# Vérifier les logs
docker logs blindtest-api

# Problèmes courants :
# - Connexion DB échouée : vérifier BLINDTEST_DB_PASSWORD dans .env
# - Port déjà utilisé : docker ps -a pour voir les conflits
```

### Problème : Frontend 404

```bash
# Vérifier que Traefik a bien enregistré le router
docker logs traefik | grep blindtest-web-frontend

# Vérifier la priorité des routers
docker logs traefik | grep priority
```

---

## 📝 Checklist finale

- [ ] Base de données créée et accessible
- [ ] Variables .env configurées correctement
- [ ] Images Docker chargées
- [ ] Services démarrés et healthy
- [ ] API accessible sur /api/health
- [ ] Frontend accessible sur /
- [ ] Certificat SSL valide
- [ ] Migrations de base de données exécutées
- [ ] Tests manuels de l'application réussis

---

## 🔐 Sécurité

**Ne JAMAIS committer :**
- `.env` avec les vraies valeurs
- Fichiers contenant des mots de passe
- Clés API Stripe en mode production

**Toujours committer :**
- `.env.example` avec des placeholders
- Documentation de déploiement
- Scripts de migration

---

## 📞 Support

En cas de problème :
1. Consulter les logs : `docker logs <container_name>`
2. Vérifier Traefik dashboard : https://traefik.codeharmony.fr
3. Tester les endpoints : `curl -v https://blindtest.codeharmony.fr/api/health`
