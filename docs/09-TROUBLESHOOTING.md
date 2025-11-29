# 🔧 Guide de Dépannage

Guide complet pour résoudre les problèmes courants de Blind Test Musical.

## 📋 Table des Matières

- [Problèmes de Déploiement](#problèmes-de-déploiement)
- [Problèmes de Base de Données](#problèmes-de-base-de-données)
- [Problèmes API](#problèmes-api)
- [Problèmes Frontend](#problèmes-frontend)
- [Problèmes Docker](#problèmes-docker)
- [Problèmes WebSocket](#problèmes-websocket)
- [Diagnostics Généraux](#diagnostics-généraux)

## Problèmes de Déploiement

### ❌ Erreur: Docker build échoue - "curl: (7) Failed to connect to localhost port 3000"

**Symptômes**:
```
curl: (7) Failed to connect to localhost port 3000: Connection refused
```

**Cause**:
Build exécuté depuis le mauvais répertoire (apps/api/ au lieu de la racine du monorepo).

**Solution**:
```powershell
# ❌ Incorrect - depuis apps/api/
cd apps/api
docker build -t blindtest-api:latest .

# ✅ Correct - depuis la racine avec -f
cd "D:\Projet\Blind test musical"
docker build -f apps/api/Dockerfile -t blindtest-api:latest .
```

**Pourquoi ?**: Le Dockerfile est conçu pour un contexte monorepo et a besoin d'accéder au package-lock.json et aux workspaces à la racine.

---

### ❌ Erreur: Web build échoue - "sh: tsc: not found"

**Symptômes**:
```
sh: 1: tsc: not found
npm error Missing script: "build"
```

**Cause**:
Le Dockerfile Web copie tout le monorepo et essaie de builder l'API aussi, mais les dev dependencies ne sont pas installées.

**Solution**:
Modifier [apps/web/Dockerfile](../apps/web/Dockerfile):

```dockerfile
# ❌ Incorrect - copie tout le monorepo
COPY . .
RUN npm run build

# ✅ Correct - copie seulement le workspace web
COPY apps/web/package*.json ./apps/web/
COPY apps/web ./apps/web
RUN npm run build -w @blindtest/web -- --configuration=production
```

**Commit de référence**: Voir la version corrigée du Dockerfile.

---

### ❌ Erreur: Images trop volumineuses à transférer

**Symptômes**:
```
blindtest-api.tar: 1.2 GB
blindtest-web.tar: 800 MB
Transfert très lent en SCP
```

**Solutions**:

**Option 1: Compression**
```powershell
# Windows (avec 7-Zip)
7z a -tgzip blindtest-api.tar.gz blindtest-api.tar
7z a -tgzip blindtest-web.tar.gz blindtest-web.tar

# Linux/Mac
gzip blindtest-api.tar
gzip blindtest-web.tar

# Transfert des fichiers compressés
scp blindtest-api.tar.gz alex@srv506488:/home/alex/
scp blindtest-web.tar.gz alex@srv506488:/home/alex/

# Sur le serveur
gunzip blindtest-api.tar.gz
gunzip blindtest-web.tar.gz
docker load -i blindtest-api.tar
```

**Option 2: Build directement sur le serveur**
```bash
# Transférer seulement le code source
scp -r apps/ alex@srv506488:/home/alex/blindtest-src/
scp package*.json Dockerfile* alex@srv506488:/home/alex/blindtest-src/

# Sur le serveur
cd ~/blindtest-src
docker build -f apps/api/Dockerfile -t blindtest-api:latest .
docker build -f apps/web/Dockerfile -t blindtest-web:latest .
```

**Option 3: Registry Docker privé**
```bash
# Setup registry (une fois)
docker run -d -p 5000:5000 --restart=always --name registry registry:2

# Push depuis Windows
docker tag blindtest-api:latest srv506488:5000/blindtest-api:latest
docker push srv506488:5000/blindtest-api:latest

# Pull depuis le serveur
docker pull srv506488:5000/blindtest-api:latest
docker tag srv506488:5000/blindtest-api:latest blindtest-api:latest
```

---

## Problèmes de Base de Données

### ❌ Erreur: "Unknown column 'RoundSong.group_official' in 'SELECT'"

**Symptômes**:
```
Error: ER_BAD_FIELD_ERROR: Unknown column 'RoundSong.group_official' in 'field list'
500 Internal Server Error lors du chargement de chansons
```

**Cause**:
La migration de base de données n'a pas été appliquée en production. Le code référence une colonne qui n'existe pas dans la base.

**Solution Immédiate (SQL Manuel)**:
```bash
# Se connecter à MariaDB
docker exec -it mariadb mysql -u blindtest_prod -p blindtest_production

# Appliquer la migration manuelle
ALTER TABLE round_songs ADD COLUMN IF NOT EXISTS group_official VARCHAR(255) NULL AFTER artist_official;
ALTER TABLE answers ADD COLUMN IF NOT EXISTS match_group TINYINT(1) NOT NULL DEFAULT 0 AFTER match_artist;

# Vérifier
DESCRIBE round_songs;
DESCRIBE answers;

# Redémarrer l'API
docker-compose restart blindtest-api
```

**Solution Permanente**:
Voir [docs/07-MIGRATIONS.md](./07-MIGRATIONS.md) pour la procédure complète de migration.

**Prévention**:
Toujours exécuter les migrations AVANT de déployer le nouveau code.

---

### ❌ Erreur: "Access denied for user 'blindtest_prod'@'localhost'"

**Symptômes**:
```
ER_ACCESS_DENIED_ERROR: Access denied for user 'blindtest_prod'@'localhost' (using password: YES)
```

**Diagnostics**:
```bash
# Vérifier que le conteneur MariaDB est démarré
docker ps | grep mariadb

# Vérifier les logs MariaDB
docker logs mariadb --tail 50

# Tester la connexion
docker exec -it mariadb mysql -u blindtest_prod -p
```

**Solutions**:

**1. Mot de passe incorrect dans .env**
```bash
# Vérifier le fichier .env
cat ~/docker-services/.env | grep DB_PASS

# Tester avec le bon mot de passe
docker exec -it mariadb mysql -u blindtest_prod -pMOT_DE_PASSE_CORRECT blindtest_production
```

**2. Utilisateur n'existe pas**
```bash
# Se connecter en root
docker exec -it mariadb mysql -u root -p

# Créer l'utilisateur
CREATE USER IF NOT EXISTS 'blindtest_prod'@'%' IDENTIFIED BY 'mot_de_passe';
GRANT ALL PRIVILEGES ON blindtest_production.* TO 'blindtest_prod'@'%';
FLUSH PRIVILEGES;
```

**3. Base de données n'existe pas**
```bash
# Créer la base
docker exec -it mariadb mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS blindtest_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

### ❌ Erreur: "ECONNREFUSED 127.0.0.1:3306"

**Symptômes**:
```
Error: connect ECONNREFUSED 127.0.0.1:3306
API ne peut pas se connecter à la base de données
```

**Diagnostics**:
```bash
# Vérifier que MariaDB écoute sur le bon port
docker exec -it mariadb netstat -tuln | grep 3306

# Vérifier les réseaux Docker
docker network ls
docker network inspect docker-services_default
```

**Solutions**:

**1. Mauvais host dans .env**
```bash
# ❌ Incorrect
DB_HOST=127.0.0.1

# ✅ Correct - nom du service Docker Compose
DB_HOST=mariadb
```

**2. Conteneurs pas sur le même réseau**
```yaml
# docker-compose.yml
services:
  blindtest-api:
    networks:
      - default
  mariadb:
    networks:
      - default

networks:
  default:
    name: docker-services_default
```

**3. Port mapping manquant**
```yaml
# docker-compose.yml
mariadb:
  ports:
    - "3306:3306"  # Exposer pour accès externe si nécessaire
```

---

## Problèmes API

### ❌ Erreur: 502 Bad Gateway

**Symptômes**:
```
502 Bad Gateway
nginx/Traefik ne peut pas atteindre l'API
```

**Diagnostics**:
```bash
# Vérifier que le conteneur API est démarré
docker ps | grep blindtest-api

# Vérifier les logs de l'API
docker logs blindtest-api --tail 100

# Vérifier les logs Traefik
docker logs traefik --tail 100

# Tester l'API directement (bypass Traefik)
docker exec -it blindtest-api curl http://localhost:3000/api/health
```

**Solutions**:

**1. API ne démarre pas**
```bash
# Voir les logs pour identifier l'erreur
docker logs blindtest-api

# Erreurs communes:
# - Connexion DB échouée -> Vérifier DB_HOST, DB_PASS
# - Port déjà utilisé -> Changer API_PORT
# - Module manquant -> Rebuild l'image
```

**2. Port non exposé**
```yaml
# docker-compose.yml
blindtest-api:
  expose:
    - "3000"  # Nécessaire pour Traefik
```

**3. Labels Traefik incorrects**
```yaml
# docker-compose.yml
blindtest-api:
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.blindtest-api.rule=Host(`blindtest.codeharmony.fr`) && PathPrefix(`/api`)"
    - "traefik.http.services.blindtest-api.loadbalancer.server.port=3000"
```

---

### ❌ Erreur: 500 Internal Server Error

**Symptômes**:
```
POST /api/rounds/4/songs -> 500 Internal Server Error
Logs montrent une erreur SQL ou TypeScript
```

**Diagnostics**:
```bash
# Voir les logs détaillés
docker logs blindtest-api --tail 200 --follow

# Regarder spécifiquement les erreurs
docker logs blindtest-api 2>&1 | grep -i error

# Vérifier le health endpoint
curl https://blindtest.codeharmony.fr/api/health
```

**Solutions**:

**1. Erreur SQL (colonne manquante)**
```
Error: Unknown column 'group_official' in 'field list'
```
→ Voir [Problèmes de Base de Données](#problèmes-de-base-de-données)

**2. Erreur TypeScript (module manquant)**
```
Error: Cannot find module '@blindtest/shared'
```
→ Rebuild l'image Docker avec toutes les dépendances

**3. Erreur de validation**
```
ValidationError: "duration" is required
```
→ Vérifier le payload de la requête

---

### ❌ Erreur: Rate Limit Exceeded

**Symptômes**:
```
429 Too Many Requests
{"error": "Rate limit exceeded"}
```

**Cause**:
Trop de requêtes depuis la même IP.

**Solutions**:

**1. Désactiver temporairement (développement)**
```typescript
// apps/api/src/middlewares/rate-limit.ts
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 10000 : 100, // ← Augmenter en dev
});
```

**2. Whitelist une IP (production)**
```typescript
export const globalRateLimit = rateLimit({
  skip: (req) => {
    const ip = req.ip;
    return ['127.0.0.1', 'IP_A_WHITELIST'].includes(ip);
  },
});
```

**3. Attendre l'expiration du rate limit**
Le rate limit est par fenêtre de 15 minutes. Attendre ou redémarrer l'API.

---

## Problèmes Frontend

### ❌ Erreur: White screen / App ne charge pas

**Symptômes**:
- Page blanche
- Aucun contenu affiché
- Console: "Failed to load module script"

**Diagnostics**:
```bash
# Ouvrir la console navigateur (F12)
# Regarder les erreurs dans Console et Network

# Vérifier que nginx sert les fichiers
docker exec -it blindtest-web ls -la /usr/share/nginx/html

# Vérifier les logs nginx
docker logs blindtest-web --tail 50
```

**Solutions**:

**1. Mauvais chemin de build**
```dockerfile
# ❌ Incorrect
COPY --from=builder /app/dist/web /usr/share/nginx/html

# ✅ Correct
COPY --from=builder /app/apps/web/dist/web/browser /usr/share/nginx/html
```

**2. Nginx mal configuré**
```nginx
# nginx.conf
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;  # Important pour Angular routing
  }
}
```

**3. Build Angular échoué**
```bash
# Vérifier les logs de build
docker build -f apps/web/Dockerfile -t blindtest-web:latest . 2>&1 | tee build.log

# Chercher les erreurs
grep -i error build.log
```

---

### ❌ Erreur: API calls fail avec CORS error

**Symptômes**:
```
Access to XMLHttpRequest at 'https://blindtest.codeharmony.fr/api/auth/login' from origin 'https://blindtest.codeharmony.fr' has been blocked by CORS policy
```

**Diagnostics**:
```bash
# Vérifier la config CORS de l'API
docker exec -it blindtest-api cat /app/apps/api/src/app.ts | grep cors

# Tester avec curl
curl -H "Origin: https://blindtest.codeharmony.fr" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://blindtest.codeharmony.fr/api/auth/login -v
```

**Solutions**:

**1. Mauvaise origine CORS**
```typescript
// apps/api/src/app.ts
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://blindtest.codeharmony.fr',
  credentials: true,
}));
```

**2. .env incorrect**
```bash
# .env
CORS_ORIGIN=https://blindtest.codeharmony.fr  # Pas de slash final !
```

**3. Traefik ne passe pas les headers**
```yaml
# docker-compose.yml
blindtest-api:
  labels:
    - "traefik.http.middlewares.cors-headers.headers.accesscontrolalloworiginlist=https://blindtest.codeharmony.fr"
```

---

### ❌ Erreur: Dropdown illisible (texte blanc sur fond blanc)

**Symptômes**:
Le sélecteur de plan d'abonnement affiche du texte clair sur fond clair.

**Solution**:
```scss
// register.component.ts (dans @Component styles)
.plan-select {
  background-color: #1f2937;
  color: #e5e7eb;
  border: 1px solid #374151;

  option {
    background-color: #1f2937;
    color: #e5e7eb;
    padding: 8px;
  }
}
```

---

## Problèmes Docker

### ❌ Erreur: "Error response from daemon: conflict"

**Symptômes**:
```
Error response from daemon: conflict: unable to remove repository reference
```

**Solution**:
```bash
# Arrêter tous les conteneurs qui utilisent l'image
docker-compose stop blindtest-api

# Supprimer le conteneur
docker rm blindtest-api

# Supprimer l'image
docker rmi blindtest-api:latest

# Rebuild
docker build -f apps/api/Dockerfile -t blindtest-api:latest .
```

---

### ❌ Erreur: "No space left on device"

**Symptômes**:
```
ERROR: failed to solve: write /var/lib/docker/tmp/...: no space left on device
```

**Diagnostics**:
```bash
# Vérifier l'espace disque
df -h

# Vérifier l'utilisation Docker
docker system df
```

**Solutions**:
```bash
# Nettoyer les images inutilisées
docker image prune -a

# Nettoyer les conteneurs arrêtés
docker container prune

# Nettoyer les volumes non utilisés
docker volume prune

# Nettoyer tout (ATTENTION: supprime tout ce qui n'est pas utilisé)
docker system prune -a --volumes
```

---

### ❌ Erreur: "Cannot start container: port is already allocated"

**Symptômes**:
```
Error starting userland proxy: listen tcp 0.0.0.0:3000: bind: address already in use
```

**Diagnostics**:
```bash
# Linux/Mac: Trouver quel processus utilise le port
sudo lsof -i :3000

# Windows: Trouver quel processus utilise le port
netstat -ano | findstr :3000

# Docker: Voir tous les mappings de ports
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

**Solutions**:
```bash
# Arrêter le conteneur qui utilise le port
docker stop nom_du_conteneur

# Ou changer le port dans docker-compose.yml
ports:
  - "3001:3000"  # Mapper 3001 externe -> 3000 interne
```

---

## Problèmes WebSocket

### ❌ Erreur: WebSocket connection failed

**Symptômes**:
```
WebSocket connection to 'wss://blindtest.codeharmony.fr/socket.io/' failed
ERR_CONNECTION_REFUSED
```

**Diagnostics**:
```bash
# Vérifier que l'API expose les WebSockets
docker logs blindtest-api | grep -i socket

# Tester la connexion WebSocket
npm install -g wscat
wscat -c wss://blindtest.codeharmony.fr/socket.io/
```

**Solutions**:

**1. Traefik ne route pas les WebSockets**
```yaml
# docker-compose.yml - Labels Traefik pour WebSocket
blindtest-api:
  labels:
    - "traefik.http.routers.blindtest-api-ws.rule=Host(`blindtest.codeharmony.fr`) && PathPrefix(`/socket.io`)"
    - "traefik.http.routers.blindtest-api-ws.service=blindtest-api"
    - "traefik.http.middlewares.ws-headers.headers.customrequestheaders.Connection=Upgrade"
    - "traefik.http.middlewares.ws-headers.headers.customrequestheaders.Upgrade=websocket"
```

**2. CORS WebSocket**
```typescript
// apps/api/src/ws/socket.ts
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
  path: '/socket.io',
  transports: ['websocket', 'polling'],
});
```

---

## Diagnostics Généraux

### Checklist de Diagnostic Rapide

Quand quelque chose ne fonctionne pas, suivre ces étapes :

```bash
# 1. Vérifier que tous les conteneurs sont UP
docker ps
# blindtest-api, blindtest-web, mariadb, redis, traefik doivent être "Up"

# 2. Vérifier les logs de chaque service
docker logs blindtest-api --tail 50
docker logs blindtest-web --tail 20
docker logs mariadb --tail 30
docker logs traefik --tail 30

# 3. Tester la connectivité réseau
docker exec -it blindtest-api ping mariadb
docker exec -it blindtest-api ping redis

# 4. Tester les endpoints
curl https://blindtest.codeharmony.fr/api/health
curl https://blindtest.codeharmony.fr -I

# 5. Vérifier les variables d'environnement
docker exec -it blindtest-api env | grep DB_
docker exec -it blindtest-api env | grep JWT_

# 6. Vérifier la base de données
docker exec -it mariadb mysql -u blindtest_prod -p -e "SHOW DATABASES;"
docker exec -it mariadb mysql -u blindtest_prod -p blindtest_production -e "SHOW TABLES;"
```

### Commandes Utiles

```bash
# Redémarrer un service
docker-compose restart blindtest-api

# Voir les ressources utilisées
docker stats blindtest-api blindtest-web mariadb

# Voir les réseaux Docker
docker network ls
docker network inspect docker-services_default

# Entrer dans un conteneur
docker exec -it blindtest-api sh

# Suivre les logs en temps réel
docker logs -f blindtest-api

# Voir les 100 dernières lignes avec timestamps
docker logs blindtest-api --tail 100 --timestamps

# Filtrer les erreurs dans les logs
docker logs blindtest-api 2>&1 | grep -i error
```

### Récupération d'Urgence

Si tout est cassé :

```bash
# 1. Sauvegarder la base de données
mysqldump -u blindtest_prod -p blindtest_production > emergency_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Arrêter tout
docker-compose down

# 3. Nettoyer
docker system prune -f

# 4. Redémarrer
docker-compose up -d

# 5. Vérifier les logs
docker-compose logs -f
```

## Contacts et Ressources

### Documentation
- [Déploiement](./06-DEPLOYMENT.md)
- [Migrations](./07-MIGRATIONS.md)
- [Index Documentation](./README.md)

### Logs Importants
- **API** : `docker logs blindtest-api`
- **Web** : `docker logs blindtest-web`
- **DB** : `docker logs mariadb`
- **Traefik** : `docker logs traefik`

### Commandes de Santé
```bash
# Health check API
curl https://blindtest.codeharmony.fr/api/health

# Vérifier les conteneurs
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Vérifier l'espace disque
df -h
docker system df
```

---

**Dernière mise à jour** : 2025-10-29
**Version** : 1.0.0
**Auteur** : Alexandre Désiré
