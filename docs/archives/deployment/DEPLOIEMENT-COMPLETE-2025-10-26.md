# 📦 Déploiement complet - Blind Test Musical
## Session du 26 octobre 2025

---

## 🎯 Objectif de la session

Déployer l'application Blind Test Musical sur le serveur de production avec :
- Base de données initialisée automatiquement
- HTTPS fonctionnel via Traefik
- Architecture multi-tenant prête
- Interface super admin accessible

---

## ✅ Travaux réalisés

### 1. Résolution du problème SMTP initial

**Problème :**
- Erreur d'authentification SMTP bloquant le démarrage de l'API
- Mot de passe avec caractères spéciaux (`$#`) mal interprété

**Solution :**
- Utilisation de guillemets simples dans le fichier `.env` :
  ```bash
  BLINDTEST_SMTP_PASSWORD='3yKmyLGT9F$#CsLz'
  ```

### 2. Configuration Traefik

**Objectif :** Un seul domaine (`blindtest.codeharmony.fr`) pour le frontend et l'API

**Modifications dans `docker-compose.prod.yml` :**

#### Service blindtest-api
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.blindtest-api-backend.rule=Host(`blindtest.codeharmony.fr`) && PathPrefix(`/api`)"
  - "traefik.http.routers.blindtest-api-backend.entrypoints=websecure"
  - "traefik.http.routers.blindtest-api-backend.tls.certresolver=letsencrypt"
  - "traefik.http.routers.blindtest-api-backend.priority=100"

  # CORS Middleware
  - "traefik.http.middlewares.blindtest-cors.headers.accesscontrolallowmethods=GET,OPTIONS,PUT,POST,DELETE,PATCH"
  - "traefik.http.middlewares.blindtest-cors.headers.accesscontrolalloworiginlist=https://blindtest.codeharmony.fr"
  - "traefik.http.middlewares.blindtest-cors.headers.accesscontrolallowheaders=Content-Type,Authorization"
  - "traefik.http.middlewares.blindtest-cors.headers.accesscontrolallowcredentials=true"
  - "traefik.http.routers.blindtest-api-backend.middlewares=blindtest-cors"
```

#### Service blindtest-web
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.blindtest-web-frontend.rule=Host(`blindtest.codeharmony.fr`)"
  - "traefik.http.routers.blindtest-web-frontend.entrypoints=websecure"
  - "traefik.http.routers.blindtest-web-frontend.tls.certresolver=letsencrypt"
  - "traefik.http.routers.blindtest-web-frontend.priority=10"
```

**Points clés :**
- Router API nommé `blindtest-api-backend` (évite les conflits)
- Router Web nommé `blindtest-web-frontend`
- Priorité API (100) > Web (10) pour que `/api` soit capturé en premier
- Middleware CORS défini et appliqué

### 3. Correction du healthcheck frontend

**Problème :**
```
wget: can't connect to remote host (::1): Connection refused
```

**Cause :** `wget` essayait de se connecter en IPv6

**Solution dans `docker-compose.prod.yml` :**
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://127.0.0.1:80/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 4. Initialisation automatique de la base de données

**Fichier créé :** [`apps/api/src/scripts/init-database.ts`](apps/api/src/scripts/init-database.ts)

**Fonctionnalités :**
- Connexion à la base de données en utilisant les variables d'environnement
- Utilisation de `synchronize: true` pour créer automatiquement toutes les tables
- Affichage de la liste des tables créées
- Gestion des erreurs courantes avec suggestions de solutions

**Utilisation :**
```bash
# En local
npm run init:db -w @blindtest/api

# En production
docker exec blindtest-api node dist/scripts/init-database.js
```

**Tables créées (16 au total) :**
1. answers
2. audit_logs
3. event_staff
4. events
5. organizers
6. password_reset_tokens
7. payments
8. players
9. round_songs
10. rounds
11. scores
12. super_admins
13. team
14. tenant_sessions
15. tenant_users
16. tenants

### 5. Script de création du super admin

**Fichier existant :** [`apps/api/src/scripts/create-super-admin-test.ts`](apps/api/src/scripts/create-super-admin-test.ts)

**Identifiants par défaut :**
- Email : `admin@blindtest.local`
- Password : `SuperAdmin123!`
- Nom : `Super Admin Test`

**Utilisation :**
```bash
# En local
npm run create:super-admin:test -w @blindtest/api

# En production
docker exec blindtest-api node dist/scripts/create-super-admin-test.js
```

---

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers

1. **[DEPLOIEMENT-MODIFICATIONS.md](DEPLOIEMENT-MODIFICATIONS.md)**
   - Documentation de toutes les modifications de configuration
   - Variables d'environnement requises
   - Commandes SQL pour créer la base de données

2. **[GUIDE-INITIALISATION-DB.md](GUIDE-INITIALISATION-DB.md)**
   - 3 méthodes d'initialisation (local, Docker, automatique)
   - Résolution des problèmes courants
   - Vérification et sécurité

3. **[GUIDE-DEPLOIEMENT-RAPIDE.md](GUIDE-DEPLOIEMENT-RAPIDE.md)**
   - Workflow étape par étape
   - Configuration serveur
   - Tests de validation

4. **[WORKFLOW-DEPLOIEMENT.md](WORKFLOW-DEPLOIEMENT.md)**
   - Workflow complet de développement à production
   - Script automatisé de déploiement
   - Monitoring et rollback

5. **[GUIDE-FINALISATION-DEPLOIEMENT.md](GUIDE-FINALISATION-DEPLOIEMENT.md)** ⭐ **NOUVEAU**
   - Création du super admin
   - Tests de validation complets
   - Sécurité post-déploiement
   - Checklist finale

6. **[apps/api/src/scripts/init-database.ts](apps/api/src/scripts/init-database.ts)**
   - Script automatique d'initialisation DB
   - Affichage des tables créées
   - Gestion des erreurs

### Fichiers modifiés

1. **[docker-compose.prod.yml](docker-compose.prod.yml)**
   - Labels Traefik mis à jour
   - Healthcheck corrigé
   - Noms des routers changés

2. **[apps/api/package.json](apps/api/package.json)**
   - Ajout du script `init:db`

3. **[apps/web/Dockerfile](apps/web/Dockerfile)**
   - Multi-stage build optimisé
   - Healthcheck fonctionnel

---

## 🚀 Workflow de déploiement utilisé

### Sur la machine locale (Windows)

```bash
# 1. Build des images
cd "d:\Projet\Blind test musical"
docker build -t blindtest-api:latest ./apps/api
docker build -t blindtest-web:latest ./apps/web

# 2. Export des images (sans gzip car Windows)
docker save -o blindtest-api.tar blindtest-api:latest
docker save -o blindtest-web.tar blindtest-web:latest

# 3. Transfert vers le serveur
scp blindtest-api.tar alex@srv506488:~/
scp blindtest-web.tar alex@srv506488:~/
```

### Sur le serveur

```bash
# 1. Charger les images
docker load < ~/blindtest-api.tar
docker load < ~/blindtest-web.tar

# 2. Redémarrer les services
cd ~/docker-services
docker compose restart blindtest-api blindtest-web

# 3. Initialiser la base de données (première fois)
docker exec blindtest-api node dist/scripts/init-database.js

# 4. Créer le super admin (première fois)
docker exec blindtest-api node dist/scripts/create-super-admin-test.js
```

---

## ✅ Validation du déploiement

### Tests effectués

#### 1. Vérification des conteneurs
```bash
docker ps | grep blindtest
```
**Résultat :** Tous les conteneurs en status `(healthy)` ✅

#### 2. Test API Health
```bash
curl https://blindtest.codeharmony.fr/api/health
```
**Résultat :**
```json
{
  "ok": true,
  "timestamp": "2025-10-26T09:15:37.910Z",
  "version": "1.0.0",
  "environment": "production"
}
```
✅

#### 3. Test Frontend
```bash
curl -I https://blindtest.codeharmony.fr/
```
**Résultat :** `HTTP/2 200` ✅

#### 4. Vérification des tables
```bash
docker exec mariadb mariadb -u blindtest_prod -p blindtest_production -e "SHOW TABLES;"
```
**Résultat :** 16 tables créées ✅

#### 5. Certificat SSL
**Résultat :** HTTPS fonctionnel via Let's Encrypt ✅

---

## 🔐 Sécurité

### Variables d'environnement sensibles

⚠️ **Ne JAMAIS committer :**
- `.env` avec les vraies valeurs
- Mots de passe en clair
- Clés API Stripe en production

✅ **Toujours committer :**
- `.env.example` avec des placeholders
- Documentation
- Scripts de migration

### Secrets à générer

```bash
# JWT Secrets (64 bytes random)
node -e "const crypto = require('crypto'); console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(64).toString('hex'));"
```

### Mots de passe par défaut à changer

- ⚠️ Super admin test : `SuperAdmin123!` → À changer après le premier login
- ⚠️ Base de données : Utiliser un mot de passe fort (20+ caractères)
- ⚠️ Redis : Utiliser un mot de passe fort

---

## 📊 État actuel du déploiement

### ✅ Complété

- [x] Images Docker buildées et déployées
- [x] Base de données créée et initialisée
- [x] 16 tables créées automatiquement
- [x] HTTPS fonctionnel via Traefik
- [x] API accessible sur `/api`
- [x] Frontend accessible sur `/`
- [x] Healthchecks fonctionnels
- [x] CORS configuré
- [x] Variables d'environnement configurées

### 🔜 Prochaines étapes

- [ ] Créer le super admin (voir [GUIDE-FINALISATION-DEPLOIEMENT.md](GUIDE-FINALISATION-DEPLOIEMENT.md))
- [ ] Tester le login super admin via l'API
- [ ] Accéder à l'interface admin web
- [ ] Changer le mot de passe par défaut
- [ ] Tests fonctionnels complets :
  - [ ] Créer un événement
  - [ ] Ajouter des équipes
  - [ ] Ajouter des rounds et chansons
  - [ ] Tester interface DJ
  - [ ] Tester interface joueur
  - [ ] Tester affichage public
- [ ] Configuration optionnelle :
  - [ ] Stripe pour les paiements
  - [ ] Email SMTP pour les notifications
  - [ ] Sauvegardes automatiques

---

## 🎯 Commandes essentielles

### Déploiement

```bash
# Build local
docker build -t blindtest-api:latest ./apps/api
docker build -t blindtest-web:latest ./apps/web

# Export
docker save -o blindtest-api.tar blindtest-api:latest
docker save -o blindtest-web.tar blindtest-web:latest

# Transfert
scp blindtest-*.tar alex@srv506488:~/

# Sur le serveur - Charger et démarrer
ssh alex@srv506488
docker load < ~/blindtest-api.tar
docker load < ~/blindtest-web.tar
cd ~/docker-services
docker compose restart blindtest-api blindtest-web
```

### Monitoring

```bash
# Logs en temps réel
ssh alex@srv506488 'docker logs -f blindtest-api'

# Vérifier le status
ssh alex@srv506488 'docker ps | grep blindtest'

# Tester l'API
curl https://blindtest.codeharmony.fr/api/health
```

### Base de données

```bash
# Initialiser (première fois)
ssh alex@srv506488 'docker exec blindtest-api node dist/scripts/init-database.js'

# Vérifier les tables
ssh alex@srv506488 'docker exec mariadb mariadb -u blindtest_prod -p blindtest_production -e "SHOW TABLES;"'
```

---

## 📚 Documentation complète

1. **[GUIDE-FINALISATION-DEPLOIEMENT.md](GUIDE-FINALISATION-DEPLOIEMENT.md)** - **À SUIVRE MAINTENANT** ⭐
   - Création du super admin
   - Tests de validation
   - Accès à l'interface web

2. **[WORKFLOW-DEPLOIEMENT.md](WORKFLOW-DEPLOIEMENT.md)**
   - Workflow complet de développement à production

3. **[GUIDE-DEPLOIEMENT-RAPIDE.md](GUIDE-DEPLOIEMENT-RAPIDE.md)**
   - Guide de déploiement rapide

4. **[GUIDE-INITIALISATION-DB.md](GUIDE-INITIALISATION-DB.md)**
   - Méthodes d'initialisation de la base de données

5. **[DEPLOIEMENT-MODIFICATIONS.md](DEPLOIEMENT-MODIFICATIONS.md)**
   - Toutes les modifications de configuration

---

## 🎉 Conclusion

L'application Blind Test Musical est maintenant **déployée et fonctionnelle** sur le serveur de production :

- ✅ Accessible via `https://blindtest.codeharmony.fr`
- ✅ API sécurisée avec HTTPS
- ✅ Base de données initialisée
- ✅ Architecture multi-tenant prête
- ✅ Healthchecks opérationnels

**Prochaine action :** Suivre le guide [GUIDE-FINALISATION-DEPLOIEMENT.md](GUIDE-FINALISATION-DEPLOIEMENT.md) pour créer le super admin et tester l'application complète.

---

**Date :** 26 octobre 2025
**Statut :** ✅ Déploiement réussi - Prêt pour la finalisation
**Prochaine session :** Création du super admin et tests fonctionnels
