# Guide d'Utilisation - Système d'Abonnement

## Vue d'ensemble

Le système d'abonnement permet à plusieurs organisations (tenants) d'utiliser l'application Blindtest Musical de manière isolée et sécurisée.

---

## Plans d'Abonnement

### 🆓 Plan DEMO (Gratuit)
- **Prix**: 0€ (Gratuit à vie)
- **Événements**: Illimités
- **Joueurs**: Illimités
- **Utilisateurs**: 5 maximum
- **Limitation**: ⚠️ 5 chansons maximum par événement
- **Idéal pour**: Tester l'application, petites soirées

### 💰 Plan PER_EVENT (Paiement par événement)
- **Prix**: 19€ par événement
- **Événements**: 1 à la fois
- **Joueurs**: Illimités
- **Chansons**: Illimitées
- **Utilisateurs**: 10 maximum
- **Idéal pour**: Événements ponctuels, tests grandeur nature

### 🚀 Plan MONTHLY (Mensuel)
- **Prix**: 49€/mois
- **Événements**: Illimités simultanés
- **Joueurs**: Illimités
- **Chansons**: Illimitées
- **Utilisateurs**: Illimités
- **Support**: Prioritaire
- **Idéal pour**: Utilisation régulière, professionnels

---

## Sessions Temporaires

Alternative au plan mensuel pour des besoins ponctuels :

| Durée | Prix | Max Events | Max Joueurs/Event |
|-------|------|------------|-------------------|
| 2 jours | 19€ | Illimités | 100 |
| 1 semaine | 49€ | Illimités | 200 |
| 1 mois | 99€ | Illimités | 500 |

---

## Inscription d'un Nouveau Tenant

### Étape 1: Enregistrement

**Endpoint**: `POST /api/tenants/register`

**Requête**:
```json
{
  "name": "Ma Société",
  "slug": "ma-societe",
  "ownerEmail": "admin@masociete.com",
  "ownerPassword": "MotDePasseSecurise123!",
  "ownerName": "Jean Dupont",
  "plan": "DEMO"
}
```

**Réponse**:
```json
{
  "tenant": {
    "id": "uuid-tenant",
    "name": "Ma Société",
    "slug": "ma-societe",
    "plan": "DEMO",
    "expiresAt": null
  },
  "user": {
    "id": "uuid-user",
    "email": "admin@masociete.com",
    "role": "OWNER",
    "displayName": "Jean Dupont"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Le token JWT contient**:
- `userId`: ID de l'utilisateur
- `tenantId`: ID du tenant
- `role`: Rôle de l'utilisateur (OWNER, ADMIN, USER)
- `email`: Email de l'utilisateur

---

## Connexion

### Connexion Utilisateur

**Endpoint**: `POST /api/tenants/login`

**Requête**:
```json
{
  "email": "admin@masociete.com",
  "password": "MotDePasseSecurise123!",
  "tenantSlug": "ma-societe"
}
```

**Alternative avec ID tenant**:
```json
{
  "email": "admin@masociete.com",
  "password": "MotDePasseSecurise123!",
  "tenantId": "uuid-tenant"
}
```

**Réponse**:
```json
{
  "user": {
    "id": "uuid-user",
    "email": "admin@masociete.com",
    "role": "OWNER",
    "displayName": "Jean Dupont"
  },
  "tenant": {
    "id": "uuid-tenant",
    "name": "Ma Société",
    "slug": "ma-societe",
    "plan": "DEMO"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token..."
}
```

### Rafraîchir le Token

**Endpoint**: `POST /api/tenants/refresh-token`

**Requête**:
```json
{
  "refreshToken": "refresh-token..."
}
```

---

## Gestion du Tenant

### Obtenir les Informations du Tenant

**Endpoint**: `GET /api/tenants/current`

**Headers**:
```
Authorization: Bearer <token>
```

**Réponse**:
```json
{
  "tenant": {
    "id": "uuid-tenant",
    "name": "Ma Société",
    "slug": "ma-societe",
    "plan": "DEMO",
    "status": "ACTIVE",
    "expiresAt": null,
    "limits": {
      "maxEvents": 999,
      "maxPlayersPerEvent": 999,
      "maxUsers": 5
    }
  },
  "usage": {
    "eventsCount": 3,
    "usersCount": 2,
    "activeSessionsCount": 0,
    "totalPlayersCount": 45
  }
}
```

### Mettre à Jour le Tenant

**Endpoint**: `PUT /api/tenants/current`

**Permissions**: OWNER uniquement

**Requête**:
```json
{
  "name": "Nouveau Nom",
  "customDomain": "blindtest.monentreprise.com"
}
```

---

## Gestion des Utilisateurs

### Lister les Utilisateurs

**Endpoint**: `GET /api/tenants/users`

**Permissions**: OWNER, ADMIN

**Réponse**:
```json
{
  "users": [
    {
      "id": "uuid-1",
      "email": "admin@masociete.com",
      "role": "OWNER",
      "displayName": "Jean Dupont",
      "isActive": true,
      "lastLoginAt": "2025-10-12T18:00:00Z",
      "createdAt": "2025-10-01T10:00:00Z"
    },
    {
      "id": "uuid-2",
      "email": "manager@masociete.com",
      "role": "ADMIN",
      "displayName": "Marie Martin",
      "isActive": true,
      "lastLoginAt": "2025-10-12T17:30:00Z",
      "createdAt": "2025-10-05T14:00:00Z"
    }
  ]
}
```

### Créer un Utilisateur

**Endpoint**: `POST /api/tenants/users`

**Permissions**: OWNER uniquement

**Requête**:
```json
{
  "email": "nouveau@masociete.com",
  "password": "MotDePasse123!",
  "role": "ADMIN",
  "displayName": "Nouveau Collaborateur",
  "firstName": "Nouveau",
  "lastName": "Collaborateur"
}
```

**Rôles disponibles**:
- `OWNER`: Propriétaire (1 seul par tenant)
- `ADMIN`: Administrateur (gestion événements et utilisateurs)
- `USER`: Utilisateur standard (accès limité)

### Mettre à Jour un Utilisateur

**Endpoint**: `PUT /api/tenants/users/:userId`

**Permissions**: OWNER pour tout, ADMIN pour USER uniquement

**Requête**:
```json
{
  "displayName": "Nouveau Nom",
  "role": "USER",
  "isActive": false
}
```

### Supprimer un Utilisateur

**Endpoint**: `DELETE /api/tenants/users/:userId`

**Permissions**: OWNER uniquement

**Note**: Impossible de supprimer le OWNER

---

## Gestion des Paiements

### Obtenir les Tarifs

**Endpoint**: `GET /api/payments/pricing`

**Public**: Pas d'authentification requise

**Réponse**: Voir section "Plans d'Abonnement" ci-dessus

### Créer une Session de Checkout (Abonnement)

**Endpoint**: `POST /api/payments/checkout/subscription`

**Permissions**: OWNER uniquement

**Requête**:
```json
{
  "plan": "MONTHLY",
  "successUrl": "https://monapp.com/success",
  "cancelUrl": "https://monapp.com/cancel"
}
```

**Réponse**:
```json
{
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

**Rediriger l'utilisateur vers `checkoutUrl`**

### Créer une Session Temporaire

**Endpoint**: `POST /api/payments/checkout/session`

**Permissions**: OWNER, ADMIN

**Requête**:
```json
{
  "sessionType": "1week",
  "sessionName": "Semaine Halloween 2025",
  "successUrl": "https://monapp.com/success",
  "cancelUrl": "https://monapp.com/cancel"
}
```

**Types disponibles**: `2days`, `1week`, `1month`

### Portail Client Stripe

**Endpoint**: `POST /api/payments/portal`

**Permissions**: OWNER uniquement

**Requête**:
```json
{
  "returnUrl": "https://monapp.com/settings"
}
```

**Réponse**:
```json
{
  "portalUrl": "https://billing.stripe.com/session/..."
}
```

Permet au client de:
- Gérer son abonnement
- Voir les factures
- Mettre à jour les moyens de paiement
- Annuler l'abonnement

### Historique des Paiements

**Endpoint**: `GET /api/payments/history`

**Permissions**: OWNER, ADMIN

**Réponse**:
```json
{
  "payments": [
    {
      "id": "pay-uuid-1",
      "type": "SUBSCRIPTION",
      "status": "PAID",
      "amount": 49.00,
      "currency": "EUR",
      "description": "Abonnement Mensuel - Octobre 2025",
      "createdAt": "2025-10-01T10:00:00Z",
      "paidAt": "2025-10-01T10:05:00Z"
    }
  ]
}
```

### Sessions Actives

**Endpoint**: `GET /api/payments/sessions`

**Permissions**: OWNER, ADMIN

**Réponse**:
```json
{
  "sessions": [
    {
      "id": "session-uuid",
      "name": "Semaine Halloween 2025",
      "description": "Session temporaire 1 semaine",
      "durationDays": 7,
      "startsAt": "2025-10-25T00:00:00Z",
      "expiresAt": "2025-11-01T23:59:59Z",
      "isActive": true,
      "daysRemaining": 5,
      "usage": {
        "eventsUsed": 3,
        "playersTotal": 150
      },
      "limits": {
        "maxEvents": 10,
        "maxPlayersPerEvent": 200,
        "maxTotalPlayers": 1000
      }
    }
  ]
}
```

### Statut d'Abonnement

**Endpoint**: `GET /api/payments/status`

**Permissions**: Authentifié

**Réponse**:
```json
{
  "subscription": {
    "plan": "DEMO",
    "status": "ACTIVE",
    "expiresAt": null,
    "isActive": true
  },
  "limits": {
    "maxEvents": 999,
    "maxPlayersPerEvent": 999,
    "maxUsers": 5
  },
  "usage": {
    "eventsCount": 3,
    "usersCount": 2,
    "activeSessionsCount": 0,
    "totalPlayersCount": 45
  },
  "hasActiveSession": false,
  "canCreateEvent": true
}
```

### Annuler l'Abonnement

**Endpoint**: `POST /api/payments/subscription/cancel`

**Permissions**: OWNER uniquement

**Réponse**:
```json
{
  "message": "Subscription cancelled successfully"
}
```

**Note**: L'annulation prend effet à la fin de la période payée

---

## Authentification des Requêtes

Toutes les routes protégées nécessitent un header d'authentification:

```
Authorization: Bearer <token-jwt>
```

### Exemple avec cURL

```bash
curl -X GET https://api.blindtest.com/api/tenants/current \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Exemple avec Axios (JavaScript)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.blindtest.com',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const response = await api.get('/api/tenants/current');
```

---

## Hiérarchie des Permissions

### OWNER (Propriétaire)
- ✅ Toutes les permissions
- ✅ Gérer l'abonnement
- ✅ Créer/Modifier/Supprimer utilisateurs
- ✅ Gérer le tenant
- ✅ Créer/Gérer événements

### ADMIN (Administrateur)
- ✅ Créer/Gérer événements
- ✅ Voir les utilisateurs
- ✅ Créer sessions temporaires
- ❌ Modifier l'abonnement
- ❌ Gérer les utilisateurs OWNER/ADMIN

### USER (Utilisateur)
- ✅ Participer aux événements
- ✅ Voir les statistiques
- ❌ Créer/Gérer événements
- ❌ Voir/Gérer utilisateurs
- ❌ Gérer paiements

---

## Codes d'Erreur

| Code | Description | Status HTTP |
|------|-------------|-------------|
| `TOKEN_REQUIRED` | Token d'authentification manquant | 401 |
| `INVALID_TOKEN` | Token invalide ou expiré | 401 |
| `UNAUTHORIZED` | Authentification tenant requise | 401 |
| `INSUFFICIENT_PERMISSIONS` | Permissions insuffisantes | 403 |
| `TENANT_ACCESS_DENIED` | Accès refusé pour ce tenant | 403 |
| `SUPER_ADMIN_REQUIRED` | Accès super admin requis | 403 |
| `TENANT_NOT_FOUND` | Tenant introuvable | 404 |
| `USER_NOT_FOUND` | Utilisateur introuvable | 404 |
| `SLUG_ALREADY_EXISTS` | Slug déjà utilisé | 409 |
| `EMAIL_ALREADY_EXISTS` | Email déjà enregistré | 409 |
| `USER_LIMIT_REACHED` | Limite d'utilisateurs atteinte | 403 |
| `TENANT_SUSPENDED` | Tenant suspendu | 403 |
| `SUBSCRIPTION_EXPIRED` | Abonnement expiré | 403 |

---

## Scénario d'Utilisation Complet

### 1. Inscription

```bash
# Créer un nouveau tenant
curl -X POST http://localhost:3001/api/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ma Société",
    "slug": "ma-societe",
    "ownerEmail": "admin@masociete.com",
    "ownerPassword": "SecurePass123!",
    "ownerName": "Jean Dupont",
    "plan": "DEMO"
  }'
```

### 2. Connexion

```bash
# Se connecter
curl -X POST http://localhost:3001/api/tenants/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@masociete.com",
    "password": "SecurePass123!",
    "tenantSlug": "ma-societe"
  }'
```

### 3. Vérifier le Statut

```bash
# Obtenir le statut d'abonnement
curl -X GET http://localhost:3001/api/payments/status \
  -H "Authorization: Bearer <token>"
```

### 4. Créer un Utilisateur

```bash
# Ajouter un collaborateur
curl -X POST http://localhost:3001/api/tenants/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "collegue@masociete.com",
    "password": "Pass123!",
    "role": "ADMIN",
    "displayName": "Marie Martin"
  }'
```

### 5. Passer au Plan Payant

```bash
# Créer une session de checkout
curl -X POST http://localhost:3001/api/payments/checkout/subscription \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "MONTHLY",
    "successUrl": "http://monapp.com/success",
    "cancelUrl": "http://monapp.com/cancel"
  }'

# Rediriger vers checkoutUrl retourné
```

---

## Tests Automatisés

Un script de test complet est disponible:

```bash
cd apps/api
npx ts-node test-subscription-complete.ts
```

**Tests effectués**:
- ✅ Inscription tenant
- ✅ Vérification slug
- ✅ Connexion
- ✅ Récupération infos tenant
- ✅ Tarification
- ✅ Statut paiement
- ✅ Historique paiements
- ✅ Sessions actives
- ✅ Gestion utilisateurs
- ✅ Mise à jour tenant
- ✅ Vérification limites

---

## Support

Pour toute question ou problème:

1. Vérifiez la documentation API
2. Consultez les logs serveur
3. Vérifiez le statut de votre abonnement
4. Contactez le support technique

---

## Changelog

### Version 1.0.0 (12 octobre 2025)
- ✅ Système multi-tenant complet
- ✅ 3 plans d'abonnement
- ✅ Sessions temporaires
- ✅ Gestion utilisateurs et permissions
- ✅ Intégration Stripe (checkout et webhooks)
- ✅ Tests automatisés
- ✅ Sécurité et isolation tenant
