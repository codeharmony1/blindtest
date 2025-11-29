# 📋 Modifications pour le déploiement - Blind Test Musical

**Date** : 25 octobre 2025
**Serveur** : srv506488 (VPS)
**URL** : https://blindtest.codeharmony.fr

## ✅ État actuel

- ✅ Frontend accessible sur https://blindtest.codeharmony.fr
- ✅ API accessible sur https://blindtest.codeharmony.fr/api
- ✅ Certificat SSL Let's Encrypt automatique
- ✅ Traefik routing configuré
- ✅ Base de données MariaDB créée

---

## 🔧 Modifications à appliquer aux fichiers locaux

### 1. `docker-compose.prod.yml`

**Changements effectués sur le serveur :**

#### Service `blindtest-api`

```yaml
labels:
  - "traefik.enable=true"

  # Router renommé pour éviter les conflits
  - "traefik.http.routers.blindtest-api-backend.rule=Host(`blindtest.codeharmony.fr`) && PathPrefix(`/api`)"
  - "traefik.http.routers.blindtest-api-backend.entrypoints=https"
  - "traefik.http.routers.blindtest-api-backend.tls=true"
  - "traefik.http.routers.blindtest-api-backend.tls.certresolver=letsencrypt"
  - "traefik.http.routers.blindtest-api-backend.priority=100"

  # Middleware CORS défini
  - "traefik.http.middlewares.blindtest-cors.headers.accesscontrolallowmethods=GET,OPTIONS,PUT,POST,DELETE,PATCH"
  - "traefik.http.middlewares.blindtest-cors.headers.accesscontrolalloworiginlist=https://blindtest.codeharmony.fr"
  - "traefik.http.middlewares.blindtest-cors.headers.accesscontrolallowcredentials=true"
  - "traefik.http.middlewares.blindtest-cors.headers.accesscontrolallowheaders=*"
  - "traefik.http.routers.blindtest-api-backend.middlewares=blindtest-cors"

  - "traefik.http.services.blindtest-api-backend.loadbalancer.server.port=3000"
  - "traefik.docker.network=proxy"
```

#### Service `blindtest-web`

```yaml
labels:
  - "traefik.enable=true"

  # Router renommé + suppression du www
  - "traefik.http.routers.blindtest-web-frontend.rule=Host(`blindtest.codeharmony.fr`)"
  - "traefik.http.routers.blindtest-web-frontend.entrypoints=https"
  - "traefik.http.routers.blindtest-web-frontend.tls=true"
  - "traefik.http.routers.blindtest-web-frontend.tls.certresolver=letsencrypt"
  - "traefik.http.routers.blindtest-web-frontend.priority=10"

  - "traefik.http.services.blindtest-web-frontend.loadbalancer.server.port=80"
  - "traefik.docker.network=proxy"

# Healthcheck corrigé
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://127.0.0.1:80/"]
  interval: 30s
  timeout: 3s
  retries: 3
  start_period: 5s
```

**Variables d'environnement :**

```yaml
# API
DB_NAME: blindtest_production  # Au lieu de "blindtest"
```

---

### 2. Fichier `.env` sur le serveur

**Localisation** : `~/docker-services/.env`

**Variables ajoutées :**

```bash
# ============================================
# BLIND TEST MUSICAL
# ============================================

# Database
BLINDTEST_DB_USER=blindtest_prod
BLINDTEST_DB_PASSWORD=COLfd4658_sdRSDFGeryghazZhgolihgvb12354gdsxcgze6587
BLINDTEST_DB_NAME=blindtest_production

# JWT Secrets (générés avec crypto.randomBytes(64).toString('hex'))
BLINDTEST_JWT_SECRET=2af150f1a52a0bbc8dfca9094bc9ff03db4e2bb404e1ac56da087767dfae0a62ca3b233cacfbff7dfc2fadf2707584370a32ee94fc0e1247f9c653bd92939b9d
BLINDTEST_JWT_REFRESH_SECRET=c5523c9f5fb95d13207c6ffec06289e75fbfc5d3c3fb0607fffee9a841df20ee6181d7676a5c5f2b0296c17c56c248be65a57dc626dccf5b37806d14fe006232

# Email SMTP (mot de passe échappé)
BLINDTEST_SMTP_PASSWORD='3yKmyLGT9F$#CsLz'

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

**⚠️ Important** : Échapper les caractères spéciaux dans les mots de passe avec des guillemets simples

---

### 3. Base de données MariaDB

**Commandes SQL exécutées :**

```sql
-- Créer la base
CREATE DATABASE IF NOT EXISTS blindtest_production
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Créer l'utilisateur
CREATE USER IF NOT EXISTS 'blindtest_prod'@'%'
  IDENTIFIED BY 'COLfd4658_sdRSDFGeryghazZhgolihgvb12354gdsxcgze6587';

-- Droits
GRANT ALL PRIVILEGES ON blindtest_production.* TO 'blindtest_prod'@'%';
FLUSH PRIVILEGES;
```

---

## 📦 Fichiers à mettre à jour localement

### Fichiers modifiés :

1. ✅ `docker-compose.prod.yml` - Labels Traefik corrigés
2. ✅ `.env.production.example` - Template à jour
3. ✅ `apps/web/Dockerfile` - Healthcheck wget
4. ✅ `apps/web/nginx.conf` - Pas de changement nécessaire

### Nouveaux fichiers à créer :

1. `DEPLOIEMENT-MODIFICATIONS.md` (ce fichier)
2. `.env.production.example` mis à jour

---

## 🚀 Commandes de déploiement

### Sur le serveur (pour redéployer) :

```bash
# 1. Aller dans le dossier docker
cd ~/docker-services

# 2. Rebuild des images si code modifié
docker compose build blindtest-api blindtest-web

# 3. Redémarrer les services
docker compose up -d blindtest-api blindtest-web

# 4. Vérifier les logs
docker compose logs -f blindtest-api
docker compose logs -f blindtest-web

# 5. Tester
curl https://blindtest.codeharmony.fr/
curl https://blindtest.codeharmony.fr/api/health
```

---

## 🔍 Tests de validation

```bash
# Test 1 : Frontend HTTPS
curl -I https://blindtest.codeharmony.fr/
# Attendu : HTTP/2 200

# Test 2 : API HTTPS
curl https://blindtest.codeharmony.fr/api/health
# Attendu : {"ok":true,"timestamp":"...","version":"1.0.0","environment":"production"}

# Test 3 : Conteneurs healthy
docker ps | grep blindtest
# Attendu : tous (healthy)

# Test 4 : Certificat SSL
curl -vI https://blindtest.codeharmony.fr/ 2>&1 | grep "SSL certificate verify"
# Attendu : verification successful
```

---

## ⚠️ Points d'attention

1. **DNS** : Seul `blindtest.codeharmony.fr` est configuré (pas `www`)
2. **Certificat SSL** : Géré automatiquement par Traefik + Let's Encrypt
3. **Base de données** : Vide actuellement (migrations à exécuter)
4. **Caractères spéciaux** : Toujours échapper avec guillemets simples dans .env
5. **Router names** : Utiliser des noms uniques (`-backend`, `-frontend`) pour éviter les conflits

---

## 📝 Prochaines étapes

1. [ ] Mettre à jour `docker-compose.prod.yml` localement
2. [ ] Créer `.env.production.example` à jour
3. [ ] Exécuter les migrations de base de données
4. [ ] Créer le super admin
5. [ ] Tester l'application complète
6. [ ] Commit et push des modifications

---

## 🔐 Secrets à NE JAMAIS committer

- ❌ `.env.production` (contient les vrais secrets)
- ✅ `.env.production.example` (template sans secrets)

---

## 📞 Support

- Logs API : `docker logs blindtest-api`
- Logs Web : `docker logs blindtest-web`
- Logs Traefik : `docker logs traefik | grep blindtest`
- Dashboard Traefik : https://traefik.codeharmony.fr (si configuré)
