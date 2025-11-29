# Changelog - Unification du Système d'Authentification

## Version 2.0.0 - 2025-01-XX

### 🎯 Objectifs

Unifier le système d'authentification sur l'architecture multi-tenant pour simplifier la gestion des utilisateurs et résoudre les problèmes de réinitialisation de mot de passe.

### ✅ Changements Majeurs

#### 1. Système d'Authentification Unifié

**Avant :**
- Deux systèmes parallèles : `Organizer` (legacy) et `TenantUser` (multi-tenant)
- Confusion sur quelle table utiliser
- Réinitialisation de mot de passe incohérente

**Après :**
- Un seul système : `TenantUser` (multi-tenant)
- Table `organizers` obsolète (conservée pour compatibilité mais non utilisée)
- Authentification cohérente sur toute l'application

#### 2. Réinitialisation de Mot de Passe

**Corrections apportées :**

1. **URL dans les emails** :
   - ❌ Avant : `/reset-password?token=...`
   - ✅ Après : `/auth/reset-password?token=...`
   - Fichier : [`apps/api/src/services/email.service.ts:127`](apps/api/src/services/email.service.ts#L127)

2. **Routes de reset** :
   - Utilise maintenant uniquement `TenantUser`
   - Supporte les utilisateurs multi-tenant (même email dans plusieurs tenants)
   - Fichier : [`apps/api/src/modules/auth/password-reset.routes.ts`](apps/api/src/modules/auth/password-reset.routes.ts)

3. **Flux complet** :
   ```
   Utilisateur → Forgot Password → Email avec /auth/reset-password
   → Reset Password Form → API /api/auth/reset-password
   → Mise à jour TenantUser → Connexion via /api/tenants/login ✅
   ```

### 📁 Fichiers Modifiés

| Fichier | Changement | Description |
|---------|-----------|-------------|
| `apps/api/src/modules/auth/password-reset.routes.ts` | Majeur | Utilise uniquement TenantUser |
| `apps/api/src/services/email.service.ts` | Mineur | Correction URL reset (/auth/reset-password) |
| `apps/web/src/app/features/auth/reset-password/reset-password.component.ts` | Aucun | Déjà correct |
| `apps/web/src/app/core/services/tenant-auth.service.ts` | Aucun | Déjà correct |

### 🆕 Nouveaux Scripts

#### 1. `init-production.ts`
**But** : Initialiser proprement un environnement de production

**Usage** :
```bash
npx ts-node apps/api/init-production.ts email@example.com password123 "Admin Name"
```

**Ce qu'il fait** :
- Crée le tenant 'default' s'il n'existe pas
- Crée un compte admin OWNER
- Configure un abonnement PRO d'1 an
- Affiche un résumé détaillé

#### 2. `list-all-users.ts`
**But** : Lister tous les utilisateurs et tenants

**Usage** :
```bash
npx ts-node apps/api/list-all-users.ts
```

**Affiche** :
- Tous les tenants
- Tous les TenantUsers
- Tous les Organizers (legacy)

#### 3. `reset-user-password.ts`
**But** : Réinitialiser manuellement un mot de passe

**Usage** :
```bash
npx ts-node apps/api/reset-user-password.ts email@example.com newPassword123
```

**Ce qu'il fait** :
- Cherche dans TenantUser ET Organizer
- Réinitialise dans les deux systèmes si nécessaire
- Affiche les informations de connexion

### 🗑️ Code Legacy (Conservé mais Obsolète)

Les éléments suivants sont conservés pour rétrocompatibilité mais **ne doivent plus être utilisés** :

1. Table `organizers` - Utiliser `tenant_users` à la place
2. Routes `/api/auth/login` avec eventCode - Utiliser `/api/tenants/login` à la place
3. Routes `/api/auth/organizer-login` - Utiliser `/api/tenants/login` à la place

### 📋 Checklist de Migration

Pour migrer un environnement existant :

- [ ] Sauvegarder la base de données actuelle
- [ ] Identifier les comptes `organizers` existants
- [ ] Créer les comptes équivalents dans `tenant_users`
- [ ] Tester la connexion avec le nouveau système
- [ ] Tester la réinitialisation de mot de passe
- [ ] Vérifier les emails envoyés
- [ ] Supprimer les anciennes données de test

### 🔐 Sécurité

**Améliorations** :
- Validation du mot de passe (min 8 caractères)
- Tokens de reset valides 1 heure seulement
- Invalidation automatique des anciens tokens
- Rate limiting sur les routes d'authentification
- Réponses ambiguës pour éviter l'énumération d'utilisateurs

**Recommandations** :
- Utiliser des mots de passe d'au moins 12 caractères
- Changer le mot de passe après la première connexion
- Ne jamais partager les identifiants
- Utiliser HTTPS en production

### 📚 Documentation

Nouveaux documents créés :

1. **[MIGRATION-PRODUCTION.md](MIGRATION-PRODUCTION.md)** - Guide complet de migration
2. **[DEPLOIEMENT-RAPIDE.md](DEPLOIEMENT-RAPIDE.md)** - Guide de déploiement rapide
3. **[CHANGELOG-AUTH.md](CHANGELOG-AUTH.md)** - Ce document

Documents mis à jour :

1. **[README.md](README.md)** - Ajout section initialisation production

### 🧪 Tests

**À tester après déploiement** :

- [ ] Inscription nouveau compte
- [ ] Connexion avec compte existant
- [ ] Déconnexion
- [ ] Mot de passe oublié (demande)
- [ ] Email reçu avec bon lien
- [ ] Réinitialisation de mot de passe
- [ ] Connexion avec nouveau mot de passe
- [ ] Token expiré (après 1h)
- [ ] Token déjà utilisé

### 🚀 Déploiement

**Pour déployer cette version** :

1. Suivre le guide [DEPLOIEMENT-RAPIDE.md](DEPLOIEMENT-RAPIDE.md)
2. Ou le guide complet [MIGRATION-PRODUCTION.md](MIGRATION-PRODUCTION.md)

**Commande rapide** :
```bash
# Build et deploy
docker build -t blindtest-api:latest apps/api
docker save blindtest-api:latest > blindtest-api.tar
scp blindtest-api.tar user@server:/path/
ssh user@server
docker load < blindtest-api.tar
docker-compose up -d
docker exec -it blindtest-api npm run migrate:run
docker exec -it blindtest-api npx ts-node apps/api/init-production.ts email@example.com password "Name"
```

### 📊 Impact

**Utilisateurs affectés** :
- Tous les nouveaux utilisateurs : bénéficient du système unifié
- Utilisateurs existants : doivent recréer leur compte ou migration manuelle

**Breaking Changes** :
- Les comptes dans la table `organizers` ne peuvent plus se connecter via `/auth/login`
- Nécessite migration vers `tenant_users` ou utilisation de scripts

**Rétrocompatibilité** :
- Les routes legacy sont conservées mais dépréciées
- Migration graduelle possible
- Pas de perte de données des événements/jeux existants

### 🔮 Prochaines Étapes

**Court terme** :
- Surveiller les logs de production
- Recueillir les retours utilisateurs
- Optimiser les performances

**Moyen terme** :
- Supprimer complètement le code legacy (organizers)
- Ajouter l'authentification à deux facteurs
- Implémenter la gestion des sessions

**Long terme** :
- OAuth / SSO (Google, Microsoft)
- API publique avec API keys
- Audit trail complet

---

**Date** : 2025-01-XX
**Version** : 2.0.0
**Auteur** : Claude Code
**Statut** : ✅ Prêt pour production
