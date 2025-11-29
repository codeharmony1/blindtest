# Blindtest Musical - Application de jeu de devinettes musicales

Application full-stack temps réel pour organiser des blind tests musicaux.

> 📚 **DOCUMENTATION** : Consultez [docs/README.md](docs/README.md) pour la documentation complète
>
> 🚀 **DÉPLOIEMENT** : Voir [DEPLOIEMENT-GUIDE.md](DEPLOIEMENT-GUIDE.md) pour le guide complet de déploiement
>
> 🔧 **PROBLÈME ?** : Consultez [docs/09-TROUBLESHOOTING.md](docs/09-TROUBLESHOOTING.md)
>
> ⚠️ **IMPORTANT** : Après chaque déploiement, exécutez `docker exec blindtest-api npm run migrate:run`

---

## 🎯 Stack technique

- **API**: Node.js/Express + Socket.IO + TypeORM (MariaDB)
- **Web**: Angular 20 (PWA) avec support temps réel
- **Database**: MariaDB avec architecture multi-tenant
- **Déploiement**: Docker + Traefik + Let's Encrypt

---

## 🚀 Démarrage rapide

### Développement local

```bash
# Démarrer l'API et le frontend
npm run dev

# Ou séparément
cd "d:\Projet\Blind test musical\apps\api"
npm run dev

cd "d:\Projet\Blind test musical\apps\web"
npm start
```

### Navigation en développement

- **Accueil** : http://localhost:4200/
- **Admin** : http://localhost:4200/admin
- **Joueur** : http://localhost:4200/join/CODE_EVENT
- **DJ** : http://localhost:4200/dj/CODE_EVENT
- **Affichage** : http://localhost:4200/display/CODE_EVENT
- **Super Admin** : http://localhost:4200/backstage/login

### 🔐 Comptes de test (développement)

**Tenant par défaut :**
- Email : `admin@blindtest.local`
- Mot de passe : `admin123456`

**Super Admin :**
- Email : `superadmin@blindtest.fr`
- Mot de passe : `SuperAdmin2025!`

---

## 📦 Production

L'application est déployée sur : **https://blindtest.codeharmony.fr**

### 🚀 Initialisation Production

Pour initialiser un nouveau compte admin en production, utilisez le script `init-production.ts` :

```bash
# Sur le serveur de production
docker exec -it blindtest-api npx ts-node apps/api/init-production.ts \
  votre@email.com \
  VotreMotDePasseSecurise123 \
  "Votre Nom"
```

> 📖 **Guide complet** : Voir [MIGRATION-PRODUCTION.md](MIGRATION-PRODUCTION.md) pour les instructions détaillées

### Documentation de déploiement

| Guide | Description |
|-------|-------------|
| **[PROCHAINES-ETAPES.md](PROCHAINES-ETAPES.md)** | 🔴 Actions immédiates après déploiement |
| **[SESSION-2025-10-26-DEPLOIEMENT.md](SESSION-2025-10-26-DEPLOIEMENT.md)** | Résumé de la dernière session |
| **[GUIDE-FINALISATION-DEPLOIEMENT.md](GUIDE-FINALISATION-DEPLOIEMENT.md)** | Finalisation et tests de validation |
| **[WORKFLOW-DEPLOIEMENT.md](WORKFLOW-DEPLOIEMENT.md)** | Workflow complet de déploiement |
| **[GUIDE-DEPLOIEMENT-RAPIDE.md](GUIDE-DEPLOIEMENT-RAPIDE.md)** | Guide de déploiement rapide |
| **[GUIDE-INITIALISATION-DB.md](GUIDE-INITIALISATION-DB.md)** | Initialisation de la base de données |
| **[DEPLOIEMENT-MODIFICATIONS.md](DEPLOIEMENT-MODIFICATIONS.md)** | Modifications techniques |
| **[DEPLOIEMENT-COMPLETE-2025-10-26.md](DEPLOIEMENT-COMPLETE-2025-10-26.md)** | Rapport complet du déploiement |

---

## 🛠️ Commandes utiles

### Base de données

```bash
# Initialiser la base de données (crée toutes les tables)
npm run init:db -w @blindtest/api

# Créer un super admin de test
npm run create:super-admin:test -w @blindtest/api

# Créer un super admin personnalisé
npm run create:super-admin -w @blindtest/api

# Migrations
npm run migrate:generate -w @blindtest/api
npm run migrate:run -w @blindtest/api
```

### Docker (Production)

```bash
# Build des images
docker build -t blindtest-api:latest ./apps/api
docker build -t blindtest-web:latest ./apps/web

# Export des images
docker save -o blindtest-api.tar blindtest-api:latest
docker save -o blindtest-web.tar blindtest-web:latest

# Sur le serveur - Charger les images
docker load < blindtest-api.tar
docker load < blindtest-web.tar

# Redémarrer les services
docker compose restart blindtest-api blindtest-web

# Initialiser la DB sur le serveur
docker exec blindtest-api node dist/scripts/init-database.js

# Créer le super admin sur le serveur
docker exec blindtest-api node dist/scripts/create-super-admin-test.js
```

---

## 📊 État du projet

### ✅ Fonctionnalités implémentées

- Architecture multi-tenant complète
- Authentification JWT avec refresh tokens
- Interface super admin
- Interface admin par tenant
- Gestion des événements
- Gestion des équipes et joueurs
- Système de rounds et chansons
- Scoring en temps réel
- WebSocket pour communication temps réel
- Import/export CSV
- Paiements Stripe (mode test)
- Reset de mot de passe
- Système d'audit logs
- Déploiement Docker avec HTTPS

### 🔜 Prochaines étapes

- Tester l'application complète en production
- Configuration email SMTP pour les notifications
- Sauvegardes automatiques de la base de données
- Monitoring (Prometheus + Grafana)
- Tests fonctionnels complets

---

## 🏗️ Architecture

```
apps/
├── api/                    # Backend Node.js
│   ├── src/
│   │   ├── db/entities/    # Entités TypeORM (16 tables)
│   │   ├── modules/        # Modules métier
│   │   ├── middlewares/    # Auth, rate-limit, etc.
│   │   ├── services/       # Services partagés
│   │   ├── ws/             # WebSocket handlers
│   │   └── scripts/        # Scripts d'initialisation
│   └── Dockerfile
│
└── web/                    # Frontend Angular
    ├── src/app/
    │   ├── features/       # Modules fonctionnels
    │   │   ├── admin/      # Interface admin
    │   │   ├── player/     # Interface joueur
    │   │   ├── dj/         # Interface DJ
    │   │   ├── display/    # Affichage public
    │   │   ├── auth/       # Authentification
    │   │   └── super-admin/# Super admin
    │   ├── core/           # Services core
    │   └── shared/         # Composants partagés
    └── Dockerfile
```

---

## 📚 Documentation technique

Pour plus de détails sur le code et l'architecture, consultez [CLAUDE.md](CLAUDE.md).

---

## 🔒 Sécurité

- HTTPS avec certificat Let's Encrypt
- JWT avec rotation des tokens
- CORS configuré
- Rate limiting
- Helmet.js pour les headers de sécurité
- Validation des entrées avec Zod
- Isolation par tenant
- Audit logs pour traçabilité

---

## 📞 Support

En cas de problème :
1. Consulter la documentation dans les fichiers `.md`
2. Vérifier les logs : `docker logs <container_name>`
3. Tester les endpoints : `curl https://blindtest.codeharmony.fr/api/health`

---

**Dernière mise à jour :** 26 octobre 2025
**Version :** 1.0.0
**Statut :** ✅ Déployé en production
