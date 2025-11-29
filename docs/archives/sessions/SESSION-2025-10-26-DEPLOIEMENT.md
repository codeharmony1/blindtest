# 📦 Session de déploiement - 26 octobre 2025

## 🎯 Objectifs de la session

✅ Résoudre les problèmes de déploiement en production
✅ Configurer Traefik pour HTTPS
✅ Automatiser l'initialisation de la base de données
✅ Déployer l'application complète sur le VPS

---

## 🔧 Problèmes résolus

### 1. Erreur SMTP au démarrage de l'API

**Symptôme :**
```
Error: Invalid login: 535 5.7.8 Error: authentication failed
```

**Cause :** Mot de passe SMTP avec caractères spéciaux (`$#`) mal échappé dans `.env`

**Solution :**
```bash
# Dans .env
BLINDTEST_SMTP_PASSWORD='3yKmyLGT9F$#CsLz'  # Guillemets simples requis
```

### 2. Configuration Traefik avec un seul domaine

**Objectif :** Frontend et API sur `blindtest.codeharmony.fr`

**Configuration réalisée :**
- Frontend : `https://blindtest.codeharmony.fr/`
- API : `https://blindtest.codeharmony.fr/api/*`

**Modifications clés :**
- Router API : priorité 100 pour capturer `/api` en premier
- Router Web : priorité 10 pour tout le reste
- Middleware CORS configuré pour l'API

### 3. Healthcheck frontend échoué

**Symptôme :**
```
wget: can't connect to remote host (::1): Connection refused
```

**Solution :** Changement de `localhost` à `127.0.0.1` dans le healthcheck

### 4. Initialisation de la base de données

**Problème :** Migrations TypeORM non disponibles en production (ts-node absent)

**Solution :** Création du script `init-database.ts` avec `synchronize: true`

**Utilisation :**
```bash
docker exec blindtest-api node dist/scripts/init-database.js
```

**Résultat :** 16 tables créées automatiquement

---

## 📁 Fichiers créés

### Documentation

1. **DEPLOIEMENT-MODIFICATIONS.md**
   - Toutes les modifications de configuration
   - Variables d'environnement requises
   - Commandes SQL

2. **GUIDE-INITIALISATION-DB.md**
   - 3 méthodes d'initialisation (local, Docker, automatique)
   - Troubleshooting
   - Vérification et sécurité

3. **GUIDE-DEPLOIEMENT-RAPIDE.md**
   - Workflow étape par étape
   - Configuration serveur
   - Tests de validation

4. **WORKFLOW-DEPLOIEMENT.md**
   - Workflow complet de développement à production
   - Script automatisé
   - Monitoring et rollback

5. **GUIDE-FINALISATION-DEPLOIEMENT.md**
   - Création du super admin
   - Tests de validation complets
   - Sécurité post-déploiement

6. **DEPLOIEMENT-COMPLETE-2025-10-26.md**
   - Rapport complet de la session
   - Toutes les modifications techniques
   - Checklist de validation

7. **PROCHAINES-ETAPES.md**
   - Actions immédiates à effectuer
   - Commandes rapides

8. **SESSION-2025-10-26-DEPLOIEMENT.md** (ce fichier)
   - Résumé de la session
   - Fichiers modifiés
   - Prochaines étapes

### Scripts

9. **apps/api/src/scripts/init-database.ts**
   - Script d'initialisation automatique de la base de données
   - Utilise TypeORM `synchronize: true`
   - Affiche les tables créées

---

## 📝 Fichiers modifiés

### 1. docker-compose.prod.yml

**Modifications :**
- Labels Traefik pour `blindtest-api` :
  - Router `blindtest-api-backend` avec priorité 100
  - PathPrefix `/api`
  - Middleware CORS configuré
- Labels Traefik pour `blindtest-web` :
  - Router `blindtest-web-frontend` avec priorité 10
  - Capture toutes les requêtes non-API
- Healthcheck `blindtest-web` :
  - Changé de `localhost` à `127.0.0.1`
  - Changé de `/health` à `/`

### 2. apps/api/package.json

**Ajout :**
```json
{
  "scripts": {
    "init:db": "ts-node src/scripts/init-database.ts"
  }
}
```

### 3. apps/web/Dockerfile

**Déjà optimisé :** Multi-stage build avec nginx

---

## 🚀 Workflow de déploiement utilisé

### Machine locale (Windows)

```bash
# 1. Build
docker build -t blindtest-api:latest ./apps/api
docker build -t blindtest-web:latest ./apps/web

# 2. Export (sans gzip car Windows PowerShell)
docker save -o blindtest-api.tar blindtest-api:latest
docker save -o blindtest-web.tar blindtest-web:latest

# 3. Transfert
scp blindtest-api.tar alex@srv506488:~/
scp blindtest-web.tar alex@srv506488:~/
```

### Serveur (Linux)

```bash
# 1. Charger les images
docker load < ~/blindtest-api.tar
docker load < ~/blindtest-web.tar

# 2. Redémarrer les services
cd ~/docker-services
docker compose restart blindtest-api blindtest-web

# 3. Initialiser la DB (première fois seulement)
docker exec blindtest-api node dist/scripts/init-database.js
```

---

## ✅ Validation effectuée

### Tests réussis

| Test | Commande | Résultat |
|------|----------|----------|
| **API Health** | `curl https://blindtest.codeharmony.fr/api/health` | ✅ `{"ok":true,...}` |
| **Frontend** | `curl -I https://blindtest.codeharmony.fr/` | ✅ `HTTP/2 200` |
| **Conteneurs** | `docker ps \| grep blindtest` | ✅ Tous `(healthy)` |
| **Tables DB** | `SHOW TABLES;` | ✅ 16 tables créées |
| **SSL/HTTPS** | Navigateur | ✅ Certificat Let's Encrypt valide |

### 16 tables créées

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

---

## 🔜 Prochaines étapes

### Action immédiate

```bash
# Créer le super admin
ssh alex@srv506488
docker exec blindtest-api node dist/scripts/create-super-admin-test.js
```

**Identifiants créés :**
- Email : `admin@blindtest.local`
- Password : `SuperAdmin123!`

### Tests fonctionnels

1. Test login API super admin
2. Accès interface web
3. Création d'un événement de test
4. Test complet du workflow de jeu

### Configuration avancée (optionnel)

- Configuration Stripe pour les paiements
- Configuration email SMTP
- Sauvegardes automatiques
- Monitoring (Prometheus + Grafana)

---

## 📚 Documentation

Tous les guides sont disponibles dans le dossier racine :

| Guide | Description |
|-------|-------------|
| **[PROCHAINES-ETAPES.md](PROCHAINES-ETAPES.md)** | 🔴 **À LIRE EN PREMIER** - Actions immédiates |
| **[GUIDE-FINALISATION-DEPLOIEMENT.md](GUIDE-FINALISATION-DEPLOIEMENT.md)** | Finalisation et tests |
| **[WORKFLOW-DEPLOIEMENT.md](WORKFLOW-DEPLOIEMENT.md)** | Workflow complet |
| **[GUIDE-DEPLOIEMENT-RAPIDE.md](GUIDE-DEPLOIEMENT-RAPIDE.md)** | Déploiement rapide |
| **[GUIDE-INITIALISATION-DB.md](GUIDE-INITIALISATION-DB.md)** | Initialisation DB |
| **[DEPLOIEMENT-MODIFICATIONS.md](DEPLOIEMENT-MODIFICATIONS.md)** | Modifications techniques |
| **[DEPLOIEMENT-COMPLETE-2025-10-26.md](DEPLOIEMENT-COMPLETE-2025-10-26.md)** | Rapport complet |

---

## 🎉 Résumé

### ✅ Accomplissements

- Application déployée avec succès sur `https://blindtest.codeharmony.fr`
- HTTPS fonctionnel via Traefik + Let's Encrypt
- Base de données initialisée automatiquement
- Architecture multi-tenant opérationnelle
- Documentation complète créée

### 🔧 Outils et technologies

- **Docker** : Conteneurisation
- **Traefik** : Reverse proxy + SSL automatique
- **MariaDB** : Base de données production
- **TypeORM** : ORM avec synchronisation auto
- **Node.js** : Backend API
- **Angular** : Frontend PWA
- **nginx** : Serveur web pour le frontend

### 📊 Métriques

- **Temps de déploiement** : ~30 minutes
- **Nombre de tables** : 16
- **Nombre de conteneurs** : 3 (api, web, redis)
- **Guides créés** : 8
- **Scripts créés** : 1

---

## 🔒 Sécurité

### ✅ Implémenté

- HTTPS avec certificat Let's Encrypt
- Variables d'environnement sécurisées
- Échappement des caractères spéciaux dans les mots de passe
- Healthchecks pour tous les conteneurs
- CORS configuré

### ⚠️ À faire

- Changer le mot de passe super admin par défaut
- Générer des secrets JWT uniques pour la production
- Configurer des sauvegardes automatiques de la base de données
- Mettre en place un monitoring des logs

---

## 💡 Leçons apprises

1. **Échappement des caractères spéciaux** : Toujours utiliser des guillemets simples dans `.env` pour les mots de passe avec `$`, `#`, etc.

2. **Traefik Priority** : Les routes plus spécifiques (comme `/api`) doivent avoir une priorité plus élevée

3. **Healthcheck IPv6** : Utiliser `127.0.0.1` au lieu de `localhost` pour éviter les problèmes IPv6

4. **TypeORM en production** : `synchronize: true` est pratique pour l'initialisation mais ne devrait pas être utilisé en production courante

5. **Déploiement Windows → Linux** : `gzip` n'est pas disponible sur PowerShell, utiliser `docker save -o` directement

---

## 📞 Support

Pour toute question ou problème :
1. Consulter la documentation dans les fichiers `.md`
2. Vérifier les logs : `docker logs <container_name>`
3. Consulter le dashboard Traefik si configuré

---

**Session terminée avec succès ! 🎉**

L'application Blind Test Musical est maintenant déployée et prête pour la création du super admin et les tests fonctionnels.

**Prochaine action :** Suivre [PROCHAINES-ETAPES.md](PROCHAINES-ETAPES.md)
