# API Super-Admin - Documentation

## Vue d'ensemble

L'API Super-Admin permet de gérer l'ensemble de la plateforme Blind Test Musical multi-tenant.

**Base URL :** `/api/backstage`
**Authentification :** Bearer Token JWT (durée : 1h)

---

## Authentification

### POST /api/backstage/auth/login

Authentifier un super-administrateur et obtenir un token JWT.

**Body :**
```json
{
  "email": "admin@blindtest.local",
  "password": "SuperAdmin123!"
}
```

**Response 200 :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "90214f74-ab19-44e4-831b-65f4d9a588d4",
    "email": "admin@blindtest.local",
    "name": "Super Admin Test",
    "lastLoginAt": "2025-10-03T21:11:34.637Z"
  }
}
```

**Errors :**
- `401 INVALID_CREDENTIALS` - Email ou mot de passe incorrect
- `400 MISSING_FIELDS` - Email ou password manquant

**Test curl :**
```bash
curl -X POST http://localhost:3001/api/backstage/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@blindtest.local","password":"SuperAdmin123!"}'
```

---

## Statistiques Globales

### GET /api/backstage/stats

Obtenir les statistiques globales de la plateforme.

**Headers :**
```
Authorization: Bearer <token>
```

**Response 200 :**
```json
{
  "tenantsCount": 2,
  "activeTenantsCount": 2,
  "totalEventsCount": 12,
  "liveEventsCount": 12,
  "totalUsersCount": 1,
  "totalPlayersCount": 28
}
```

**Test curl :**
```bash
curl -X GET http://localhost:3001/api/backstage/stats \
  -H "Authorization: Bearer <token>"
```

---

## Gestion des Organisations (Tenants)

### GET /api/backstage/tenants

Liste de tous les tenants avec statistiques.

**Headers :**
```
Authorization: Bearer <token>
```

**Query Parameters :**
- `status` (optional) - Filtrer par statut : ACTIVE, EXPIRED, CANCELLED, PAST_DUE
- `plan` (optional) - Filtrer par plan : DEMO, PER_EVENT, MONTHLY, TRIAL, BASIC, PRO, ENTERPRISE
- `search` (optional) - Recherche par nom, email ou slug

**Response 200 :**
```json
[
  {
    "id": "uuid",
    "name": "Organisation Name",
    "slug": "organisation-slug",
    "subscription_plan": "DEMO",
    "subscription_status": "ACTIVE",
    "billing_email": "contact@organisation.com",
    "is_active": true,
    "created_at": "2025-01-15T10:00:00.000Z",
    "users": [...],
    "events": [...],
    "stats": {
      "usersCount": 3,
      "eventsCount": 15,
      "activeEventsCount": 5
    }
  }
]
```

**Test curl :**
```bash
curl -X GET "http://localhost:3001/api/backstage/tenants?status=ACTIVE" \
  -H "Authorization: Bearer <token>"
```

---

### GET /api/backstage/tenants/:id

Détails complets d'un tenant spécifique.

**Headers :**
```
Authorization: Bearer <token>
```

**Response 200 :**
```json
{
  "id": "uuid",
  "name": "Organisation Name",
  "subscription_plan": "DEMO",
  "subscription_status": "ACTIVE",
  "stats": {
    "usersCount": 3,
    "eventsCount": 15,
    "activeEventsCount": 5,
    "totalPlayers": 450,
    "totalGames": 125,
    "sessionsCount": 2,
    "activeSessionsCount": 1
  }
}
```

**Errors :**
- `404 TENANT_NOT_FOUND` - Tenant introuvable

---

### PUT /api/backstage/tenants/:id/suspend

Suspendre un tenant (désactive tous ses événements).

**Headers :**
```
Authorization: Bearer <token>
```

**Body :**
```json
{
  "reason": "Abus détecté / Non-paiement / Autre"
}
```

**Response 200 :**
```json
{
  "success": true,
  "tenant": {
    "id": "uuid",
    "is_active": false,
    "subscription_status": "CANCELLED"
  }
}
```

**Audit Log :** Action `suspend_tenant` enregistrée

---

### PUT /api/backstage/tenants/:id/reactivate

Réactiver un tenant suspendu.

**Headers :**
```
Authorization: Bearer <token>
```

**Response 200 :**
```json
{
  "success": true,
  "tenant": {
    "id": "uuid",
    "is_active": true,
    "subscription_status": "ACTIVE"
  }
}
```

**Audit Log :** Action `reactivate_tenant` enregistrée

---

### PUT /api/backstage/tenants/:id/plan

Modifier le plan d'abonnement d'un tenant.

**Headers :**
```
Authorization: Bearer <token>
```

**Body :**
```json
{
  "plan": "DEMO" | "PER_EVENT" | "MONTHLY"
}
```

**Plans disponibles :**
- `DEMO` - Événements illimités, **5 chansons max/event**, gratuit
- `PER_EVENT` - 1 événement actif, chansons illimitées, paiement par event
- `MONTHLY` - Événements illimités, chansons illimitées, abonnement mensuel

**Response 200 :**
```json
{
  "success": true,
  "tenant": {
    "id": "uuid",
    "subscription_plan": "MONTHLY",
    "max_concurrent_events": 999,
    "max_players_per_event": 999
  }
}
```

**Errors :**
- `400 INVALID_PLAN` - Plan invalide

**Audit Log :** Action `update_plan` enregistrée

---

### DELETE /api/backstage/tenants/:id

Supprimer définitivement un tenant (cascade sur toutes ses données).

**Headers :**
```
Authorization: Bearer <token>
```

**Body :**
```json
{
  "confirmation": "DELETE"
}
```

**Response 200 :**
```json
{
  "success": true,
  "message": "Tenant deleted successfully"
}
```

**Errors :**
- `400 CONFIRMATION_REQUIRED` - Confirmation "DELETE" manquante
- `404 TENANT_NOT_FOUND` - Tenant introuvable

**⚠️ ATTENTION :** Suppression irréversible avec cascade sur :
- TenantUser
- Event
- Team
- Player
- Round
- RoundSong
- Answer
- Score

**Audit Log :** Action `delete_tenant` enregistrée

---

## Supervision des Sessions en Direct

### GET /api/backstage/events/live

Liste des événements en cours (tous tenants).

**Headers :**
```
Authorization: Bearer <token>
```

**Response 200 :**
```json
[
  {
    "id": "123",
    "code": "DEMO",
    "name": "Mariage Sophie",
    "tenant_id": "uuid",
    "tenant": {
      "id": "uuid",
      "name": "EventPro SARL"
    },
    "teams": [...],
    "playersCount": 42,
    "teamsCount": 8,
    "created_at": "2025-10-03T20:00:00.000Z"
  }
]
```

---

## Audit Logs

### GET /api/backstage/audit-logs

Historique des actions critiques des super-admins.

**Headers :**
```
Authorization: Bearer <token>
```

**Query Parameters :**
- `adminId` (optional) - Filtrer par super-admin
- `action` (optional) - Filtrer par type d'action
- `targetType` (optional) - Filtrer par type de cible (tenant, event, etc.)
- `startDate` (optional) - Date de début (ISO 8601)
- `endDate` (optional) - Date de fin (ISO 8601)
- `limit` (optional) - Nombre max de résultats (défaut: 100)

**Response 200 :**
```json
[
  {
    "id": "uuid",
    "admin_id": "uuid",
    "action": "suspend_tenant",
    "target_type": "tenant",
    "target_id": "uuid",
    "metadata_json": "{\"reason\":\"Abus détecté\"}",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "timestamp": "2025-10-03T21:00:00.000Z",
    "admin": {
      "id": "uuid",
      "email": "admin@blindtest.local",
      "name": "Super Admin Test"
    }
  }
]
```

**Actions trackées :**
- `login` / `logout`
- `create_tenant` / `update_tenant` / `delete_tenant`
- `suspend_tenant` / `reactivate_tenant`
- `update_plan`
- `stop_event` / `take_dj_control`
- `impersonate_tenant`

---

## Sécurité

### Authentification
- Token JWT avec expiration 1h
- Hash bcrypt pour les mots de passe (salt rounds: 10)
- `isSuperAdmin: true` dans le payload JWT

### Rate Limiting
- Routes protégées par `requireSuperAdmin` middleware
- Validation automatique du token à chaque requête

### Isolation
- Super-admins peuvent accéder à tous les tenants
- Bypass automatique de l'isolation tenant via `req.isSuperAdmin`

### Audit Trail
- Logs minimaux (90 jours de rétention recommandés)
- Actions critiques uniquement
- Stockage : IP, User-Agent, Metadata JSON

---

## Codes d'Erreur

| Code | Message | Description |
|------|---------|-------------|
| 400 | MISSING_FIELDS | Champs requis manquants |
| 400 | INVALID_PLAN | Plan d'abonnement invalide |
| 400 | CONFIRMATION_REQUIRED | Confirmation "DELETE" manquante |
| 401 | TOKEN_REQUIRED | Token d'authentification manquant |
| 401 | INVALID_CREDENTIALS | Email ou mot de passe incorrect |
| 401 | INVALID_TOKEN | Token invalide ou expiré |
| 403 | SUPER_ADMIN_REQUIRED | Accès super-admin requis |
| 404 | TENANT_NOT_FOUND | Tenant introuvable |
| 500 | SERVER_ERROR | Erreur serveur interne |

---

## Scripts Utilitaires

### Créer un super-admin (interactif)
```bash
cd apps/api
npm run create:super-admin
```

### Créer un super-admin de test (automatique)
```bash
cd apps/api
npm run create:super-admin:test
```

**Credentials de test créés :**
- Email: `admin@blindtest.local`
- Password: `SuperAdmin123!`

---

## Base de Données

### Tables créées
- `super_admins` - Comptes super-administrateurs
- `audit_logs` - Logs d'audit (FK vers super_admins)

### Migration
```bash
cd apps/api
npm run migrate:run
```

Migration : `1759525217343-CreateSuperAdminAndAuditLog.ts`

---

## Notes de Développement

### TODO
- [ ] Implémenter la logique d'événement "live" (statut actif)
- [ ] Ajouter le contrôle DJ depuis le super-admin
- [ ] Implémenter l'impersonation (se connecter en tant que)
- [ ] Ajouter MFA (2FA) pour les super-admins
- [ ] Créer une tâche cron pour nettoyer les logs > 90 jours
- [ ] Ajouter des alertes automatiques (abonnement expire, pic de connexions, etc.)

### Améliorations futures
- Notifications email aux super-admins
- Export de rapports (CSV, PDF)
- Dashboard analytics avec graphiques
- Gestion des paiements Stripe depuis le super-admin
- Webhooks pour intégrations externes

---

**Dernière mise à jour :** 03/10/2025
**Version API :** 1.0.0
**Statut :** ✅ Phase 1 Backend complète
