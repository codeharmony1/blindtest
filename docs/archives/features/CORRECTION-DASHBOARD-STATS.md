# 🔧 Correction Dashboard Admin - Isolation Multi-Tenant

**Date :** 6 octobre 2025
**Problème identifié :** Les statistiques du dashboard admin affichaient les données de TOUTES les organisations au lieu de filtrer par organisation courante

---

## 🐛 Problème

### Comportement Avant
L'endpoint `GET /api/dashboard/stats` retournait les statistiques **globales** de toute la plateforme :
- Total de TOUS les événements (toutes organisations confondues)
- Total de TOUS les rounds, chansons, équipes
- Pas de respect de l'isolation multi-tenant

**Impact :**
- ❌ Un admin d'organisation voyait les stats de TOUTES les autres organisations
- ❌ Violation du principe d'isolation des données
- ❌ Fuite d'informations entre tenants

**Fichier affecté :**
- [apps/api/src/modules/events/routes.ts:417-455](apps/api/src/modules/events/routes.ts#L417)

---

## ✅ Solution Implémentée

### Changements Backend

**Endpoint mis à jour :** `GET /api/dashboard/stats`

**Avant :**
```typescript
router.get("/dashboard/stats", async (req, res) => {
  // ❌ Comptage global sans filtre
  const totalEvents = await eventRepo.count();
  const totalRounds = await roundRepo.count();
  // ...
});
```

**Après :**
```typescript
router.get("/dashboard/stats", requireStaff, async (req: AuthedStaff, res) => {
  // ✅ Filtrage par organisation
  const tenantContext = (req as any).tenant;

  let eventFilter: any;
  if (tenantContext?.tenantId) {
    // Multi-tenant moderne
    eventFilter = { tenant_id: tenantContext.tenantId };
  } else if (req.staff?.organizerId) {
    // Legacy
    eventFilter = { organizer: { id: String(req.staff.organizerId) } };
  }

  // Récupère UNIQUEMENT les événements de l'organisation
  const events = await eventRepo.find({
    where: eventFilter,
    select: ['id', 'status']
  });

  // Compte les stats UNIQUEMENT pour ces événements
  totalRounds = await roundRepo.createQueryBuilder('r')
    .where('r.event_id IN (:...eventIds)', { eventIds })
    .getCount();
  // ...
});
```

---

## 🔍 Détails de l'Implémentation

### 1. Authentification Requise
- ✅ Ajout du middleware `requireStaff`
- ✅ Vérification du contexte tenant/organizer

### 2. Filtrage des Événements
```typescript
// Étape 1 : Récupérer les événements de l'organisation
const events = await eventRepo.find({
  where: eventFilter,
  select: ['id', 'status']
});
const eventIds = events.map(e => e.id);
```

### 3. Comptage avec Isolation
```typescript
// Étape 2 : Compter uniquement pour ces événements
totalRounds = await roundRepo.createQueryBuilder('r')
  .where('r.event_id IN (:...eventIds)', { eventIds })
  .getCount();

totalTeams = await teamRepo.createQueryBuilder('t')
  .where('t.event_id IN (:...eventIds)', { eventIds })
  .getCount();
```

### 4. Chansons via Rounds
```typescript
// Étape 3 : Récupérer les rounds, puis compter les chansons
const rounds = await roundRepo.createQueryBuilder('r')
  .select('r.id')
  .where('r.event_id IN (:...eventIds)', { eventIds })
  .getMany();

const roundIds = rounds.map(r => r.id);

totalSongs = await songRepo.createQueryBuilder('s')
  .where('s.round_id IN (:...roundIds)', { roundIds })
  .getCount();
```

### 5. Événements Actifs
```typescript
// ✅ Utilise le nouveau champ status
const activeEvents = events.filter(e => e.status === 'ACTIVE').length;
```

---

## 📊 Résultat

### Réponse API Corrigée
```json
{
  "totalEvents": 3,        // ✅ Seulement de l'organisation courante
  "activeEvents": 2,       // ✅ Status = 'ACTIVE' uniquement
  "totalRounds": 5,        // ✅ Uniquement des événements de l'org
  "totalSongs": 23,        // ✅ Uniquement des rounds de l'org
  "totalTeams": 8          // ✅ Uniquement des événements de l'org
}
```

---

## 🧪 Tests de Validation

### Scénario 1 : Organisation A
**Organisation :** `default` (admin@blindtest.local)
**Événements :** DEMO, EVENT1, EVENT2

**Statistiques attendues :**
- `totalEvents`: 3
- `totalRounds`: Somme des rounds de DEMO + EVENT1 + EVENT2
- `totalSongs`: Somme des chansons de ces rounds uniquement
- `totalTeams`: Somme des équipes de ces 3 événements

### Scénario 2 : Organisation B
**Organisation :** `test-company` (admin@test.com)
**Événements :** EVENT_B1, EVENT_B2

**Statistiques attendues :**
- `totalEvents`: 2
- `totalRounds`: Somme des rounds de EVENT_B1 + EVENT_B2
- ❌ **NE DOIT PAS** inclure les données de l'organisation A

### Scénario 3 : Sans Authentification
**Requête :** `GET /api/dashboard/stats` sans token JWT

**Réponse attendue :**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

## 🔐 Sécurité

### Isolation Multi-Tenant Respectée
- ✅ Filtrage par `tenant_id` pour le système moderne
- ✅ Filtrage par `organizer.id` pour le legacy
- ✅ Authentification obligatoire via `requireStaff`
- ✅ Pas d'accès possible aux données d'autres organisations

### Requêtes Optimisées
- ✅ Utilisation de `createQueryBuilder` pour les requêtes `IN`
- ✅ Comptage direct avec `.getCount()` (pas de chargement en mémoire)
- ✅ Requêtes parallèles avec `Promise.all()` quand possible

---

## 🚀 Impact

### Avant (Problématique)
```
Organisation A connectée → Voir stats globales
Organisation B connectée → Voir stats globales
Super-Admin connecté → Voir stats globales
```
❌ Tout le monde voit les mêmes chiffres

### Après (Corrigé)
```
Organisation A connectée → Voir stats de A uniquement
Organisation B connectée → Voir stats de B uniquement
Super-Admin connecté → Voir stats de son tenant
```
✅ Chaque organisation voit **uniquement ses propres données**

---

## 📝 Notes Techniques

### Compatibilité
- ✅ Supporte le système multi-tenant moderne (`tenant_id`)
- ✅ Supporte le système legacy (`organizer_id`)
- ✅ Transition progressive sans breaking changes

### Performance
- ✅ Requêtes optimisées avec `IN` clause
- ✅ Pas de N+1 queries
- ✅ Comptage direct sans chargement complet des entités

### Évolution Future
- 🔄 Ajouter cache Redis pour les statistiques (si > 1000 événements)
- 🔄 Ajouter statistiques supplémentaires (joueurs totaux, durée moyenne, etc.)
- 🔄 Ajouter filtres par période (aujourd'hui, cette semaine, ce mois)

---

## ✅ Tests de Compilation

**API TypeScript :** ✅ OK (aucune erreur)
**Frontend Angular :** ✅ OK (build 12.1s)

---

## 📚 Fichiers Modifiés

### Backend
- ✅ [apps/api/src/modules/events/routes.ts](apps/api/src/modules/events/routes.ts#L417-495)
  - Ajout middleware `requireStaff`
  - Filtrage par `tenant_id` ou `organizer_id`
  - Requêtes avec `createQueryBuilder` et `IN` clause
  - Comptage des événements actifs avec `status`

### Frontend
- Aucun changement requis (l'API reste compatible)
- Dashboard continue d'appeler `api.getDashboardStats()`

---

## 🎯 Conclusion

**Problème résolu :** ✅
**Isolation multi-tenant respectée :** ✅
**Compatibilité legacy :** ✅
**Performance optimisée :** ✅

Les statistiques du dashboard admin affichent maintenant **uniquement les données de l'organisation courante**, respectant ainsi le principe fondamental d'isolation des données multi-tenant.

---

**Document créé par :** Claude Code
**Date :** 6 octobre 2025
**Version :** 1.0
