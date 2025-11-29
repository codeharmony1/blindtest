# Migration vers le Multi-Tenant

Ce guide détaille la migration de l'application Blind Test Musical vers une architecture multi-tenant avec système de paiement Stripe.

## 🎯 Nouveautés

- **Multi-tenant complet** : Plusieurs clients peuvent utiliser l'application simultanément
- **Système de paiement Stripe** : Abonnements et sessions temporaires
- **Gestion des utilisateurs par tenant** : Chaque client gère ses propres utilisateurs
- **Isolation des données** : Sécurité renforcée avec séparation stricte des données
- **Plans d'abonnement** : TRIAL, BASIC, PRO, ENTERPRISE
- **Sessions temporaires** : Paiements one-shot pour 2 jours, 1 semaine, 1 mois

## 📋 Prérequis

1. **Node.js 18+**
2. **MariaDB/MySQL**
3. **Compte Stripe** (pour les paiements)
4. **npm ou yarn**

## 🚀 Installation

### 1. Installation des dépendances

```bash
# Installer les nouvelles dépendances
cd apps/api
npm install stripe uuid
npm install --save-dev @types/uuid

# Ou avec yarn
yarn add stripe uuid
yarn add -D @types/uuid
```

### 2. Configuration des variables d'environnement

Copiez `.env.example` vers `.env` et configurez les variables :

```bash
cp .env.example .env
```

**Variables importantes à configurer :**

```env
# Stripe (obligatoire pour les paiements)
STRIPE_SECRET_KEY=sk_test_votre_clé_secrète_stripe
STRIPE_PUBLISHABLE_KEY=pk_test_votre_clé_publique_stripe
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook

# JWT (changez la clé en production)
JWT_SECRET=votre-clé-jwt-super-secrète

# Super Admin (changez en production)
SUPER_ADMIN_EMAIL=admin@votre-domaine.com
SUPER_ADMIN_PASSWORD=motdepasse-sécurisé
```

### 3. Migration de la base de données

```bash
# Exécuter la migration SQL
mysql -u root -p blindtest < src/db/migrations/001-create-multi-tenant-structure.sql

# Ou via un client MySQL/phpMyAdmin
```

### 4. Configuration Stripe

1. **Créer un compte Stripe** : https://dashboard.stripe.com/register
2. **Récupérer les clés API** dans Dashboard > Developers > API keys
3. **Configurer les webhooks** :
   - URL : `https://votre-domaine.com/api/payments/webhooks/stripe`
   - Événements à écouter :
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

## 🔄 Migration des données existantes

Les données existantes sont automatiquement migrées vers un tenant par défaut lors de l'exécution de la migration SQL.

**Tenant par défaut créé :**
- ID: `00000000-0000-0000-0000-000000000001`
- Nom: "Default Tenant"
- Slug: "default"
- Plan: ENTERPRISE (accès illimité)

## 🌐 Nouvelles routes API

### Gestion des tenants

```bash
# Inscription d'un nouveau tenant
POST /api/tenants/register
{
  "name": "Mon Entreprise",
  "slug": "mon-entreprise", // optionnel
  "ownerEmail": "admin@mon-entreprise.com",
  "ownerPassword": "motdepasse",
  "ownerName": "John Doe", // optionnel
  "plan": "TRIAL" // optionnel, par défaut TRIAL
}

# Connexion tenant
POST /api/tenants/login
{
  "email": "admin@mon-entreprise.com",
  "password": "motdepasse",
  "tenantSlug": "mon-entreprise"
}

# Infos du tenant actuel
GET /api/tenants/current
Authorization: Bearer your-jwt-token

# Gérer les utilisateurs du tenant
GET /api/tenants/users
POST /api/tenants/users
PUT /api/tenants/users/:userId
DELETE /api/tenants/users/:userId
```

### Paiements et abonnements

```bash
# Voir les tarifs
GET /api/payments/pricing

# Créer un checkout d'abonnement
POST /api/payments/checkout/subscription
{
  "plan": "BASIC", // BASIC, PRO, ENTERPRISE
  "successUrl": "https://votre-app.com/success",
  "cancelUrl": "https://votre-app.com/cancel"
}

# Créer un checkout de session temporaire
POST /api/payments/checkout/session
{
  "sessionType": "1week", // 2days, 1week, 1month
  "sessionName": "Événement été 2024",
  "successUrl": "https://votre-app.com/success",
  "cancelUrl": "https://votre-app.com/cancel"
}

# Portail client Stripe
POST /api/payments/portal
{
  "returnUrl": "https://votre-app.com/billing"
}

# Historique des paiements
GET /api/payments/history

# Sessions actives
GET /api/payments/sessions

# Statut de paiement
GET /api/payments/status
```

## 🔐 Authentification

### JWT Tokens

Les nouveaux tokens JWT contiennent :

```javascript
{
  userId: "uuid-utilisateur",
  tenantId: "uuid-tenant",
  role: "OWNER|ADMIN|DJ|VIEWER",
  email: "user@example.com",
  eventCode: "CODE123", // pour l'accès aux événements
  sessionId: "uuid-session", // pour les sessions temporaires
  exp: 1234567890
}
```

### Rôles utilisateur

- **OWNER** : Propriétaire du tenant, accès complet
- **ADMIN** : Gestion des événements et équipes
- **DJ** : Contrôle des rounds en live
- **VIEWER** : Accès lecture seule

## 🏗️ Architecture

### Isolation des données

- Chaque requête est automatiquement filtrée par `tenant_id`
- Middleware d'isolation tenant sur toutes les routes protégées
- Impossible d'accéder aux données d'un autre tenant

### Base de données

**Nouvelles tables :**
- `tenants` : Clients/tenants
- `tenant_users` : Utilisateurs par tenant
- `tenant_sessions` : Sessions payantes temporaires
- `payments` : Historique des paiements

**Tables modifiées :**
- Ajout de `tenant_id` sur toutes les tables existantes
- Relations avec les nouvelles entités tenant

## 💳 Plans et tarification

### Abonnements mensuels

| Plan | Prix | Événements | Joueurs | Utilisateurs |
|------|------|------------|---------|---------------|
| TRIAL | Gratuit (7j) | 1 | 20 | 2 |
| BASIC | 29€/mois | 5 | 100 | 5 |
| PRO | 79€/mois | Illimité | 500 | 20 |
| ENTERPRISE | 199€/mois | Illimité | Illimité | Illimité |

### Sessions temporaires

| Durée | Prix | Événements | Joueurs |
|-------|------|------------|---------|
| 2 jours | 19€ | Illimité | 100 |
| 1 semaine | 49€ | Illimité | 200 |
| 1 mois | 99€ | Illimité | 500 |

## 🛠️ Développement

### Démarrage

```bash
# Mode développement complet
npm run dev

# API seulement
npm run dev:api

# Web seulement
npm run start:web
```

### Tests

```bash
# Tests système
npm run validate:system -w @blindtest/api

# Santé de l'API
npm run check:health -w @blindtest/api
```

## 🔧 Résolution de problèmes

### Erreurs courantes

**Token invalide ou expiré**
- Vérifiez que `JWT_SECRET` est configuré
- Utilisez l'endpoint `/api/tenants/refresh-token`

**Webhook Stripe ne fonctionne pas**
- Vérifiez `STRIPE_WEBHOOK_SECRET`
- Testez avec l'outil CLI Stripe : `stripe listen --forward-to localhost:3000/api/payments/webhooks/stripe`

**Isolation tenant ne fonctionne pas**
- Vérifiez que le middleware est appliqué
- Consultez les logs pour les erreurs d'authentification

### Logs

```bash
# Logs de l'API
npm run dev:api

# Logs spécifiques
grep "tenant" logs/api.log
grep "stripe" logs/api.log
```

## 🚀 Déploiement Production

### Variables d'environnement production

```env
NODE_ENV=production
API_HOST=0.0.0.0
API_PORT=3000

# Base de données production
DB_HOST=votre-db-host
DB_USER=votre-db-user
DB_PASS=votre-db-password

# Stripe production
STRIPE_SECRET_KEY=sk_live_votre_clé_live
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_live

# JWT secret fort
JWT_SECRET=votre-clé-super-sécurisée-256-bits

# Super admin sécurisé
SUPER_ADMIN_EMAIL=admin@votre-domaine.com
SUPER_ADMIN_PASSWORD=motdepasse-très-sécurisé
```

### Build et déploiement

```bash
# Build production
npm run build

# Démarrer en production
NODE_ENV=production npm start
```

## 📞 Support

Pour toute question ou problème :

1. Vérifiez ce guide de migration
2. Consultez les logs de l'application
3. Vérifiez la configuration Stripe
4. Contactez l'équipe de développement

## 🎉 Migration terminée !

Votre application Blind Test Musical est maintenant multi-tenant avec paiements intégrés. Les utilisateurs peuvent :

1. **S'inscrire** avec un plan gratuit de 7 jours
2. **Souscrire** à un abonnement mensuel
3. **Acheter** des sessions temporaires
4. **Gérer** leurs utilisateurs et événements
5. **Payer** en toute sécurité via Stripe

Bon blind test ! 🎵