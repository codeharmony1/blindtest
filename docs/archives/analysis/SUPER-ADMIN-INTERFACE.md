# 🎛️ Interface Super-Admin - Guide d'Utilisation

## 📋 Vue d'ensemble

L'interface web super-admin permet de superviser et gérer l'ensemble de la plateforme Blind Test Musical.

### URLs d'accès

- **Login** : `http://localhost:4200/backstage/login`
- **Dashboard** : `http://localhost:4200/backstage/dashboard`
- **Organisations** : `http://localhost:4200/backstage/organizations`
- **Événements Live** : `http://localhost:4200/backstage/events`
- **Audit Logs** : `http://localhost:4200/backstage/logs`

## 🔐 Authentification

### Identifiants Super-Admin

```
Email    : superadmin@blindtest.fr
Password : SuperAdmin2025!
```

### Mécanisme de sécurité

- **Guard** : Protection des routes via `superAdminGuard`
- **Interceptor** : Ajout automatique du token JWT aux requêtes `/api/backstage`
- **Storage** : Token et données admin stockés dans `localStorage`
  - `bt_super_admin_token` : Token JWT
  - `bt_super_admin` : Données du super-admin

## 🎨 Architecture Frontend

### Services

**SuperAdminService** ([`super-admin.service.ts`](apps/web/src/app/core/services/super-admin.service.ts))
- Authentification (login/logout)
- Gestion des tenants (CRUD, suspend, reactivate)
- Statistiques globales
- Événements live
- Audit logs

### Guards

**superAdminGuard** ([`super-admin.guard.ts`](apps/web/src/app/core/guards/super-admin.guard.ts))
- Vérifie l'authentification avant l'accès aux routes
- Redirige vers `/backstage/login` si non authentifié

### Interceptors

**superAdminAuthInterceptor** ([`super-admin-auth.interceptor.ts`](apps/web/src/app/core/interceptors/super-admin-auth.interceptor.ts))
- Ajoute automatiquement `Authorization: Bearer <token>` aux requêtes vers `/api/backstage`

### Composants

#### 1. Login ([`login.component.ts`](apps/web/src/app/features/super-admin/login.component.ts))
- Formulaire de connexion
- Gestion des erreurs (401, 400, erreurs réseau)
- Redirection automatique si déjà connecté
- Design moderne avec gradient violet

#### 2. Dashboard ([`dashboard.component.ts`](apps/web/src/app/features/super-admin/dashboard.component.ts))
- Cartes de statistiques :
  - 🏢 Organisations (total / actives)
  - 🎮 Événements (total / en cours)
  - 👥 Joueurs connectés
  - 👤 Utilisateurs admins
- Navigation vers les sections
- Bouton de déconnexion

#### 3. Organizations ([`organizations.component.ts`](apps/web/src/app/features/super-admin/organizations.component.ts))
- Liste des organisations (tenants)
- Filtres : statut, plan, recherche
- Actions :
  - Voir détails
  - Suspendre / Réactiver
  - Changer de plan (DEMO → PER_EVENT → MONTHLY)
  - Supprimer

#### 4. Events ([`events.component.ts`](apps/web/src/app/features/super-admin/events.component.ts))
- Liste des événements en cours (tous tenants)
- Informations :
  - Code événement
  - Nom
  - Organisation propriétaire
  - Nombre de joueurs/équipes

#### 5. Logs ([`logs.component.ts`](apps/web/src/app/features/super-admin/logs.component.ts))
- Historique des actions super-admin
- Filtres :
  - Admin ID
  - Type d'action
  - Type de cible
  - Période (date début/fin)
  - Limite de résultats

## 🚀 Guide de Test

### 1. Démarrage des serveurs

```bash
# Terminal 1 - API
npm run dev:api

# Terminal 2 - Web
npm run start:web
```

### 2. Test de l'authentification

1. Ouvrir : `http://localhost:4200/backstage/login`
2. Saisir les identifiants super-admin
3. Cliquer sur "Se connecter"
4. Vérifier la redirection vers le dashboard

### 3. Test du dashboard

1. Vérifier l'affichage des statistiques :
   - Organisations : 2 (total) / 2 (actives)
   - Événements : voir nombre réel
   - Joueurs : voir nombre réel
   - Utilisateurs : 1

2. Tester la navigation :
   - Cliquer sur "🏢 Organisations"
   - Cliquer sur "🎮 Événements Live"
   - Cliquer sur "📋 Audit Logs"

### 4. Test de la gestion des organisations

1. Aller sur `/backstage/organizations`
2. Vérifier la liste des tenants :
   - `Test Organization DEMO` (plan DEMO)
   - Autres tenants existants

3. Tester les filtres :
   - Filtrer par plan : `DEMO`
   - Rechercher par nom

4. Tester les actions :
   - **Suspendre** un tenant → vérifier le changement de statut
   - **Réactiver** un tenant → vérifier la réactivation
   - **Changer de plan** : DEMO → PER_EVENT
   - **Supprimer** (avec précaution !)

### 5. Test des événements live

1. Aller sur `/backstage/events`
2. Voir la liste des événements en cours
3. Vérifier les informations :
   - Nom de l'événement
   - Code
   - Organisation propriétaire
   - Statistiques (joueurs, équipes)

### 6. Test des audit logs

1. Aller sur `/backstage/logs`
2. Voir l'historique des actions effectuées
3. Tester les filtres :
   - Par action
   - Par période
   - Limiter les résultats

### 7. Test de la protection des routes

1. Se déconnecter depuis le dashboard
2. Essayer d'accéder à `/backstage/dashboard`
3. Vérifier la redirection vers `/backstage/login`

## 🔗 API Backend

L'interface communique avec les routes suivantes :

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/backstage/auth/login` | Connexion super-admin |
| GET | `/api/backstage/stats` | Statistiques globales |
| GET | `/api/backstage/tenants` | Liste des organisations |
| GET | `/api/backstage/tenants/:id` | Détails d'une organisation |
| PUT | `/api/backstage/tenants/:id/suspend` | Suspendre une organisation |
| PUT | `/api/backstage/tenants/:id/reactivate` | Réactiver une organisation |
| PUT | `/api/backstage/tenants/:id/plan` | Changer le plan d'abonnement |
| DELETE | `/api/backstage/tenants/:id` | Supprimer une organisation |
| GET | `/api/backstage/events/live` | Événements en cours |
| GET | `/api/backstage/audit-logs` | Logs d'audit |

## 📊 Plans d'abonnement

### DEMO (Gratuit)
- ✅ Événements illimités
- ✅ Joueurs illimités
- ✅ 5 utilisateurs max
- ⚠️ **5 chansons max par événement**

### PER_EVENT (19€ / événement)
- ✅ 1 événement à la fois
- ✅ Joueurs illimités
- ✅ 10 utilisateurs max
- ✅ Chansons illimitées

### MONTHLY (49€ / mois)
- ✅ Événements illimités
- ✅ Joueurs illimités
- ✅ Utilisateurs illimités
- ✅ Chansons illimitées
- ✅ Support prioritaire

## ✅ Tests effectués

- [x] Création d'un tenant DEMO via API
- [x] Test de la limitation 5 chansons DEMO
- [x] Démarrage de l'interface web
- [x] Configuration du guard et interceptor
- [ ] Test de connexion depuis l'interface
- [ ] Test du dashboard
- [ ] Test de la gestion des organisations
- [ ] Test des filtres et recherche
- [ ] Test des actions (suspend/reactivate/plan)

## 🎯 Prochaines étapes

1. ✅ Backend 100% fonctionnel
2. ✅ Interface web créée et configurée
3. ⏳ Tests utilisateur de l'interface
4. ⏳ Ajout de graphiques (Chart.js / Recharts)
5. ⏳ Notifications temps réel
6. ⏳ Export de données (CSV, PDF)
7. ⏳ Impersonation ("Se connecter en tant que")

---

**Date de création** : 04 octobre 2025
**Statut** : Interface déployée - Prête pour les tests
