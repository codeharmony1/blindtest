# 🔄 Workflow de déploiement - Blind Test Musical

## 📋 Vue d'ensemble

Ce document décrit le workflow complet pour déployer l'application depuis votre machine locale vers le serveur de production.

---

## 🛠️ Workflow complet

### 1️⃣ Développement local

```bash
# Développer et tester localement
cd "d:\Projet\Blind test musical"
npm run dev

# Tester l'application
# Frontend: http://localhost:4200
# API: http://localhost:3000/api/health
```

---

### 2️⃣ Build des images Docker

```bash
# Build de l'image API
docker build -t blindtest-api:latest ./apps/api

# Build de l'image Web
docker build -t blindtest-web:latest ./apps/web

# Vérifier les images
docker images | grep blindtest
```

---

### 3️⃣ Test des images en local (optionnel)

```bash
# Lancer le docker-compose en local
docker compose -f docker-compose.prod.yml up -d

# Tester
curl http://localhost:3000/api/health
curl http://localhost:80/

# Arrêter
docker compose -f docker-compose.prod.yml down
```

---

### 4️⃣ Export des images

```bash
# Sauvegarder les images en fichiers tar.gz
docker save blindtest-api:latest | gzip > blindtest-api.tar.gz
docker save blindtest-web:latest | gzip > blindtest-web.tar.gz

# Vérifier la taille
ls -lh blindtest-*.tar.gz
```

---

### 5️⃣ Transfert vers le serveur

```bash
# Transférer les images
scp blindtest-api.tar.gz alex@srv506488:~/
scp blindtest-web.tar.gz alex@srv506488:~/

# Transférer la configuration si modifiée
scp docker-compose.prod.yml alex@srv506488:~/docker-services/
```

---

### 6️⃣ Déploiement sur le serveur

```bash
# Se connecter au serveur
ssh alex@srv506488

# Charger les images
cd ~
docker load < blindtest-api.tar.gz
docker load < blindtest-web.tar.gz

# Vérifier
docker images | grep blindtest

# Aller dans le dossier de déploiement
cd ~/docker-services

# Arrêter les anciens conteneurs
docker compose stop blindtest-api blindtest-web

# Démarrer les nouveaux
docker compose up -d blindtest-api blindtest-web

# Vérifier les logs
docker compose logs -f blindtest-api
```

---

### 7️⃣ Initialisation de la base de données (première fois seulement)

```bash
# Sur le serveur
docker exec blindtest-api node dist/scripts/init-database.js

# Vérifier
docker exec -it mariadb mariadb -u blindtest_prod -p blindtest_production -e "SHOW TABLES;"
```

---

### 8️⃣ Créer le super admin (première fois seulement)

```bash
# Sur le serveur
docker exec blindtest-api node dist/scripts/create-super-admin-test.js

# Ou manuellement avec vos propres identifiants
docker exec -it blindtest-api node dist/scripts/create-super-admin.js
```

---

### 9️⃣ Tests de validation

```bash
# Test 1: API Health
curl https://blindtest.codeharmony.fr/api/health
# Attendu: {"ok":true,"timestamp":"...","version":"1.0.0","environment":"production"}

# Test 2: Frontend
curl -I https://blindtest.codeharmony.fr/
# Attendu: HTTP/2 200

# Test 3: Conteneurs
docker ps | grep blindtest
# Attendu: tous (healthy)

# Test 4: Logs
docker logs blindtest-api --tail 50
docker logs blindtest-web --tail 50
```

---

## 🚀 Workflow simplifié (script automatisé)

Créez un script `deploy.sh` sur votre **machine locale** :

```bash
#!/bin/bash
set -e

echo "🚀 Déploiement Blind Test Musical"
echo "=================================="

# Variables
SERVER="alex@srv506488"
SERVER_PATH="~/docker-services"

# 1. Build
echo "📦 Build des images Docker..."
docker build -t blindtest-api:latest ./apps/api
docker build -t blindtest-web:latest ./apps/web

# 2. Export
echo "💾 Export des images..."
docker save blindtest-api:latest | gzip > blindtest-api.tar.gz
docker save blindtest-web:latest | gzip > blindtest-web.tar.gz

# 3. Transfert
echo "📤 Transfert vers le serveur..."
scp blindtest-api.tar.gz $SERVER:~/
scp blindtest-web.tar.gz $SERVER:~/

# 4. Déploiement distant
echo "🔧 Déploiement sur le serveur..."
ssh $SERVER << 'ENDSSH'
  cd ~
  echo "📥 Chargement des images..."
  docker load < blindtest-api.tar.gz
  docker load < blindtest-web.tar.gz

  cd ~/docker-services
  echo "🔄 Redémarrage des services..."
  docker compose restart blindtest-api blindtest-web

  echo "⏳ Attente du démarrage..."
  sleep 10

  echo "✅ Déploiement terminé !"
  docker ps | grep blindtest
ENDSSH

# 5. Nettoyage local
echo "🧹 Nettoyage..."
rm blindtest-api.tar.gz blindtest-web.tar.gz

# 6. Tests
echo "🧪 Tests de validation..."
curl -s https://blindtest.codeharmony.fr/api/health | jq .

echo ""
echo "🎉 Déploiement réussi !"
echo "🌐 Frontend: https://blindtest.codeharmony.fr"
echo "🔌 API: https://blindtest.codeharmony.fr/api/health"
```

Utilisation :

```bash
# Rendre exécutable (Git Bash ou WSL)
chmod +x deploy.sh

# Exécuter
./deploy.sh
```

---

## 🔄 Workflow pour les mises à jour

### Mise à jour mineure (bug fix, features)

```bash
# 1. Modifier le code localement
# 2. Tester localement
npm run dev

# 3. Rebuild et redéployer
./deploy.sh
```

### Mise à jour de la base de données (nouvelles colonnes)

```bash
# Option 1: Migrations TypeORM
npm run migrate:generate -w @blindtest/api
npm run migrate:run -w @blindtest/api

# Option 2: Réinitialiser complètement (⚠️ perte de données)
docker exec blindtest-api node dist/scripts/init-database.js
```

### Mise à jour des dépendances

```bash
# Sur votre machine locale
npm update
npm audit fix

# Rebuild et redéployer
docker build -t blindtest-api:latest ./apps/api
./deploy.sh
```

---

## 📊 Monitoring post-déploiement

### Vérifier les logs

```bash
# Logs en temps réel
ssh alex@srv506488 'docker logs -f blindtest-api'

# Dernières erreurs
ssh alex@srv506488 'docker logs blindtest-api 2>&1 | grep -i error'

# Logs Traefik
ssh alex@srv506488 'docker logs traefik | grep blindtest'
```

### Vérifier les métriques

```bash
# Utilisation CPU/RAM
ssh alex@srv506488 'docker stats blindtest-api blindtest-web --no-stream'

# Espace disque
ssh alex@srv506488 'df -h'

# Tables de la base de données
ssh alex@srv506488 'docker exec mariadb mysql -u blindtest_prod -p blindtest_production -e "SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA='\"'blindtest_production'\"';"'
```

---

## 🔙 Rollback en cas de problème

```bash
# Se connecter au serveur
ssh alex@srv506488

# Revenir à l'image précédente
docker tag blindtest-api:latest blindtest-api:broken
docker tag blindtest-api:previous blindtest-api:latest
docker compose restart blindtest-api

# Ou recharger une ancienne image
docker load < ~/backups/blindtest-api-2025-10-20.tar.gz
docker compose restart blindtest-api
```

---

## 📝 Checklist avant déploiement

- [ ] Code testé localement
- [ ] Images Docker buildées sans erreur
- [ ] Variables d'environnement à jour dans `.env` du serveur
- [ ] Base de données backupée (si mise à jour DB)
- [ ] Migrations testées en local
- [ ] Documentation mise à jour
- [ ] Commit et push sur Git

---

## 📝 Checklist après déploiement

- [ ] API répond sur `/api/health`
- [ ] Frontend accessible
- [ ] Certificat SSL valide
- [ ] Conteneurs en status `healthy`
- [ ] Pas d'erreurs dans les logs
- [ ] Tests manuels de l'application
- [ ] Monitoring actif

---

## 🆘 En cas de problème

1. **Vérifier les logs** : `docker logs blindtest-api`
2. **Vérifier la connectivité** : `curl https://blindtest.codeharmony.fr/api/health`
3. **Vérifier Traefik** : `docker logs traefik | grep blindtest`
4. **Rollback** si nécessaire
5. **Contacter le support** si le problème persiste

---

## 📚 Ressources

- [Guide d'initialisation DB](./GUIDE-INITIALISATION-DB.md)
- [Guide de déploiement rapide](./GUIDE-DEPLOIEMENT-RAPIDE.md)
- [Modifications de configuration](./DEPLOIEMENT-MODIFICATIONS.md)
- [Documentation Traefik](https://doc.traefik.io/traefik/)
- [Documentation TypeORM](https://typeorm.io/)
